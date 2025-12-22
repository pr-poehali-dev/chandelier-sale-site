-- Переносим все товары с "бра" в названии из категории Люстры в категорию Бра
UPDATE t_p94134469_chandelier_sale_site.products 
SET category = 'Бра'
WHERE category = 'Люстры' 
  AND LOWER(name) LIKE '%бра%';