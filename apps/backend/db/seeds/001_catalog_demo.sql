-- =====================================================================
-- NOVA · Catálogo de ejemplo (usa las fotos de apps/web/public/products)
-- Idempotente: se puede ejecutar varias veces sin duplicar nada.
-- Precios en pesos COP. Los datos son de demostración: ajústalos desde el panel admin.
-- =====================================================================
BEGIN;

INSERT INTO categories (slug, name) VALUES
  ('chargers',    'Cargadores'),
  ('power-banks', 'Power Banks'),
  ('gaming',      'Gaming y TV'),
  ('home',        'Hogar'),
  ('accessories', 'Accesorios'),
  ('audio',       'Audio')
ON CONFLICT (slug) DO NOTHING;

-- Limpia las categorías iniciales que ya no se usan (solo si no tienen productos)
DELETE FROM categories c
WHERE c.slug IN ('sneakers', 'apparel', 'wearables')
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id);

CREATE TEMP TABLE seed_products (
  slug TEXT, name TEXT, category TEXT, brand TEXT, price INT, stock INT, description TEXT
) ON COMMIT DROP;

INSERT INTO seed_products VALUES
  ('antena-tdt-5m', 'Antena TDT 5 m', 'accessories', 'Techno', 38000, 12, 'Antena digital para TDT con base magnética y cable de 5 metros.'),
  ('cabeza-iphone-25w', 'Cabeza de carga iPhone 25W', 'chargers', 'Apple', 65000, 20, 'Adaptador de corriente USB-C de 25W para carga rápida.'),
  ('cargador-25w-tipo-c-iphone', 'Cargador 25W Tipo C a Lightning', 'chargers', 'Apple', 89000, 8, 'Kit de adaptador USB-C de 25W con cable a Lightning.'),
  ('cargador-4a-20w-tipo-c', 'Cargador 4A 20W Tipo C', 'chargers', 'Technomaster', 27000, 30, 'Carga rápida de 20W con cable tipo C incluido.'),
  ('cargador-67w-tipo-c', 'Cargador Xiaomi 67W Tipo C', 'chargers', 'Xiaomi', 119000, 5, 'Carga turbo de 67W para celulares y tablets compatibles.'),
  ('gold-cargador-25w-tipo-c', 'Cargador Gold 25W Tipo C', 'chargers', 'GD Gold', 32000, 25, 'Quick charger 3.0A con cable tipo C.'),
  ('power-bank-10000mah', 'Power Bank 10.000 mAh', 'power-banks', 'Nova Tech', 69000, 15, 'Batería portátil con doble salida USB y pantalla de carga.'),
  ('power-bank-20000mah', 'Power Bank 20.000 mAh', 'power-banks', 'WiWU', 99000, 11, 'Alta capacidad para varios días lejos del enchufe.'),
  ('power-bank-2300mah-llavero', 'Power Bank llavero 2.300 mAh', 'power-banks', 'Fly', 35000, 33, 'Mini batería de emergencia tipo llavero.'),
  ('power-bank-5000mah-magsafe', 'Power Bank MagSafe 5.000 mAh', 'power-banks', 'Apple', 129000, 4, 'Batería magnética inalámbrica para iPhone.'),
  ('combo-gamer-t25', 'Combo gamer teclado + mouse T25', 'gaming', 'T-Wolf', 79000, 14, 'Teclado retroiluminado RGB y mouse gamer.'),
  ('consola-retro-blanca-verde', 'Consola retro con 2 controles', 'gaming', 'Retro Box', 149000, 3, 'Miles de juegos clásicos y dos controles inalámbricos.'),
  ('onn-watch-streaming-stick', 'Onn Streaming Stick 4K', 'gaming', 'onn', 159000, 6, 'Convierte cualquier TV en smart con Google TV.'),
  ('proyector-con-juegos', 'Proyector HD con juegos', 'gaming', 'Nova Tech', 289000, 2, 'Proyector portátil con consola de juegos y dos controles.'),
  ('tv-stick-android-tv', 'TV Stick Android TV', 'gaming', 'Android TV', 139000, 10, 'Streaming en 4K con control por voz.'),
  ('funda-space-collection', 'Funda Space Collection', 'accessories', 'Space', 45000, 0, 'Funda protectora con esquinas reforzadas.'),
  ('holder-carro-chupa-iman', 'Holder para carro con imán', 'accessories', 'Technomaster', 29000, 18, 'Soporte magnético con ventosa para el tablero.'),
  ('holder-para-carro', 'Holder para carro 360°', 'accessories', 'Technomaster', 25000, 22, 'Brazo ajustable de un toque para rejilla o tablero.'),
  ('hub-usb-multipuerto', 'Hub USB multipuerto 4 en 1', 'accessories', 'Nova Tech', 35000, 16, 'Cuatro puertos USB 3.0 de alta velocidad.'),
  ('mouse-alambrico-optico', 'Mouse alámbrico óptico', 'accessories', 'SJ', 15000, 40, 'Mouse USB óptico ergonómico.'),
  ('mouse-inalambrico-optico', 'Mouse inalámbrico Gold', 'accessories', 'GD Gold', 29000, 27, 'Mouse inalámbrico 2.4GHz con receptor USB.'),
  ('soporte-moto-espejo', 'Soporte moto para espejo', 'accessories', 'XL+M3', 39000, 19, 'Soporte para celular que se fija al espejo retrovisor.'),
  ('soporte-moto-manubrio-360', 'Soporte moto manubrio 360°', 'accessories', 'Technomaster', 49000, 13, 'Soporte impermeable y giratorio para el manubrio.'),
  ('soporte-moto-manubrio-xlz', 'Soporte moto manubrio XL+Z', 'accessories', 'XL+Z', 42000, 9, 'Estuche impermeable con pantalla táctil para rodar.'),
  ('teclado-cable-fc-530', 'Teclado alámbrico FC-530', 'accessories', 'Weibo', 32000, 21, 'Teclado de oficina resistente a salpicaduras.'),
  ('teclado-mouse-inalambrico', 'Combo teclado y mouse inalámbrico', 'accessories', 'MiPC', 75000, 8, 'Combo inalámbrico silencioso para casa u oficina.'),
  ('microfono-inalambrico-k9', 'Micrófono inalámbrico K9', 'audio', 'K9', 55000, 9, 'Micrófono de solapa inalámbrico para creadores de contenido.'),
  ('sabana-estampada-abstracta', 'Sábana estampada Abstracta', 'home', 'Star Home', 89000, 10, 'Juego de sábanas 100% algodón.'),
  ('sabana-estampada-acuarela-gris', 'Sábana estampada Acuarela gris', 'home', 'Star Home', 89000, 7, 'Juego de sábanas 100% algodón.'),
  ('sabana-estampada-animal-print', 'Sábana estampada Animal print', 'home', 'Star Home', 89000, 6, 'Juego de sábanas 100% algodón.'),
  ('sabana-estampada-bloques-pastel', 'Sábana estampada Bloques pastel', 'home', 'Star Home', 89000, 9, 'Juego de sábanas 100% algodón.'),
  ('sabana-estampada-cintas', 'Sábana estampada Cintas', 'home', 'Star Home', 89000, 5, 'Juego de sábanas 100% algodón.'),
  ('sabana-estampada-circulos', 'Sábana estampada Círculos', 'home', 'Star Home', 89000, 8, 'Juego de sábanas 100% algodón.'),
  ('sabana-estampada-estrellas', 'Sábana estampada Estrellas', 'home', 'Star Home', 89000, 11, 'Juego de sábanas 100% algodón.'),
  ('sabana-estampada-floral', 'Sábana estampada Floral', 'home', 'Star Home', 89000, 12, 'Juego de sábanas 100% algodón.'),
  ('sabana-estampada-geometrica', 'Sábana estampada Geométrica', 'home', 'Star Home', 89000, 7, 'Juego de sábanas 100% algodón.'),
  ('sabana-estampada-hojas', 'Sábana estampada Hojas', 'home', 'Star Home', 89000, 4, 'Juego de sábanas 100% algodón.'),
  ('sabana-estampada-memphis', 'Sábana estampada Memphis', 'home', 'Star Home', 89000, 6, 'Juego de sábanas 100% algodón.'),
  ('sabana-estampada-patchwork', 'Sábana estampada Patchwork', 'home', 'Star Home', 89000, 3, 'Juego de sábanas 100% algodón.'),
  ('sabana-estampada-triangulos', 'Sábana estampada Triángulos', 'home', 'Star Home', 89000, 10, 'Juego de sábanas 100% algodón.');

