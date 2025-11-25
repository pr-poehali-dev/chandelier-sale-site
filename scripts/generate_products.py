import random

brands = ['LuxCrystal', 'ModernLight', 'OfficeLight', 'DesignLight', 'EuroLux', 'ArtLight', 'SmartLight', 'ClassicLux']
types = [
    ('chandelier', 'Люстра'),
    ('lamp', 'Настольная лампа'),
    ('sconce', 'Бра'),
    ('spotlight', 'Спот'),
    ('floor_lamp', 'Торшер'),
    ('pendant', 'Подвесной светильник')
]
images = [
    'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/ea3f6d76-2db5-45df-8995-27d163a48b43.jpg',
    'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/08d2e311-543a-444f-bd95-27580dbf222a.jpg',
    'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/2544184f-df96-433d-8e76-14c189cae2d4.jpg'
]

styles = ['Crystal', 'Modern', 'Classic', 'Vintage', 'Industrial', 'Minimalist', 'Art Deco', 'Scandinavian', 
          'Loft', 'Contemporary', 'Retro', 'Smart', 'Designer', 'Elegant', 'Premium', 'Luxury', 'Urban',
          'Nordic', 'Baroque', 'Renaissance', 'Empire', 'Gothic', 'Fusion', 'Hi-Tech', 'Eco']

adjectives_ru = ['Элегантный', 'Стильный', 'Роскошный', 'Современный', 'Классический', 'Дизайнерский',
                 'Премиальный', 'Эксклюзивный', 'Изысканный', 'Утонченный', 'Практичный', 'Функциональный']

materials = ['хрусталь', 'металл', 'стекло', 'дерево', 'ткань', 'пластик', 'керамика', 'бетон', 'мрамор']

rooms = ['гостиной', 'спальни', 'кухни', 'кабинета', 'прихожей', 'детской', 'столовой', 'ванной']

values = []
for i in range(200):
    type_en, type_ru = random.choice(types)
    brand = random.choice(brands)
    style = random.choice(styles)
    material = random.choice(materials)
    room = random.choice(rooms)
    adj = random.choice(adjectives_ru)
    
    name = f'{type_ru} {style} {brand[:3]}-{i+1:03d}'
    desc = f'{adj} светильник из {material}. Отличное решение для {room}.'
    price = round(random.uniform(3000, 150000), 2)
    image = random.choice(images)
    in_stock = 'true' if random.random() > 0.1 else 'false'
    
    values.append(f"('{name}', '{desc}', {price}, '{brand}', '{type_en}', '{image}', {in_stock})")

print('INSERT INTO products (name, description, price, brand, type, image_url, in_stock) VALUES')
print(',\n'.join(values) + ';')
