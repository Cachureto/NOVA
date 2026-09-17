-- =====================================================================
-- NOVA · Categorías base del catálogo
-- =====================================================================
BEGIN;

INSERT INTO categories (slug, name) VALUES
    ('accessories', 'Accesorios'),
    ('audio', 'Audio'),
    ('chargers', 'Cargadores'),
    ('gaming', 'Gaming y TV'),
    ('home', 'Hogar'),
    ('power-banks', 'Power Banks')
ON CONFLICT (slug) DO NOTHING;

COMMIT;
