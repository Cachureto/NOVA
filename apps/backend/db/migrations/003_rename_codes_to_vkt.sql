-- Renombra los códigos de autenticidad del nombre anterior (NVP-/NVU-) al actual
-- (VKT-/VKU-). Las bases creadas desde cero con 001 ya nacen con el formato nuevo;
-- esta migración es para las que se crearon antes del cambio de nombre.
-- Es idempotente: correrla dos veces no hace daño.

-- 1. Quitar cualquier CHECK de formato que todavía exija el prefijo viejo.
DO $$
DECLARE
    c record;
BEGIN
    FOR c IN
        SELECT con.conname, rel.relname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
         WHERE con.contype = 'c'
           AND rel.relname IN ('products', 'product_units')
           AND pg_get_constraintdef(con.oid) LIKE '%NV%-%'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', c.relname, c.conname);
    END LOOP;
END $$;

-- 2. Cambiar el prefijo conservando el resto del código, para no invalidar
--    etiquetas ya impresas más allá de las tres letras.
UPDATE products
   SET authenticity_code = 'VKT-' || substring(authenticity_code FROM 5)
 WHERE authenticity_code LIKE 'NVP-%';

UPDATE product_units
   SET unit_code = 'VKU-' || substring(unit_code FROM 5)
 WHERE unit_code LIKE 'NVU-%';

-- 3. Volver a poner el CHECK con el formato nuevo (si 001 ya lo creó, no se duplica).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_auth_code_format'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT products_auth_code_format
            CHECK (authenticity_code ~ '^VKT-[A-Z0-9-]{8,60}$');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'product_units_code_format'
    ) THEN
        ALTER TABLE product_units
            ADD CONSTRAINT product_units_code_format
            CHECK (unit_code ~ '^VKU-[A-Z0-9-]{8,60}$');
    END IF;
END $$;
