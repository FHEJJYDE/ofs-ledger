-- ============================================
-- OFSLEDGER DEFINITIVE DATABASE FIX
-- ============================================
-- Run this ENTIRE script in Supabase SQL Editor.
-- This combines the robust security function with policies for ALL tables.
-- It fixes 'No users found', 'Wallet connection timeout', and real-time data issues.

-- 1. Create robust helper function (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = user_id
    LIMIT 1;
    RETURN COALESCE(user_role = 'admin', false);
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon;

-- 2. RESET & FIX PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Enable insert for service role" ON public.profiles FOR INSERT WITH CHECK (true);

-- 3. RESET & FIX WALLET CONNECTIONS POLICIES
DROP POLICY IF EXISTS "Admins can view all wallet connections" ON public.wallet_connections;
DROP POLICY IF EXISTS "Admins can insert wallet connections" ON public.wallet_connections;
DROP POLICY IF EXISTS "Users can view own wallet connections" ON public.wallet_connections;
DROP POLICY IF EXISTS "Users can insert own wallet connections" ON public.wallet_connections;

CREATE POLICY "Users can view own wallet connections" ON public.wallet_connections FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users can insert own wallet connections" ON public.wallet_connections FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can view all wallet connections" ON public.wallet_connections FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert wallet connections" ON public.wallet_connections FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- 4. RESET & FIX WALLET DETAILS POLICIES
DROP POLICY IF EXISTS "Users can view their own wallet details" ON public.wallet_details;
DROP POLICY IF EXISTS "Users can insert their own wallet details" ON public.wallet_details;
DROP POLICY IF EXISTS "Admins can view all wallet details" ON public.wallet_details;
DROP POLICY IF EXISTS "Admins can update all wallet details" ON public.wallet_details;
DROP POLICY IF EXISTS "Admins can insert wallet details" ON public.wallet_details;

CREATE POLICY "Users can view their own wallet details" ON public.wallet_details FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users can insert their own wallet details" ON public.wallet_details FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can view all wallet details" ON public.wallet_details FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update all wallet details" ON public.wallet_details FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert wallet details" ON public.wallet_details FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- 5. RESET & FIX USER WALLETS POLICIES
DROP POLICY IF EXISTS "Users can view their own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can create their own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can update all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can insert wallets" ON public.user_wallets;

CREATE POLICY "Users can view their own wallets" ON public.user_wallets FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users can create their own wallets" ON public.user_wallets FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can view all wallets" ON public.user_wallets FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update all wallets" ON public.user_wallets FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert wallets" ON public.user_wallets FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- 6. RESET & FIX WITHDRAWALS POLICIES
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can create their own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can update all withdrawals" ON public.withdrawals;

CREATE POLICY "Users can view their own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users can create their own withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update all withdrawals" ON public.withdrawals FOR UPDATE USING (public.is_admin(auth.uid()));

-- 7. RESET & FIX KYC DOCUMENTS POLICIES
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Users can insert their own KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can update KYC documents" ON public.kyc_documents;

CREATE POLICY "Users can view their own KYC documents" ON public.kyc_documents FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users can insert their own KYC documents" ON public.kyc_documents FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can view all KYC documents" ON public.kyc_documents FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update KYC documents" ON public.kyc_documents FOR UPDATE USING (public.is_admin(auth.uid()));

-- 8. RESET & FIX COIN BALANCES POLICIES
DROP POLICY IF EXISTS "Users can view their own coin balances" ON public.coin_balances;
DROP POLICY IF EXISTS "Admins can read all coin balances" ON public.coin_balances;
DROP POLICY IF EXISTS "Admins can update all coin balances" ON public.coin_balances;
DROP POLICY IF EXISTS "Admins can insert coin balances" ON public.coin_balances;

CREATE POLICY "Users can view their own coin balances" ON public.coin_balances FOR SELECT USING (
    wallet_id IN (SELECT id FROM public.wallet_details WHERE user_id = auth.uid()) OR public.is_admin(auth.uid())
);
CREATE POLICY "Admins can read all coin balances" ON public.coin_balances FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update all coin balances" ON public.coin_balances FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert coin balances" ON public.coin_balances FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
