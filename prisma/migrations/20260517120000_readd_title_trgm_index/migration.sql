-- Re-add the trigram search index dropped by the earlier
-- `fix_bookmark_typo` migration. This powers fast case-insensitive
-- ILIKE title search (sub-10ms even with thousands of rows).
--
-- Only `title` is indexed — description is no longer searched.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_content_title_gin
  ON "Content" USING gin ("title" gin_trgm_ops);
