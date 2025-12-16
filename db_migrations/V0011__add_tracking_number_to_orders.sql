ALTER TABLE t_p94134469_chandelier_sale_site.orders 
ADD COLUMN tracking_number VARCHAR(100) DEFAULT NULL;

COMMENT ON COLUMN t_p94134469_chandelier_sale_site.orders.tracking_number IS 'Почтовый трек-номер для отслеживания посылки';