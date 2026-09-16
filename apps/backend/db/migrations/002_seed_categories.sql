-- =====================================================================
-- NOVA · Categorías base del catálogo
-- =====================================================================
BEGIN;

INSERT INTO categories (slug, name) VALUES
    ('sneakers', 'Sneakers'),
    ('apparel', 'Ropa Urbana'),
    ('audio', 'Audio'),
    ('wearables', 'Wearables'),
    ('accessories', 'Accesorios')
ON CONFLICT (slug) DO NOTHING;

COMMIT;
