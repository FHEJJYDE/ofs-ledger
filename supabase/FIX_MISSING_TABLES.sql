-- ============================================
-- FIX MISSING TABLES AND COLUMNS
-- ============================================
-- Run this script in Supabase SQL Editor to create missing tables and columns

-- 1. Create user_activity_log table
CREATE TABLE IF NOT EXISTS public.user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for user_activity_log
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies for user_activity_log
DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity_log;
DROP POLICY IF EXISTS "Admins can view all activity" ON public.user_activity_log;
DROP POLICY IF EXISTS "System can insert activity" ON public.user_activity_log;

CREATE POLICY "Users can view their own activity"
    ON public.user_activity_log FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all activity"
    ON public.user_activity_log FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert activity"
    ON public.user_activity_log FOR INSERT
    WITH CHECK (true);

-- 2. Create security_events table
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Policies for security_events
DROP POLICY IF EXISTS "Admins can view all security events" ON public.security_events;
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;

CREATE POLICY "Admins can view all security events"
    ON public.security_events FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert security events"
    ON public.security_events FOR INSERT
    WITH CHECK (true);

-- 3. Create admin_users table (view or table depending on usage)
-- Based on error logs, this seems to be used as a table for admin settings or logs
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    permissions TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policies for admin_users
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

CREATE POLICY "Admins can view all admin users"
    ON public.admin_users FOR SELECT
    USING (public.is_admin(auth.uid()));

-- 4. Create wallet_details table if not exists
CREATE TABLE IF NOT EXISTS public.wallet_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT,
    encrypted_phrase TEXT,
    wallet_provider TEXT,
    is_connected BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, wallet_provider)
);

-- Enable RLS for wallet_details
ALTER TABLE public.wallet_details ENABLE ROW LEVEL SECURITY;

-- Policies for wallet_details defined in REALLY_FINAL_FIX_ALL.sql, but we'll add them here just in case
DROP POLICY IF EXISTS "Users can view their own wallet details" ON public.wallet_details;
DROP POLICY IF EXISTS "Users can insert their own wallet details" ON public.wallet_details;
DROP POLICY IF EXISTS "Admins can view all wallet details" ON public.wallet_details;

CREATE POLICY "Users can view their own wallet details"
    ON public.wallet_details FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own wallet details"
    ON public.wallet_details FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all wallet details"
    ON public.wallet_details FOR SELECT
    USING (public.is_admin(auth.uid()));

-- 5. Fix coin_balances table - Add user_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'coin_balances' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.coin_balances ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update existing records to have user_id if possible (linked via wallet_details)
UPDATE public.coin_balances cb
SET user_id = wd.user_id
FROM public.wallet_details wd
WHERE cb.wallet_id = wd.id
AND cb.user_id IS NULL;

-- 6. Grant permissions
GRANT ALL ON public.user_activity_log TO authenticated;
GRANT ALL ON public.user_activity_log TO service_role;

GRANT ALL ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;

GRANT ALL ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;

GRANT ALL ON public.wallet_details TO authenticated;
GRANT ALL ON public.wallet_details TO service_role;
