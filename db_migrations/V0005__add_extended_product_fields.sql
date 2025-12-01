-- Добавляем расширенные характеристики товаров

-- Основные характеристики
ALTER TABLE products ADD COLUMN IF NOT EXISTS article VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_country VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturer_country VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS collection VARCHAR(200);
ALTER TABLE products ADD COLUMN IF NOT EXISTS style VARCHAR(100);

-- Лампы и освещение
ALTER TABLE products ADD COLUMN IF NOT EXISTS lamp_type VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS socket_type VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS bulb_type VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS lamp_count INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS lamp_power INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_power INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS lighting_area INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS voltage INTEGER DEFAULT 220;

-- Цвет и материал
ALTER TABLE products ADD COLUMN IF NOT EXISTS color VARCHAR(100);

-- Размеры (в миллиметрах)
ALTER TABLE products ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS diameter INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS depth INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS chain_length INTEGER;

-- Дополнительные изображения (JSON массив URL)
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Индексы для частых фильтров
CREATE INDEX IF NOT EXISTS idx_products_brand_country ON products(brand_country);
CREATE INDEX IF NOT EXISTS idx_products_style ON products(style);
CREATE INDEX IF NOT EXISTS idx_products_color ON products(color);
CREATE INDEX IF NOT EXISTS idx_products_price_range ON products(price);
