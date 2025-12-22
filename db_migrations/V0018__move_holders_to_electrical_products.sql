-- Переносим держатели из категории Люстры в категорию Электротовары
UPDATE t_p94134469_chandelier_sale_site.products 
SET category = 'Электротовары'
WHERE category = 'Люстры' 
  AND LOWER(name) LIKE '%держател%';