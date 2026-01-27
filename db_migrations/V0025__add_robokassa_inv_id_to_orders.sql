-- Добавление колонки robokassa_inv_id для интеграции с Robokassa
ALTER TABLE t_p94134469_chandelier_sale_site.orders 
ADD COLUMN IF NOT EXISTS robokassa_inv_id INTEGER NULL;

-- Добавление индекса для быстрого поиска по InvoiceID
CREATE INDEX IF NOT EXISTS idx_orders_robokassa_inv_id 
ON t_p94134469_chandelier_sale_site.orders(robokassa_inv_id);