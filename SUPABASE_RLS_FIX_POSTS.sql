-- Hide future scheduled posts from anon/public reads.
-- Run this once in Supabase SQL Editor.

DROP POLICY IF EXISTS "Public read posts" ON posts;

CREATE POLICY "Public read posts" ON posts
  FOR SELECT
  USING (
    is_published = true
    AND (
      published_at IS NULL
      OR published_at <= NOW()
    )
  );
