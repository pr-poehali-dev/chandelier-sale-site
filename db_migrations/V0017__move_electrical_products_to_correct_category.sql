-- Переносим электротовары из категории Люстры в категорию Электротовары
UPDATE t_p94134469_chandelier_sale_site.products 
SET category = 'Электротовары'
WHERE category = 'Люстры' 
  AND (
    LOWER(name) LIKE '%димер%' OR 
    LOWER(name) LIKE '%диммер%' OR 
    LOWER(name) LIKE '%розетк%' OR 
    LOWER(name) LIKE '%рамк%' OR 
    LOWER(name) LIKE '%автомат%' OR 
    LOWER(name) LIKE '%выключател%' OR
    LOWER(name) LIKE '%узо%' OR
    LOWER(name) LIKE '%дифференциальн%' OR
    LOWER(name) LIKE '%контактор%' OR
    LOWER(name) LIKE '%реле%' OR
    LOWER(name) LIKE '%удлинител%' OR
    LOWER(name) LIKE '%сетевой фильтр%' OR
    LOWER(name) LIKE '%распределител%' OR
    LOWER(name) LIKE '%кабель%' OR
    LOWER(name) LIKE '%провод%' OR
    LOWER(name) LIKE '%патрон%' OR
    LOWER(name) LIKE '%клемм%'
  );