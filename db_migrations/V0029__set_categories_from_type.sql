-- Расставляем категории на основе type для товаров где category IS NULL
UPDATE products SET category = 'Люстры'
WHERE category IS NULL AND type IN ('люстра', 'ceiling_chandelier', 'pendant_chandelier', 'fan_chandelier');

UPDATE products SET category = 'Светильники'
WHERE category IS NULL AND type IN ('light_ceiling', 'light_recessed', 'light_pendant', 'light_projector', 'light_wall', 'light_mirror', 'light_picture', 'spot_surface', 'spot_recessed');

UPDATE products SET category = 'Бра'
WHERE category IS NULL AND type IN ('sconce', 'light_wall');

UPDATE products SET category = 'Настольные лампы'
WHERE category IS NULL AND type IN ('lamp_table');

UPDATE products SET category = 'Торшеры'
WHERE category IS NULL AND type IN ('floor_lamp');

UPDATE products SET category = 'Трековые светильники'
WHERE category IS NULL AND type IN ('track_light', 'track_rail');

UPDATE products SET category = 'Декоративное освещение'
WHERE category IS NULL AND type IN ('decorative_candle', 'decorative_garland', 'decorative_tree', 'outdoor_lantern');

UPDATE products SET category = 'Электротовары'
WHERE category IS NULL AND type IN ('electric_frame', 'electric_other', 'electric_power', 'electric_switch');
