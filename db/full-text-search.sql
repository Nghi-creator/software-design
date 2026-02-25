-- ============================================================
-- 1. CREATE FUNCTION remove_accents() 
-- ============================================================
CREATE OR REPLACE FUNCTION remove_accents(text) 
RETURNS text AS $$
BEGIN
    RETURN translate(
        lower($1),
        'áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ',
        'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 2. ADD fts COLUMN TO products TABLE
-- ============================================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS fts tsvector;

-- ============================================================
-- 3. CREATE INDEXES FOR FAST SEARCHING
-- ============================================================
CREATE INDEX IF NOT EXISTS products_fts_idx 
ON products USING GIN(fts);

CREATE INDEX IF NOT EXISTS categories_name_lower_idx 
ON categories(lower(remove_accents(name)));

-- ============================================================
-- 4. CREATE TRIGGER FOR AUTO-UPDATING NEW RECORDS
-- ============================================================
CREATE OR REPLACE FUNCTION products_fts_update() 
RETURNS trigger AS $$
BEGIN
    NEW.fts := to_tsvector('simple', remove_accents(NEW.name));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_fts_trigger ON products;
CREATE TRIGGER products_fts_trigger 
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION products_fts_update();