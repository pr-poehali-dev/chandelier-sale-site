-- Set all products as in stock by default
UPDATE t_p94134469_chandelier_sale_site.products 
SET in_stock = TRUE 
WHERE in_stock = FALSE OR in_stock IS NULL;