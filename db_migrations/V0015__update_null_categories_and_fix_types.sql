-- Обновляем категории для товаров где category NULL
-- Определяем категорию по названию товара

UPDATE t_p94134469_chandelier_sale_site.products 
SET category = CASE 
    WHEN LOWER(name) LIKE '%бра%' THEN 'Бра'
    WHEN LOWER(name) LIKE '%торшер%' THEN 'Торшеры'
    WHEN LOWER(name) LIKE '%настольн%' OR LOWER(name) LIKE '%лампа%' THEN 'Настольные лампы'
    WHEN LOWER(name) LIKE '%светильник%' OR LOWER(name) LIKE '%спот%' THEN 'Светильники'
    WHEN LOWER(name) LIKE '%гирлянд%' OR LOWER(name) LIKE '%декоратив%' THEN 'Декоративное освещение'
    WHEN LOWER(name) LIKE '%розетк%' OR LOWER(name) LIKE '%выключател%' OR LOWER(name) LIKE '%рамк%' THEN 'Электротовары'
    WHEN LOWER(name) LIKE '%люстр%' THEN 'Люстры'
    ELSE 'Люстры'
END
WHERE category IS NULL OR category = '';

-- Обновляем категорию "Другое" на более подходящие
UPDATE t_p94134469_chandelier_sale_site.products 
SET category = CASE 
    WHEN LOWER(name) LIKE '%бра%' THEN 'Бра'
    WHEN LOWER(name) LIKE '%торшер%' THEN 'Торшеры'
    WHEN LOWER(name) LIKE '%настольн%' OR LOWER(name) LIKE '%лампа%' THEN 'Настольные лампы'
    WHEN LOWER(name) LIKE '%светильник%' OR LOWER(name) LIKE '%спот%' THEN 'Светильники'
    WHEN LOWER(name) LIKE '%гирлянд%' OR LOWER(name) LIKE '%декоратив%' THEN 'Декоративное освещение'
    WHEN LOWER(name) LIKE '%розетк%' OR LOWER(name) LIKE '%выключател%' OR LOWER(name) LIKE '%рамк%' THEN 'Электротовары'
    WHEN LOWER(name) LIKE '%люстр%' THEN 'Люстры'
    ELSE 'Люстры'
END
WHERE category = 'Другое';