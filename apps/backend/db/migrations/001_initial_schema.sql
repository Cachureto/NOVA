-- =====================================================================
-- Vokter · Esquema inicial PostgreSQL (>= 14)
-- =====================================================================
BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Tipos
CREATE TYPE user_role           AS ENUM ('customer', 'admin', 'authenticator');
CREATE TYPE order_status        AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE authenticity_status AS ENUM ('active', 'revoked', 'expired');
CREATE TYPE unit_status         AS ENUM ('in_stock', 'reserved', 'sold', 'returned', 'revoked');
CREATE TYPE drop_status         AS ENUM ('scheduled', 'live', 'sold_out', 'ended', 'cancelled');
CREATE TYPE waitlist_status     AS ENUM ('waiting', 'notified', 'converted', 'left');
CREATE TYPE push_platform       AS ENUM ('ios', 'android', 'web');

CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS
$$ BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

-- ============================ USERS ============================
CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(120) NOT NULL,
    email          CITEXT       NOT NULL UNIQUE,
    password_hash  TEXT         NOT NULL,
    role           user_role    NOT NULL DEFAULT 'customer',
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT users_email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE refresh_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   TEXT        NOT NULL UNIQUE,
    client       VARCHAR(20) NOT NULL DEFAULT 'web',
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked_at   TIMESTAMPTZ,
    replaced_by  UUID REFERENCES refresh_tokens(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id) WHERE revoked_at IS NULL;

CREATE TABLE push_tokens (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expo_token    TEXT          NOT NULL UNIQUE,
    platform      push_platform NOT NULL,
    notify_drops  BOOLEAN       NOT NULL DEFAULT TRUE,
    last_seen_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);

-- ============================ CATÁLOGO ============================
CREATE TABLE categories (
    id         SMALLSERIAL PRIMARY KEY,
    slug       VARCHAR(60) NOT NULL UNIQUE,
    name       VARCHAR(80) NOT NULL,
    parent_id  SMALLINT REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(160) NOT NULL,
    slug                VARCHAR(180) NOT NULL UNIQUE,
    category_id         SMALLINT     NOT NULL REFERENCES categories(id),
    brand               VARCHAR(80),
    description         TEXT         NOT NULL DEFAULT '',
    price_cents         BIGINT       NOT NULL CHECK (price_cents >= 0),
    currency            CHAR(3)      NOT NULL DEFAULT 'COP',
    stock               INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),
    authenticity_code   VARCHAR(64)  NOT NULL UNIQUE,
    authenticity_status authenticity_status NOT NULL DEFAULT 'active',
    attributes          JSONB        NOT NULL DEFAULT '{}'::jsonb,
    is_published        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    search_vector       TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', immutable_unaccent(coalesce(name, ''))), 'A') ||
        setweight(to_tsvector('spanish', immutable_unaccent(coalesce(brand, ''))), 'B') ||
        setweight(to_tsvector('spanish', immutable_unaccent(coalesce(description, ''))), 'C')
    ) STORED,
    CONSTRAINT products_auth_code_format CHECK (authenticity_code ~ '^VKT-[A-Z0-9-]{8,60}$')
);
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_products_catalog   ON products(category_id, price_cents) WHERE is_published;
CREATE INDEX idx_products_price     ON products(price_cents) WHERE is_published;
CREATE INDEX idx_products_search    ON products USING GIN (search_vector);
CREATE INDEX idx_products_name_trgm ON products USING GIN (immutable_unaccent(name) gin_trgm_ops);
CREATE INDEX idx_products_attrs     ON products USING GIN (attributes jsonb_path_ops);

CREATE TABLE product_images (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url         TEXT     NOT NULL,
    alt_text    VARCHAR(200),
    position    SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (product_id, position)
);

CREATE TABLE product_units (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   UUID        NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    unit_code    VARCHAR(64) NOT NULL UNIQUE,
    status       unit_status NOT NULL DEFAULT 'in_stock',
    verified_by  UUID REFERENCES users(id),
    verified_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT product_units_code_format CHECK (unit_code ~ '^VKU-[A-Z0-9-]{8,60}$')
);
CREATE INDEX idx_product_units_product ON product_units(product_id);

