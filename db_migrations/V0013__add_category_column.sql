-- Add category column to products table
ALTER TABLE t_p94134469_chandelier_sale_site.products 
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Update categories based on type
UPDATE t_p94134469_chandelier_sale_site.products 
SET category = CASE 
    WHEN type IN ('ceiling_chandelier', 'pendant_chandelier', 'люстра') THEN 'Люстры'
    WHEN type IN ('sconce', 'light_wall') THEN 'Бра'
    WHEN type IN ('floor_lamp') THEN 'Торшеры'
    WHEN type IN ('lamp_table') THEN 'Настольные лампы'
    WHEN type IN ('spot_surface', 'spot_recessed', 'light_recessed', 'light_ceiling', 'light_pendant', 'track_light') THEN 'Светильники'
    WHEN type IN ('decorative_garland', 'light_projector', 'light_picture') THEN 'Декоративное освещение'
    WHEN type IN ('electric_frame', 'electric_switch', 'electric_power', 'electric_other') THEN 'Электротовары'
    ELSE 'Другое'
END
WHERE category IS NULL OR category = '';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON t_p94134469_chandelier_sale_site.products(category);