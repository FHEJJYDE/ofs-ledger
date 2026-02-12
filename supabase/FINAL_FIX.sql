-- ============================================
-- FINAL FIX FOR RLS ISSUES
-- ============================================
-- This fixes the is_admin function to properly bypass RLS

-- 1. Drop and recreate the is_admin function with proper settings
DROP FUNCTION IF EXISTS public.is_admin(UUID);

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Query the profiles table directly, bypassing RLS
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = user_id
    LIMIT 1;
    
    -- Return true if role is admin
    RETURN COALESCE(user_role = 'admin', false);
EXCEPTION
    WHEN OTHERS THEN
        -- If any error occurs, return false
        RETURN false;
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon;

-- 3. Recreate all policies with the fixed function
-- PROFILES TABLE
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.profiles;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Allow trigger to insert profiles
CREATE POLICY "Enable insert for service role"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

-- 4. Test the function
DO $$
DECLARE
    test_result BOOLEAN;
BEGIN
    -- Test with your admin user ID (replace with actual ID if needed)
    SELECT public.is_admin(auth.uid()) INTO test_result;
    RAISE NOTICE 'Admin check result: %', test_result;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the function works:
-- SELECT public.is_admin(auth.uid());
-- Should return true for admin users, false for others
