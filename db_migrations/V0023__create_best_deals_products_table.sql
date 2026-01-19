-- Создаем отдельную таблицу для товаров "по выгодным ценам"
CREATE TABLE IF NOT EXISTS best_deals_products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  discount_price NUMERIC(10,2),
  brand VARCHAR(100),
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_best_deals_created_at ON best_deals_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_best_deals_in_stock ON best_deals_products(in_stock);
