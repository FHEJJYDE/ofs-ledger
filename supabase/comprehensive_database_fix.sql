-- ============================================
-- COMPREHENSIVE DATABASE FIX
-- Fixes user count display and currency management issues
-- ============================================

-- SECTION 1: Helper Functions
-- ============================================

-- Create a helper function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.check_is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    -- Check admin_users table first
    IF EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = check_is_admin.user_id) THEN
        RETURN TRUE;
    END IF;

    -- Check profiles table
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = check_is_admin.user_id AND role = 'admin') THEN
        RETURN TRUE;
    END IF;

    -- Hardcoded admin email as fallback
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = check_is_admin.user_id AND email = 'pastendro@gmail.com') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Grant permissions on check_is_admin function
GRANT EXECUTE ON FUNCTION public.check_is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_admin(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_is_admin(UUID) TO anon;


-- SECTION 2: Profiles RPC Function
-- ============================================

-- Create or replace the get_all_profiles RPC function
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF public.check_is_admin(auth.uid()) THEN
     -- If admin, return all profiles
     RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
  ELSE
     -- If not admin, just return own profile
     RETURN QUERY SELECT * FROM public.profiles WHERE id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permission on get_all_profiles
GRANT EXECUTE ON FUNCTION public.get_all_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_profiles() TO service_role;


-- SECTION 3: Profiles RLS Policies
-- ============================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Create new policies
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles" 
ON public.profiles FOR INSERT 
WITH CHECK (public.check_is_admin(auth.uid()));


-- SECTION 4: Coin Balances Table
-- ============================================

-- Ensure coin_balances table exists
CREATE TABLE IF NOT EXISTS public.coin_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_symbol TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Ensure each user can only have one balance per coin type
  CONSTRAINT unique_user_coin UNIQUE (user_id, coin_symbol)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS coin_balances_user_id_idx ON public.coin_balances(user_id);
CREATE INDEX IF NOT EXISTS coin_balances_coin_symbol_idx ON public.coin_balances(coin_symbol);


-- SECTION 5: Coin Balances RPC Functions
-- ============================================

-- Function to update or insert a user's coin balance
CREATE OR REPLACE FUNCTION public.update_user_coin_balance(
  p_user_id UUID,
  p_coin_symbol TEXT,
  p_balance NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update the balance
  INSERT INTO public.coin_balances (user_id, coin_symbol, balance, last_updated, updated_by)
  VALUES (p_user_id, p_coin_symbol, p_balance, NOW(), auth.uid())
  ON CONFLICT (user_id, coin_symbol) 
  DO UPDATE SET 
    balance = p_balance,
    last_updated = NOW(),
    updated_by = auth.uid();
END;
$$;

-- Grant permissions on update_user_coin_balance
GRANT EXECUTE ON FUNCTION public.update_user_coin_balance(UUID, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_coin_balance(UUID, TEXT, NUMERIC) TO service_role;


-- Function to get a user's coin balances
CREATE OR REPLACE FUNCTION public.get_user_coin_balances(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  coin_symbol TEXT,
  balance NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, user_id, coin_symbol, balance, last_updated
  FROM public.coin_balances
  WHERE user_id = p_user_id
  ORDER BY coin_symbol;
$$;

-- Grant permissions on get_user_coin_balances
GRANT EXECUTE ON FUNCTION public.get_user_coin_balances(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_coin_balances(UUID) TO service_role;


-- SECTION 6: Coin Balances RLS Policies
-- ============================================

-- Enable RLS on coin_balances table
ALTER TABLE public.coin_balances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own coin balances" ON public.coin_balances;
DROP POLICY IF EXISTS "Admins can read all coin balances" ON public.coin_balances;
DROP POLICY IF EXISTS "Admins can update all coin balances" ON public.coin_balances;
DROP POLICY IF EXISTS "Admins can insert coin balances" ON public.coin_balances;

-- Create new policies
CREATE POLICY "Users can view their own coin balances" 
ON public.coin_balances FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all coin balances" 
ON public.coin_balances FOR SELECT 
USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can update all coin balances" 
ON public.coin_balances FOR UPDATE 
USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can insert coin balances" 
ON public.coin_balances FOR INSERT 
WITH CHECK (public.check_is_admin(auth.uid()));


-- SECTION 7: Sync Admin Users
-- ============================================

-- Ensure admin_users table has unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'admin_users_user_id_key' 
    ) THEN
        ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Sync admin users from profiles table to admin_users table
INSERT INTO public.admin_users (user_id, role)
SELECT id, 'admin'
FROM public.profiles
WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;


-- SECTION 8: Verification Queries
-- ============================================

-- You can run these queries after the migration to verify everything is set up correctly:

-- 1. Check if get_all_profiles function exists
-- SELECT routine_name FROM information_schema.routines WHERE routine_name = 'get_all_profiles';

-- 2. Check if coin balance functions exist
-- SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('get_user_coin_balances', 'update_user_coin_balance');

-- 3. Check RLS policies on profiles
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 4. Check RLS policies on coin_balances
-- SELECT * FROM pg_policies WHERE tablename = 'coin_balances';

-- 5. Test get_all_profiles (should return all profiles if you're admin)
-- SELECT * FROM public.get_all_profiles();