CREATE TABLE authenticity_checks (
    id            BIGSERIAL PRIMARY KEY,
    code_scanned  VARCHAR(64) NOT NULL,
    product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
    unit_id       UUID REFERENCES product_units(id) ON DELETE SET NULL,
    user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    result        VARCHAR(20) NOT NULL CHECK (result IN ('valid', 'revoked', 'not_found', 'suspicious')),
    source        VARCHAR(10) NOT NULL CHECK (source IN ('web', 'mobile')),
    ip_hash       TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_auth_checks_code ON authenticity_checks(code_scanned, created_at DESC);

-- ============================ PEDIDOS ============================
CREATE TABLE orders (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status           order_status NOT NULL DEFAULT 'pending',
    subtotal_cents   BIGINT       NOT NULL CHECK (subtotal_cents >= 0),
    shipping_cents   BIGINT       NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
    total_cents      BIGINT       GENERATED ALWAYS AS (subtotal_cents + shipping_cents) STORED,
    currency         CHAR(3)      NOT NULL DEFAULT 'COP',
    shipping_address JSONB,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);

CREATE TABLE order_items (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         UUID    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id       UUID    NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    unit_id          UUID REFERENCES product_units(id),
    quantity         INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents BIGINT  NOT NULL CHECK (unit_price_cents >= 0),
    product_name     VARCHAR(160) NOT NULL,
    UNIQUE (order_id, product_id, unit_id)
);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================ RESEÑAS ============================
CREATE TABLE reviews (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id        UUID     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id           UUID     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating            SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment           TEXT     CHECK (char_length(comment) <= 2000),
    photo_url         TEXT,
    verified_purchase BOOLEAN  NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id, user_id)
);
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_reviews_product ON reviews(product_id, created_at DESC);
CREATE INDEX idx_reviews_user    ON reviews(user_id);

-- ============================ DROPS ============================
CREATE TABLE drops (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(160) NOT NULL,
    slug          VARCHAR(180) NOT NULL UNIQUE,
    description   TEXT         NOT NULL DEFAULT '',
    cover_url     TEXT,
    launch_at     TIMESTAMPTZ  NOT NULL,
    ends_at       TIMESTAMPTZ,
    status        drop_status  NOT NULL DEFAULT 'scheduled',
    announced_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT drops_dates CHECK (ends_at IS NULL OR ends_at > launch_at)
);
CREATE TRIGGER trg_drops_updated BEFORE UPDATE ON drops
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_drops_calendar ON drops(launch_at) WHERE status IN ('scheduled', 'live');

CREATE TABLE drop_products (
    drop_id       UUID     NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
    product_id    UUID     NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    allocation    INTEGER  CHECK (allocation IS NULL OR allocation > 0),
    max_per_user  SMALLINT NOT NULL DEFAULT 1 CHECK (max_per_user > 0),
    PRIMARY KEY (drop_id, product_id)
);
CREATE INDEX idx_drop_products_product ON drop_products(product_id);

CREATE TABLE drop_waitlist (
    drop_id      UUID            NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
    user_id      UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       waitlist_status NOT NULL DEFAULT 'waiting',
    joined_at    TIMESTAMPTZ     NOT NULL DEFAULT now(),
    notified_at  TIMESTAMPTZ,
    PRIMARY KEY (drop_id, user_id)
);
CREATE INDEX idx_waitlist_queue ON drop_waitlist(drop_id, joined_at) WHERE status = 'waiting';

-- ============================ IA ============================
CREATE TABLE ai_tool_calls (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id UUID        NOT NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    tool_name       VARCHAR(60) NOT NULL,
    arguments       JSONB       NOT NULL,
    result_ids      UUID[]      NOT NULL DEFAULT '{}',
    latency_ms      INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_tool_calls_conv ON ai_tool_calls(conversation_id, created_at);

-- ============================ VISTAS ============================
CREATE VIEW v_catalog AS
SELECT p.id, p.slug, p.name, p.brand, c.slug AS category_slug, c.name AS category_name,
       p.description, p.price_cents, p.currency, p.stock, p.attributes,
       p.authenticity_code, p.authenticity_status,
       (SELECT url FROM product_images i WHERE i.product_id = p.id ORDER BY position LIMIT 1) AS cover_url,
       COALESCE(r.avg_rating, 0)::NUMERIC(3,2) AS avg_rating,
       COALESCE(r.review_count, 0)             AS review_count,
       p.search_vector
FROM products p
JOIN categories c ON c.id = p.category_id
LEFT JOIN (
    SELECT product_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
    FROM reviews GROUP BY product_id
) r ON r.product_id = p.id
WHERE p.is_published;

CREATE VIEW v_authenticity_lookup AS
SELECT p.authenticity_code AS code, 'product'::text AS code_type,
       p.id AS product_id, NULL::uuid AS unit_id, p.name AS product_name,
       (p.authenticity_status = 'active') AS is_active, p.authenticity_status::text AS status
FROM products p
UNION ALL
SELECT u.unit_code, 'unit', u.product_id, u.id, p.name,
       (u.status <> 'revoked' AND p.authenticity_status = 'active'),
       u.status::text
FROM product_units u
JOIN products p ON p.id = u.product_id;

COMMIT;