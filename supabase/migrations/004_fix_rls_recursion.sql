-- Fix RLS infinite recursion by creating helper functions

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can do everything with profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all articles" ON articles;
DROP POLICY IF EXISTS "Admins can insert articles" ON articles;
DROP POLICY IF EXISTS "Admins can update articles" ON articles;
DROP POLICY IF EXISTS "Admins can delete articles" ON articles;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage article categories" ON article_categories;
DROP POLICY IF EXISTS "Admins can delete any comment" ON comments;

-- Create helper functions that bypass RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND invitation_status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND invitation_status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate policies using helper functions

-- PROFILES POLICIES
CREATE POLICY "Admins can do everything with profiles"
  ON profiles FOR ALL
  USING (public.is_admin());

-- ARTICLES POLICIES
CREATE POLICY "Admins can view all articles"
  ON articles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert articles"
  ON articles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update articles"
  ON articles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete articles"
  ON articles FOR DELETE
  USING (public.is_admin());

-- CATEGORIES POLICIES
CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  USING (public.is_admin());

-- ARTICLE_CATEGORIES POLICIES
CREATE POLICY "Admins can manage article categories"
  ON article_categories FOR ALL
  USING (public.is_admin());

-- COMMENTS POLICIES
CREATE POLICY "Admins can delete any comment"
  ON comments FOR DELETE
  USING (public.is_admin());

-- Update Active users can insert comments policy
DROP POLICY IF EXISTS "Active users can insert comments" ON comments;
CREATE POLICY "Active users can insert comments"
  ON comments FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND auth.uid() = user_id
  );
