-- ====================================================================
-- FIRMENBUCH NOTIFIER - SUPABASE SCHEMA FIX
-- Run this in your Supabase SQL Editor to set up the missing tables
-- ====================================================================

-- 1. Create Profiles Table (links auth.users to public profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add View Policy (drop if exists first to avoid duplicate errors)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Trigger function for automatic profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users (drop if exists first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync any pre-existing auth users into the profiles table
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- 2. Create Tracked Documents Table (used for email diffing checks)
CREATE TABLE IF NOT EXISTS public.tracked_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fnr TEXT NOT NULL,
    document_key TEXT NOT NULL UNIQUE,
    document_name TEXT NOT NULL,
    published_date DATE,
    inserted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add search index for performance
CREATE INDEX IF NOT EXISTS idx_tracked_docs_fnr ON public.tracked_documents(fnr);
