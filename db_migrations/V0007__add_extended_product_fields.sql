-- Добавление недостающих полей для полного каталога товаров

-- Материалы и конструкция
ALTER TABLE t_p94134469_chandelier_sale_site.products 
ADD COLUMN IF NOT EXISTS materials VARCHAR(500),
ADD COLUMN IF NOT EXISTS frame_material VARCHAR(100),
ADD COLUMN IF NOT EXISTS shade_material VARCHAR(100),
ADD COLUMN IF NOT EXISTS frame_color VARCHAR(100),
ADD COLUMN IF NOT EXISTS shade_color VARCHAR(100);

-- Характеристики плафона
ALTER TABLE t_p94134469_chandelier_sale_site.products
ADD COLUMN IF NOT EXISTS shade_direction VARCHAR(100),
ADD COLUMN IF NOT EXISTS diffuser_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS diffuser_shape VARCHAR(100);

-- Защита и размещение
ALTER TABLE t_p94134469_chandelier_sale_site.products
ADD COLUMN IF NOT EXISTS ip_rating VARCHAR(20),
ADD COLUMN IF NOT EXISTS interior VARCHAR(500),
ADD COLUMN IF NOT EXISTS place VARCHAR(200),
ADD COLUMN IF NOT EXISTS suspended_ceiling BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mount_type VARCHAR(100);

-- Гарантия
ALTER TABLE t_p94134469_chandelier_sale_site.products
ADD COLUMN IF NOT EXISTS official_warranty VARCHAR(100),
ADD COLUMN IF NOT EXISTS shop_warranty VARCHAR(100);

-- Категоризация
ALTER TABLE t_p94134469_chandelier_sale_site.products
ADD COLUMN IF NOT EXISTS section VARCHAR(200),
ADD COLUMN IF NOT EXISTS catalog VARCHAR(200),
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(200);

-- Создание индексов для поиска
CREATE INDEX IF NOT EXISTS idx_products_article ON t_p94134469_chandelier_sale_site.products(article);
CREATE INDEX IF NOT EXISTS idx_products_brand ON t_p94134469_chandelier_sale_site.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_type ON t_p94134469_chandelier_sale_site.products(type);
CREATE INDEX IF NOT EXISTS idx_products_collection ON t_p94134469_chandelier_sale_site.products(collection);
CREATE INDEX IF NOT EXISTS idx_products_style ON t_p94134469_chandelier_sale_site.products(style);