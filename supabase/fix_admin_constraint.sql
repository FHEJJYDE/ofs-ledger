-- ============================================
-- FIX ADMIN CONSTRAINT & APPLY V2 FIX
-- ============================================

-- 1. Ensure the Unique Constraint exists on admin_users(user_id)
-- We attempt to drop it first to be clean, then re-add it.
DO $$
BEGIN
    -- Try to drop the constraint if it has a generic name or specific name
    -- This part is tricky if we don't know the name, but we can try adding it and ignore error if exists?
    -- Better: we just add it if not exists.
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'admin_users_user_id_key' 
    ) THEN
        ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 2. NOW we can safely run the sync logic from V2
-- This matches the logic from super_admin_fix_v2.sql but now safe

CREATE OR REPLACE FUNCTION public.check_is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    -- Check admin_users table first
    IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = check_is_admin.user_id) THEN
        RETURN TRUE;
    END IF;

    -- Check profiles table (safe queries)
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = check_is_admin.user_id AND role = 'admin') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_admin(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_is_admin(UUID) TO anon;

-- Sync Admins (Now this ON CONFLICT will work)
INSERT INTO public.admin_users (user_id, role)
SELECT id, 'admin'
FROM public.profiles
WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- Re-apply Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles 
FOR SELECT USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles 
FOR UPDATE USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles" ON public.profiles 
FOR INSERT WITH CHECK (public.check_is_admin(auth.uid()));

-- RPC Function
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.check_is_admin(auth.uid()) THEN
     RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
  ELSE
     RETURN QUERY SELECT * FROM public.profiles WHERE id = auth.uid();
  END IF;
END;
$$;
