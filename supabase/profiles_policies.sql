-- ============================================
-- PROFILES RLS & RPC FIX SCRIPT
-- ============================================

-- 1. Create or Replace get_all_profiles RPC function
-- This function allows admins to fetch all profiles efficiently, bypassing RLS if needed (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ) AND NOT EXISTS (
     SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
     -- If not admin, just return own profile
     RETURN QUERY SELECT * FROM public.profiles WHERE id = auth.uid();
  ELSE
     -- If admin, return all
     RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_all_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_profiles() TO service_role;

-- 2. Update Profiles RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Allow admins to view all profiles
-- RLS policy that relies on admin_users table or role column
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) 
  OR 
  (auth.jwt() ->> 'email') = 'pastendro@gmail.com'
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow admins to update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) 
  OR 
  (auth.jwt() ->> 'email') = 'pastendro@gmail.com'
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow admins to insert profiles (rare, usually handled by triggers)
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) 
  OR 
  (auth.jwt() ->> 'email') = 'pastendro@gmail.com'
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 3. Ensure Service Role can do everything
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;
-- Service role bypasses RLS by default, but explicit policies can sometimes help debugging or consistency
-- Actually, we don't need a policy for service role if we rely on bypass_rls privilege, but usually triggers run with it.
-- We'll leave it as is.
