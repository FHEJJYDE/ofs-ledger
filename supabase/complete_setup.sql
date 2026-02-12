-- ============================================
-- OFSLEDGER Complete Database Setup Script
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- This will create all tables, policies, and the admin user

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    has_validated_wallet BOOLEAN DEFAULT false,
    first_wallet_validated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sign_in TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 2. WALLET CONNECTIONS TABLE
-- ============================================
DROP TABLE IF EXISTS public.wallet_connections CASCADE;

CREATE TABLE public.wallet_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    wallet_address TEXT NOT NULL,
    chain_type TEXT NOT NULL,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX wallet_connections_user_id_idx ON public.wallet_connections(user_id);
CREATE INDEX wallet_connections_connected_at_idx ON public.wallet_connections(connected_at);

-- Enable RLS
ALTER TABLE public.wallet_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own wallet connections"
    ON public.wallet_connections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet connections"
    ON public.wallet_connections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet connections"
    ON public.wallet_connections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- ============================================
-- 3. WALLET DETAILS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallet_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    name TEXT,
    blockchain TEXT,
    wallet_type TEXT,
    address TEXT,
    seed_phrase TEXT,
    seed_phrase_required INTEGER DEFAULT 12,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.wallet_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own wallet details" ON public.wallet_details;
DROP POLICY IF EXISTS "Users can insert their own wallet details" ON public.wallet_details;
DROP POLICY IF EXISTS "Admins can view all wallet details" ON public.wallet_details;
DROP POLICY IF EXISTS "Admins can update all wallet details" ON public.wallet_details;

-- Create policies
CREATE POLICY "Users can view their own wallet details"
    ON public.wallet_details FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet details"
    ON public.wallet_details FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet details"
    ON public.wallet_details FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all wallet details"
    ON public.wallet_details FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- ============================================
-- 4. COIN BALANCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.coin_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id UUID REFERENCES public.wallet_details(id) ON DELETE CASCADE,
    coin_symbol TEXT NOT NULL,
    coin_name TEXT,
    balance NUMERIC(20, 8) DEFAULT 0,
    usd_value NUMERIC(20, 2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.coin_balances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own coin balances" ON public.coin_balances;
DROP POLICY IF EXISTS "Admins can read all coin balances" ON public.coin_balances;
DROP POLICY IF EXISTS "Admins can update all coin balances" ON public.coin_balances;
DROP POLICY IF EXISTS "Admins can insert coin balances" ON public.coin_balances;

-- Create policies
CREATE POLICY "Users can view their own coin balances"
    ON public.coin_balances FOR SELECT
    USING (
        wallet_id IN (
            SELECT id FROM public.wallet_details WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can read all coin balances"
    ON public.coin_balances FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all coin balances"
    ON public.coin_balances FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert coin balances"
    ON public.coin_balances FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- ============================================
-- 5. USER WALLETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    wallet_name TEXT,
    chain_type TEXT NOT NULL,
    validated BOOLEAN,
    validation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can create their own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can update all wallets" ON public.user_wallets;

-- Create policies
CREATE POLICY "Users can view their own wallets"
    ON public.user_wallets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallets"
    ON public.user_wallets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
    ON public.user_wallets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all wallets"
    ON public.user_wallets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS user_wallets_user_id_idx ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS user_wallets_validated_idx ON public.user_wallets(validated);
CREATE INDEX IF NOT EXISTS user_wallets_wallet_address_idx ON public.user_wallets(wallet_address);

-- ============================================
-- 6. WITHDRAWALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL,
    wallet_name TEXT,
    wallet_address TEXT NOT NULL,
    amount TEXT NOT NULL,
    token TEXT NOT NULL,
    destination TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    transaction_hash TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    rejected_reason TEXT
);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can create their own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can update all withdrawals" ON public.withdrawals;

-- Create policies
CREATE POLICY "Users can view their own withdrawals"
    ON public.withdrawals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawals"
    ON public.withdrawals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals"
    ON public.withdrawals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all withdrawals"
    ON public.withdrawals FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS withdrawals_user_id_idx ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS withdrawals_status_idx ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS withdrawals_created_at_idx ON public.withdrawals(created_at);

-- ============================================
-- 7. KYC DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_number TEXT NOT NULL,
    front_image_url TEXT NOT NULL,
    back_image_url TEXT,
    selfie_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Users can insert their own KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can update KYC documents" ON public.kyc_documents;

-- Create policies
CREATE POLICY "Users can view their own KYC documents"
    ON public.kyc_documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYC documents"
    ON public.kyc_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC documents"
    ON public.kyc_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update KYC documents"
    ON public.kyc_documents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON public.kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_submitted_at ON public.kyc_documents(submitted_at);

-- ============================================
-- 8. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        CASE 
            WHEN NEW.email = 'generalprep.ig@gmail.com' THEN 'admin'
            ELSE 'user'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for withdrawals updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.withdrawals;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for user_wallets updated_at
DROP TRIGGER IF EXISTS set_wallet_updated_at ON public.user_wallets;
CREATE TRIGGER set_wallet_updated_at
    BEFORE UPDATE ON public.user_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for kyc_documents updated_at
DROP TRIGGER IF EXISTS set_kyc_updated_at ON public.kyc_documents;
CREATE TRIGGER set_kyc_updated_at
    BEFORE UPDATE ON public.kyc_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle wallet validation
CREATE OR REPLACE FUNCTION public.handle_wallet_validation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.validated = true AND (OLD.validated IS NULL OR OLD.validated = false) THEN
        UPDATE public.profiles
        SET has_validated_wallet = true,
            first_wallet_validated_at = COALESCE(first_wallet_validated_at, NOW())
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for wallet validation
DROP TRIGGER IF EXISTS update_profile_on_wallet_validation ON public.user_wallets;
CREATE TRIGGER update_profile_on_wallet_validation
    AFTER UPDATE ON public.user_wallets
    FOR EACH ROW
    WHEN (NEW.validated = true AND (OLD.validated IS NULL OR OLD.validated = false))
    EXECUTE FUNCTION public.handle_wallet_validation();

-- ============================================
-- 9. ENABLE REALTIME (OPTIONAL)
-- ============================================
-- Uncomment if you want realtime subscriptions
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_connections;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.kyc_documents;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next step: Create your admin user in Supabase Authentication
-- Then the profile will be automatically created with admin role
