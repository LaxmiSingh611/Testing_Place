-- Convert the plain "searchVector" column into a generated, weighted tsvector
-- (title ranked above description) with a GIN index for full-text search.
ALTER TABLE "Product" DROP COLUMN "searchVector";

ALTER TABLE "Product" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("description", '')), 'B')
  ) STORED;

CREATE INDEX "Product_searchVector_idx" ON "Product" USING GIN ("searchVector");
