-- ============================================
-- MISSING TABLES CREATION SCRIPT
-- ============================================
-- Run this in Supabase SQL Editor to create the missing tables causing 400/403 errors.

-- 1. Create wallet_connections table
CREATE TABLE IF NOT EXISTS public.wallet_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    chain_type TEXT DEFAULT 'Ethereum',
    validated BOOLEAN DEFAULT false,
    validation_status TEXT DEFAULT 'pending', -- 'pending', 'validated', 'rejected'
    validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.wallet_connections ENABLE ROW LEVEL SECURITY;

-- 2. Create security_events table
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- 3. Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 4. Create proper policies (re-applying from earlier fixes to be safe)

-- Wallet Connections Policies
DROP POLICY IF EXISTS "Users can view own wallet connections" ON public.wallet_connections;
CREATE POLICY "Users can view own wallet connections" ON public.wallet_connections FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wallet connections" ON public.wallet_connections;
CREATE POLICY "Users can insert own wallet connections" ON public.wallet_connections FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wallet connections" ON public.wallet_connections;
CREATE POLICY "Users can update own wallet connections" ON public.wallet_connections FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own wallet connections" ON public.wallet_connections;
CREATE POLICY "Users can delete own wallet connections" ON public.wallet_connections FOR DELETE USING (auth.uid() = user_id);

-- Security Events Policies
DROP POLICY IF EXISTS "Users can insert own security events" ON public.security_events;
CREATE POLICY "Users can insert own security events" ON public.security_events FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own security events" ON public.security_events;
CREATE POLICY "Users can view own security events" ON public.security_events FOR SELECT USING (auth.uid() = user_id);


-- Admin Users Policies
-- Allow anyone to read admin_users (to check if they are admin) - careful with privacy, but needed for client-side checks often
DROP POLICY IF EXISTS "Read admin users" ON public.admin_users;
CREATE POLICY "Read admin users" ON public.admin_users FOR SELECT USING (true);

-- Only service role should ideally insert into admin_users, but for the bootstrap logic:
-- We'll allow the first user to be created if the table is empty (bootstrapping)
-- OR if the user is already an admin.
DROP POLICY IF EXISTS "Bootstrap admin user" ON public.admin_users;
CREATE POLICY "Bootstrap admin user" ON public.admin_users FOR INSERT WITH CHECK (
    (SELECT count(*) FROM public.admin_users) = 0  -- Allow if table empty
    OR 
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) -- Allow if already admin
);

-- 5. Fix Coin Balances schema (just in case)
CREATE TABLE IF NOT EXISTS public.coin_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coin_symbol TEXT NOT NULL,
    balance NUMERIC DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, coin_symbol)
);
ALTER TABLE public.coin_balances ENABLE ROW LEVEL SECURITY;

-- 6. Helper function to bypass RLS for admin checks (optional but recommended)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;
