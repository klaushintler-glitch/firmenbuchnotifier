-- ==========================================================
-- FIRMENBUCH NOTIFIER - SUPABASE DATABASE SCHEMA
-- ==========================================================

-- 1. Profiles Table (linked to Supabase Auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Trigger to automatically insert a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Favorites Table (companies tracked by users, max 10)
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fnr TEXT NOT NULL,
    company_name TEXT NOT NULL,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT DEFAULT 'aktiv',
    gericht TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_favorite UNIQUE (user_id, fnr)
);

-- Enable RLS for favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorites;
CREATE POLICY "Users can manage their own favorites"
    ON public.favorites FOR ALL
    USING (auth.uid() = user_id);

-- Enforce a maximum of 10 favorites per user via trigger
CREATE OR REPLACE FUNCTION public.check_favorites_limit()
RETURNS TRIGGER AS $$
DECLARE
    favorite_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO favorite_count FROM public.favorites WHERE user_id = NEW.user_id;
    IF favorite_count >= 10 THEN
        RAISE EXCEPTION 'Sie können maximal 10 Firmen favorisieren.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER enforce_favorites_limit
    BEFORE INSERT ON public.favorites
    FOR EACH ROW EXECUTE FUNCTION public.check_favorites_limit();


-- 3. Tracked Documents Table (used to detect new document uploads)
CREATE TABLE IF NOT EXISTS public.tracked_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fnr TEXT NOT NULL,
    document_key TEXT NOT NULL UNIQUE,
    document_name TEXT NOT NULL,
    published_date DATE,
    inserted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for tracked_documents
ALTER TABLE public.tracked_documents ENABLE ROW LEVEL SECURITY;


-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_favorites_fnr ON public.favorites(fnr);
CREATE INDEX IF NOT EXISTS idx_tracked_docs_fnr ON public.tracked_documents(fnr);

-- ==========================================================
-- SCHEMA UPDATE MIGRATIONS (For existing setups)
-- ==========================================================

-- Run these statements in the Supabase SQL Editor if you are upgrading from an older version:
-- ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aktiv';
-- ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS gericht TEXT;

