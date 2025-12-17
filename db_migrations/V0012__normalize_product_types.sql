-- Нормализация типов товаров для правильной фильтрации по категориям

-- Люстры
UPDATE products SET type = 'ceiling_chandelier' WHERE LOWER(type) IN ('потолочная люстра', 'люстра', 'люстра подвесная') AND type != 'Подвесная люстра' AND type != 'Подвесная светодиодная люстра' AND type != 'Подвесной светильник';
UPDATE products SET type = 'pendant_chandelier' WHERE LOWER(type) IN ('подвесная люстра', 'подвесная светодиодная люстра');
UPDATE products SET type = 'fan_chandelier' WHERE LOWER(type) = 'потолочный вентилятор';

-- Светильники
UPDATE products SET type = 'light_pendant' WHERE LOWER(type) = 'подвесной светильник';
UPDATE products SET type = 'light_ceiling' WHERE LOWER(type) = 'потолочный светильник';
UPDATE products SET type = 'light_wall' WHERE LOWER(type) = 'настенный светильник';
UPDATE products SET type = 'light_recessed' WHERE LOWER(type) IN ('встраиваемый светильник', 'встраиваемый светодиодный светильник');
UPDATE products SET type = 'light_ceiling' WHERE LOWER(type) = 'светильник' AND id NOT IN (SELECT id FROM products WHERE type LIKE 'light_%');

-- Бра
UPDATE products SET type = 'sconce' WHERE LOWER(type) = 'бра';

-- Настольные лампы и торшеры
UPDATE products SET type = 'lamp_table' WHERE LOWER(type) = 'настольная лампа';
UPDATE products SET type = 'floor_lamp' WHERE LOWER(type) = 'торшер';

-- Споты
UPDATE products SET type = 'spot_recessed' WHERE LOWER(type) = 'встраиваемый спот';
UPDATE products SET type = 'spot_surface' WHERE LOWER(type) IN ('спот', 'светодиодный спот', 'светильник на штанге');

-- Трековые светильники
UPDATE products SET type = 'track_light' WHERE LOWER(type) = 'трековый светильник';
UPDATE products SET type = 'track_rail' WHERE LOWER(type) = 'шинопровод';

-- Электротовары
UPDATE products SET type = 'electric_switch' WHERE LOWER(type) IN ('выключатель', 'включатель');
UPDATE products SET type = 'electric_frame' WHERE LOWER(type) = 'рамка';
UPDATE products SET type = 'electric_power' WHERE LOWER(type) IN ('блок питания', 'коннектор питания', 'выдвижной розеточный блок');
UPDATE products SET type = 'electric_other' WHERE LOWER(type) IN ('электрическая', 'электротовары', 'электротовары/комплектующие для эуи', 'вентилятор');

-- Декоративные элементы
UPDATE products SET type = 'decorative_garland' WHERE LOWER(type) = 'гирлянда';
UPDATE products SET type = 'decorative_tree' WHERE LOWER(type) = 'светодиодное дерево';
UPDATE products SET type = 'decorative_candle' WHERE LOWER(type) = 'подсвечник';

-- Специальные светильники
UPDATE products SET type = 'light_mirror' WHERE LOWER(type) = 'подсветка для зеркал';
UPDATE products SET type = 'light_picture' WHERE LOWER(type) = 'подсветка для картин';
UPDATE products SET type = 'light_projector' WHERE LOWER(type) = 'светильник-проектор';
UPDATE products SET type = 'outdoor_lantern' WHERE LOWER(type) = 'светодиодный фонарь';