INSERT INTO products (slug, name, category_id, brand, description, price_cents, stock, authenticity_code)
SELECT s.slug, s.name, c.id, s.brand, s.description, s.price, s.stock,
       'NVP-' || upper(replace(s.slug, '-', ''))
FROM seed_products s
JOIN categories c ON c.slug = s.category
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, category_id = EXCLUDED.category_id, brand = EXCLUDED.brand,
  description = EXCLUDED.description, price_cents = EXCLUDED.price_cents, stock = EXCLUDED.stock;

-- Rutas relativas: Next.js sirve las fotos desde apps/web/public/products
INSERT INTO product_images (product_id, url, alt_text, position)
SELECT p.id, '/products/' || s.slug || '.jpg', s.name, 0
FROM seed_products s
JOIN products p ON p.slug = s.slug
ON CONFLICT (product_id, position) DO UPDATE SET url = EXCLUDED.url, alt_text = EXCLUDED.alt_text;

-- Drops de ejemplo (fechas relativas a hoy para que siempre haya uno en vivo y dos próximos)
INSERT INTO drops (slug, name, description, launch_at, status, cover_url) VALUES
  ('urban-rider-kit', 'Urban Rider Kit',
   'Todo para moverte en moto por la ciudad: soportes y holders con certificado NOVA.',
   now() - interval '2 hours', 'live', '/products/soporte-moto-manubrio-360.jpg'),
  ('night-charge-pack', 'Night Charge Pack',
   'Edición limitada de carga rápida: power banks y cargadores. Solo 50 unidades numeradas.',
   now() + interval '3 days', 'scheduled', '/products/power-bank-20000mah.jpg'),
  ('retro-arcade-drop', 'Retro Arcade Drop',
   'Consolas retro y proyectores con juegos, verificados uno a uno por nuestro equipo.',
   now() + interval '9 days', 'scheduled', '/products/consola-retro-blanca-verde.jpg')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO drop_products (drop_id, product_id, allocation)
SELECT d.id, p.id, 50
FROM (VALUES
  ('urban-rider-kit', 'soporte-moto-manubrio-360'),
  ('urban-rider-kit', 'soporte-moto-espejo'),
  ('urban-rider-kit', 'holder-para-carro'),
  ('night-charge-pack', 'power-bank-20000mah'),
  ('night-charge-pack', 'cargador-67w-tipo-c'),
  ('night-charge-pack', 'power-bank-5000mah-magsafe'),
  ('retro-arcade-drop', 'consola-retro-blanca-verde'),
  ('retro-arcade-drop', 'proyector-con-juegos')
) AS link(drop_slug, product_slug)
JOIN drops d ON d.slug = link.drop_slug
JOIN products p ON p.slug = link.product_slug
ON CONFLICT (drop_id, product_id) DO NOTHING;

COMMIT;
