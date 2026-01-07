-- Добавляем колонку catalog если её нет
ALTER TABLE t_p94134469_chandelier_sale_site.products 
ADD COLUMN IF NOT EXISTS catalog VARCHAR(255);

-- Распределяем товары по категориям на основе типа

-- Люстры
UPDATE t_p94134469_chandelier_sale_site.products 
SET catalog = 'Люстры'
WHERE type IN ('ceiling_chandelier', 'pendant_chandelier', 'fan_chandelier', 'люстра')
   OR LOWER(name) LIKE '%люстр%'
   OR LOWER(description) LIKE '%люстр%';

-- Светильники
UPDATE t_p94134469_chandelier_sale_site.products 
SET catalog = 'Светильники'
WHERE type IN ('light_ceiling', 'light_pendant', 'light_recessed', 'light_wall', 'light_mirror', 'light_picture', 'light_projector', 'spot_recessed', 'spot_surface', 'track_light', 'track_rail', 'outdoor_lantern')
   AND (catalog IS NULL OR catalog = '')
   OR (LOWER(name) LIKE '%светильник%' AND (catalog IS NULL OR catalog = ''))
   OR (LOWER(description) LIKE '%светильник%' AND (catalog IS NULL OR catalog = ''));

-- Бра
UPDATE t_p94134469_chandelier_sale_site.products 
SET catalog = 'Бра'
WHERE type = 'sconce'
   OR (LOWER(name) LIKE '%бра%' AND (catalog IS NULL OR catalog = ''))
   OR (LOWER(description) LIKE '%настенн%' AND LOWER(name) NOT LIKE '%светильник%' AND (catalog IS NULL OR catalog = ''));

-- Настольные лампы
UPDATE t_p94134469_chandelier_sale_site.products 
SET catalog = 'Настольные лампы'
WHERE type = 'lamp_table'
   OR (LOWER(name) LIKE '%настольн%' AND (catalog IS NULL OR catalog = ''))
   OR (LOWER(name) LIKE '%лампа%' AND LOWER(name) NOT LIKE '%торшер%' AND (catalog IS NULL OR catalog = ''));

-- Торшеры
UPDATE t_p94134469_chandelier_sale_site.products 
SET catalog = 'Торшеры'
WHERE type = 'floor_lamp'
   OR (LOWER(name) LIKE '%торшер%' AND (catalog IS NULL OR catalog = ''))
   OR (LOWER(description) LIKE '%напольн%' AND LOWER(name) LIKE '%лампа%' AND (catalog IS NULL OR catalog = ''));

-- Декоративное освещение
UPDATE t_p94134469_chandelier_sale_site.products 
SET catalog = 'Декоративное освещение'
WHERE type IN ('decorative_candle', 'decorative_garland', 'decorative_tree')
   OR (LOWER(name) LIKE '%гирлянд%' AND (catalog IS NULL OR catalog = ''))
   OR (LOWER(name) LIKE '%декоратив%' AND (catalog IS NULL OR catalog = ''));

-- Электротовары
UPDATE t_p94134469_chandelier_sale_site.products 
SET catalog = 'Электротовары'
WHERE type IN ('electric_frame', 'electric_other', 'electric_power', 'electric_switch')
   OR (LOWER(name) LIKE '%розетка%' AND (catalog IS NULL OR catalog = ''))
   OR (LOWER(name) LIKE '%выключател%' AND (catalog IS NULL OR catalog = ''))
   OR (LOWER(name) LIKE '%рамка%' AND (catalog IS NULL OR catalog = ''));

-- Для товаров без категории ставим "Светильники" по умолчанию
UPDATE t_p94134469_chandelier_sale_site.products 
SET catalog = 'Светильники'
WHERE catalog IS NULL OR catalog = '';
