-- ============================================
-- SUPER ADMIN FIX V2 - THE "NUCLEAR OPTION"
-- ============================================
-- This script fixes the "infinite recursion" issue in RLS policies
-- and FORCE-SYNCS the admin users.

-- 1. Create a definitive "is_admin" function that avoids recursion
-- SECURITY DEFINER = runs with privileges of the creator (usually postgres/service_role)
-- This bypasses RLS on the tables it queries, preventing the recursion loop.
CREATE OR REPLACE FUNCTION public.check_is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    -- Check admin_users table first (fastest)
    IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = check_is_admin.user_id) THEN
        RETURN TRUE;
    END IF;

    -- Check profiles table (but because this function is SECURITY DEFINER, it won't trigger RLS recursion)
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = check_is_admin.user_id AND role = 'admin') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.check_is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_admin(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_is_admin(UUID) TO anon;


-- 2. SYNC ADMINS: Ensure everyone with 'admin' role in profiles is in admin_users
INSERT INTO public.admin_users (user_id, role)
SELECT id, 'admin'
FROM public.profiles
WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;


-- 3. REWRITE PROFILES POLICIES TO USE THE SAFE FUNCTION
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Basic user policies
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- Admin policies using the SAFE function
CREATE POLICY "Admins can view all profiles" ON public.profiles 
FOR SELECT USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles 
FOR UPDATE USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles" ON public.profiles 
FOR INSERT WITH CHECK (public.check_is_admin(auth.uid()));


-- 4. FIX THE RPC FUNCTION TO BE SAFE TOO
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Explicit check using our safe function
  IF public.check_is_admin(auth.uid()) THEN
     RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
  ELSE
     -- Fallback for non-admins
     RETURN QUERY SELECT * FROM public.profiles WHERE id = auth.uid();
  END IF;
END;
$$;
