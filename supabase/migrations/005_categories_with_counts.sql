-- Function to get categories with article counts
CREATE OR REPLACE FUNCTION get_categories_with_counts()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.slug,
    COUNT(ac.article_id) as count
  FROM categories c
  LEFT JOIN article_categories ac ON c.id = ac.category_id
  LEFT JOIN articles a ON ac.article_id = a.id AND a.status = 'published'
  GROUP BY c.id, c.name, c.slug
  HAVING COUNT(ac.article_id) > 0
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
