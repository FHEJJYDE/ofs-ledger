-- ============================================
-- FIX FOR RLS CIRCULAR DEPENDENCY
-- ============================================
-- Run this script in Supabase SQL Editor to fix the 500 errors
-- This creates a helper function that bypasses RLS for admin checks

-- 1. Create a helper function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.profiles;

-- 3. Create new policies using the helper function
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- 4. Allow service role to insert profiles (for the trigger)
CREATE POLICY "Enable insert for service role"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

-- 5. Update wallet_connections policies
DROP POLICY IF EXISTS "Admins can view all wallet connections" ON public.wallet_connections;
CREATE POLICY "Admins can view all wallet connections"
    ON public.wallet_connections FOR SELECT
    USING (public.is_admin(auth.uid()));

-- 6. Update wallet_details policies
DROP POLICY IF EXISTS "Admins can view all wallet details" ON public.wallet_details;
DROP POLICY IF EXISTS "Admins can update all wallet details" ON public.wallet_details;

CREATE POLICY "Admins can view all wallet details"
    ON public.wallet_details FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all wallet details"
    ON public.wallet_details FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- 7. Update coin_balances policies
DROP POLICY IF EXISTS "Admins can read all coin balances" ON public.coin_balances;
DROP POLICY IF EXISTS "Admins can update all coin balances" ON public.coin_balances;
DROP POLICY IF EXISTS "Admins can insert coin balances" ON public.coin_balances;

CREATE POLICY "Admins can read all coin balances"
    ON public.coin_balances FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all coin balances"
    ON public.coin_balances FOR UPDATE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert coin balances"
    ON public.coin_balances FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- 8. Update user_wallets policies
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can update all wallets" ON public.user_wallets;

CREATE POLICY "Admins can view all wallets"
    ON public.user_wallets FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all wallets"
    ON public.user_wallets FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- 9. Update withdrawals policies
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can update all withdrawals" ON public.withdrawals;

CREATE POLICY "Admins can view all withdrawals"
    ON public.withdrawals FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all withdrawals"
    ON public.withdrawals FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- 10. Update kyc_documents policies
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can update KYC documents" ON public.kyc_documents;

CREATE POLICY "Admins can view all KYC documents"
    ON public.kyc_documents FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update KYC documents"
    ON public.kyc_documents FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the fix worked:

-- Check if is_admin function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'is_admin';

-- Check profiles table policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================
-- DONE!
-- ============================================
-- After running this script:
-- 1. Refresh your browser
-- 2. Try logging in again
-- 3. The 500 errors should be gone
