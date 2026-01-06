-- Создание индексов для ускорения поиска и фильтрации в админке
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin (to_tsvector('russian', name));
CREATE INDEX IF NOT EXISTS idx_products_brand_search ON products USING gin (to_tsvector('russian', brand));
CREATE INDEX IF NOT EXISTS idx_products_type ON products (type);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_id_desc ON products (id DESC);