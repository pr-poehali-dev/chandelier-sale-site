
-- Обновляем категории товаров на основе названий
-- Декоративное освещение НЕ трогаем

-- 1. Бра
UPDATE t_p94134469_chandelier_sale_site.products
SET category = 'Бра'
WHERE category != 'Декоративное освещение'
  AND (LOWER(name) LIKE '%бра %' OR LOWER(name) LIKE 'бра %' OR LOWER(name) = 'бра' OR LOWER(name) LIKE '% бра' OR LOWER(name) LIKE '% бра %');

-- 2. Настольные лампы
UPDATE t_p94134469_chandelier_sale_site.products
SET category = 'Настольные лампы'
WHERE category != 'Декоративное освещение'
  AND (LOWER(name) LIKE '%настольная лампа%' OR LOWER(name) LIKE '%настольный светильник%' OR LOWER(name) LIKE '%лампа настольная%');

-- 3. Торшеры
UPDATE t_p94134469_chandelier_sale_site.products
SET category = 'Торшеры'
WHERE category != 'Декоративное освещение'
  AND LOWER(name) LIKE '%торшер%';

-- 4. Трековые светильники (до обычных светильников!)
UPDATE t_p94134469_chandelier_sale_site.products
SET category = 'Трековые светильники'
WHERE category != 'Декоративное освещение'
  AND category != 'Бра'
  AND category != 'Настольные лампы'
  AND category != 'Торшеры'
  AND (LOWER(name) LIKE '%трековый%' OR LOWER(name) LIKE '%трек%свет%');

-- 5. Светильники (после трековых, бра, настольных, торшеров)
UPDATE t_p94134469_chandelier_sale_site.products
SET category = 'Светильники'
WHERE category != 'Декоративное освещение'
  AND category != 'Бра'
  AND category != 'Настольные лампы'
  AND category != 'Торшеры'
  AND category != 'Трековые светильники'
  AND (LOWER(name) LIKE '%светильник%' OR LOWER(name) LIKE '%спот %' OR LOWER(name) LIKE 'спот %');

-- 6. Люстры
UPDATE t_p94134469_chandelier_sale_site.products
SET category = 'Люстры'
WHERE category != 'Декоративное освещение'
  AND category != 'Бра'
  AND category != 'Настольные лампы'
  AND category != 'Торшеры'
  AND category != 'Трековые светильники'
  AND category != 'Светильники'
  AND LOWER(name) LIKE '%люстра%';

-- 7. Всё остальное — Электротовары
UPDATE t_p94134469_chandelier_sale_site.products
SET category = 'Электротовары'
WHERE category != 'Декоративное освещение'
  AND category != 'Бра'
  AND category != 'Настольные лампы'
  AND category != 'Торшеры'
  AND category != 'Трековые светильники'
  AND category != 'Светильники'
  AND category != 'Люстры';
