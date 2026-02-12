-- ============================================
-- OFSLEDGER COMPLETE DATABASE SETUP + RLS FIX
-- ============================================
-- Run this ENTIRE script in Supabase SQL Editor
-- This will fix all RLS issues and set up the database properly

-- ============================================
-- STEP 1: Create helper function to bypass RLS
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 2: Fix profiles table RLS policies
-- ============================================
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.profiles;

-- Create new policies using the helper function
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

-- Allow service role to insert profiles (for the trigger)
CREATE POLICY "Enable insert for service role"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

-- ============================================
-- STEP 3: Fix wallet_connections policies
-- ============================================
DROP POLICY IF EXISTS "Admins can view all wallet connections" ON public.wallet_connections;
DROP POLICY IF EXISTS "Admins can insert wallet connections" ON public.wallet_connections;

CREATE POLICY "Admins can view all wallet connections"
    ON public.wallet_connections FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert wallet connections"
    ON public.wallet_connections FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = user_id);

-- ============================================
-- STEP 4: Fix wallet_details policies
-- ============================================
DROP POLICY IF EXISTS "Admins can view all wallet details" ON public.wallet_details;
DROP POLICY IF EXISTS "Admins can update all wallet details" ON public.wallet_details;
DROP POLICY IF EXISTS "Admins can insert wallet details" ON public.wallet_details;

CREATE POLICY "Admins can view all wallet details"
    ON public.wallet_details FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all wallet details"
    ON public.wallet_details FOR UPDATE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert wallet details"
    ON public.wallet_details FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = user_id);

-- ============================================
-- STEP 5: Fix user_wallets policies
-- ============================================
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can update all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can insert wallets" ON public.user_wallets;

CREATE POLICY "Admins can view all wallets"
    ON public.user_wallets FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all wallets"
    ON public.user_wallets FOR UPDATE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert wallets"
    ON public.user_wallets FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = user_id);

-- ============================================
-- STEP 6: Fix withdrawals policies
-- ============================================
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can update all withdrawals" ON public.withdrawals;

CREATE POLICY "Admins can view all withdrawals"
    ON public.withdrawals FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all withdrawals"
    ON public.withdrawals FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- ============================================
-- STEP 7: Fix kyc_documents policies
-- ============================================
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can update KYC documents" ON public.kyc_documents;

CREATE POLICY "Admins can view all KYC documents"
    ON public.kyc_documents FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update KYC documents"
    ON public.kyc_documents FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- ============================================
-- STEP 8: Fix coin_balances policies
-- ============================================
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

-- ============================================
-- DONE! 
-- ============================================
-- After running this script:
-- 1. Close and reopen your browser
-- 2. Clear browser cache (Ctrl+Shift+Delete)
-- 3. Log in again
-- 4. You should now see all users and be able to connect wallets
