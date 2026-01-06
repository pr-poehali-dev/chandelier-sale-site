-- Индексы для быстрой фильтрации каталога с 300К товаров

-- Индекс для поиска по брендам
CREATE INDEX IF NOT EXISTS idx_products_brand ON t_p94134469_chandelier_sale_site.products(brand);

-- Индекс для фильтрации по категории  
CREATE INDEX IF NOT EXISTS idx_products_category ON t_p94134469_chandelier_sale_site.products(category);

-- Индекс для фильтрации по цене
CREATE INDEX IF NOT EXISTS idx_products_price ON t_p94134469_chandelier_sale_site.products(price);

-- Индекс для типа товара
CREATE INDEX IF NOT EXISTS idx_products_type ON t_p94134469_chandelier_sale_site.products(type);

-- Индекс для стиля
CREATE INDEX IF NOT EXISTS idx_products_style ON t_p94134469_chandelier_sale_site.products(style) WHERE style IS NOT NULL;

-- Индекс для цвета
CREATE INDEX IF NOT EXISTS idx_products_color ON t_p94134469_chandelier_sale_site.products(color) WHERE color IS NOT NULL;

-- Индекс для быстрой пагинации
CREATE INDEX IF NOT EXISTS idx_products_id_desc ON t_p94134469_chandelier_sale_site.products(id DESC);

-- Составной индекс категория + ID
CREATE INDEX IF NOT EXISTS idx_products_category_id ON t_p94134469_chandelier_sale_site.products(category, id DESC) WHERE category IS NOT NULL;

-- Индекс для бренда + цена
CREATE INDEX IF NOT EXISTS idx_products_brand_price ON t_p94134469_chandelier_sale_site.products(brand, price);