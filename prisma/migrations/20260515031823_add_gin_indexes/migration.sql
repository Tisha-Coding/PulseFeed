CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_content_title_gin ON "Content" USING gin("title" gin_trgm_ops);

CREATE INDEX idx_content_description_gin ON "Content" USING gin("description" gin_trgm_ops);