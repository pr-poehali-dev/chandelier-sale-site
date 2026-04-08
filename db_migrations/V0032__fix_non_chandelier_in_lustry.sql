
-- Товары в категории "Люстры" без слова "люстра" в названии — переклассифицируем
-- Порядок важен: сначала специфичные категории, потом общие

-- Бра
UPDATE t_p94134469_chandelier_sale_site.products
SET category = 'Бра'
WHERE category = 'Люстры' AND LOWER(name) NOT LIKE '%люстра%'
  AND (LOWER(name) LIKE '%бра %' OR LOWER(name) LIKE 'бра %' OR LOWER(name) = 'бра' OR LOWER(name) LIKE '% бра' OR LOWER(name) LIKE '% бра %');

-- Настольные лампы
UPDATE t_p94134469_chandelier_sale_site.products
SET category = 'Настольные лампы'
WHERE category = 'Люстры' AND LOWER(name) NOT LIKE '%люстра%'
  AND (LOWER(name) LIKE '%настольная лампа%' OR LOWER(name) LIKE '%настольный светильник%' OR LOWER(name) LIKE '%лампа настольная%');

-- Торшеры
UPDATE t_p94134469_chandelier_sale_site.products
SET category = 'Торшеры'
WHERE category = 'Люстры' AND LOWER(name) NOT LIKE '%люстра%'
  AND LOWER(name) LIKE '%торшер%';

-- Трековые светильники
UPDATE t_p94134469_chandelier_sale_site.products
SET category = 'Трековые светильники'
WHERE category = 'Люстры' AND LOWER(name) NOT LIKE '%люстра%'
  AND (LOWER(name) LIKE '%трековый%' OR LOWER(name) LIKE '%трек%свет%');

-- Светильники (включая споты)
UPDATE t_p94134469_chandelier_sale_site.products
SET category = 'Светильники'
WHERE category = 'Люстры' AND LOWER(name) NOT LIKE '%люстра%'
  AND (LOWER(name) LIKE '%светильник%' OR LOWER(name) LIKE '%спот %' OR LOWER(name) LIKE 'спот %' OR LOWER(name) LIKE '%подсветка%');

-- Всё остальное без слова "люстра" — в Электротовары
UPDATE t_p94134469_chandelier_sale_site.products
SET category = 'Электротовары'
WHERE category = 'Люстры' AND LOWER(name) NOT LIKE '%люстра%';
