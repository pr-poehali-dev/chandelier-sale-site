-- Добавление недостающих колонок для интеграции Robokassa

ALTER TABLE t_p94134469_chandelier_sale_site.orders 
ADD COLUMN IF NOT EXISTS order_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_url TEXT,
ADD COLUMN IF NOT EXISTS order_comment TEXT,
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Создание индекса для быстрого поиска по order_number
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON t_p94134469_chandelier_sale_site.orders(order_number);

-- Создание индекса для быстрого поиска по robokassa_inv_id
CREATE INDEX IF NOT EXISTS idx_orders_robokassa_inv_id ON t_p94134469_chandelier_sale_site.orders(robokassa_inv_id);
