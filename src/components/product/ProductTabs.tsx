import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Product } from '@/lib/api';

interface ProductTabsProps {
  product: Product;
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  return (
    <Tabs defaultValue="specs" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-xl p-1">
        <TabsTrigger value="specs" className="rounded-lg data-[state=active]:bg-white">
          Характеристики
        </TabsTrigger>
        <TabsTrigger value="description" className="rounded-lg data-[state=active]:bg-white">
          Описание
        </TabsTrigger>
        <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-white">
          Отзывы ({product.reviews})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="specs" className="mt-6">
        <div className="space-y-3">
          {product.article && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Артикул</span>
              <span className="text-gray-900 font-medium">{product.article}</span>
            </div>
          )}
          {product.brand && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Бренд</span>
              <span className="text-gray-900 font-medium">{product.brand}</span>
            </div>
          )}
          {product.type && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Тип</span>
              <span className="text-gray-900 font-medium">{product.type}</span>
            </div>
          )}
          {product.collection && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Коллекция</span>
              <span className="text-gray-900 font-medium">{product.collection}</span>
            </div>
          )}
          {product.style && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Стиль</span>
              <span className="text-gray-900 font-medium">{product.style}</span>
            </div>
          )}
          {product.brandCountry && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Страна бренда</span>
              <span className="text-gray-900 font-medium">{product.brandCountry}</span>
            </div>
          )}
          {product.manufacturerCountry && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Страна производства</span>
              <span className="text-gray-900 font-medium">{product.manufacturerCountry}</span>
            </div>
          )}
          
          {(product.lampType || product.socketType || product.lampCount || product.lampPower || product.totalPower || product.voltage) && (
            <div className="pt-4 pb-2">
              <h3 className="font-semibold text-gray-900">Освещение</h3>
            </div>
          )}
          {product.lampType && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Тип лампы</span>
              <span className="text-gray-900 font-medium">{product.lampType}</span>
            </div>
          )}
          {product.socketType && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Цоколь</span>
              <span className="text-gray-900 font-medium">{product.socketType}</span>
            </div>
          )}
          {product.bulbType && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Тип лампочки</span>
              <span className="text-gray-900 font-medium">{product.bulbType}</span>
            </div>
          )}
          {product.lampCount && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Количество ламп</span>
              <span className="text-gray-900 font-medium">{product.lampCount} шт</span>
            </div>
          )}
          {product.lampPower && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Мощность лампы</span>
              <span className="text-gray-900 font-medium">{product.lampPower} Вт</span>
            </div>
          )}
          {product.totalPower && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Общая мощность</span>
              <span className="text-gray-900 font-medium">{product.totalPower} Вт</span>
            </div>
          )}
          {product.lightingArea && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Площадь освещения</span>
              <span className="text-gray-900 font-medium">{product.lightingArea} м²</span>
            </div>
          )}
          {product.voltage && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Напряжение</span>
              <span className="text-gray-900 font-medium">{product.voltage} В</span>
            </div>
          )}
          
          {(product.color || product.materials || product.frameMaterial || product.shadeMaterial || product.frameColor || product.shadeColor) && (
            <div className="pt-4 pb-2">
              <h3 className="font-semibold text-gray-900">Материалы и цвета</h3>
            </div>
          )}
          {product.color && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Цвет</span>
              <span className="text-gray-900 font-medium">{product.color}</span>
            </div>
          )}
          {product.materials && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Материалы</span>
              <span className="text-gray-900 font-medium">{product.materials}</span>
            </div>
          )}
          {product.frameMaterial && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Материал каркаса</span>
              <span className="text-gray-900 font-medium">{product.frameMaterial}</span>
            </div>
          )}
          {product.shadeMaterial && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Материал плафона</span>
              <span className="text-gray-900 font-medium">{product.shadeMaterial}</span>
            </div>
          )}
          {product.frameColor && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Цвет каркаса</span>
              <span className="text-gray-900 font-medium">{product.frameColor}</span>
            </div>
          )}
          {product.shadeColor && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Цвет плафона</span>
              <span className="text-gray-900 font-medium">{product.shadeColor}</span>
            </div>
          )}
          
          {(product.height || product.diameter || product.length || product.width || product.depth || product.chainLength) && (
            <div className="pt-4 pb-2">
              <h3 className="font-semibold text-gray-900">Размеры</h3>
            </div>
          )}
          {product.height && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Высота</span>
              <span className="text-gray-900 font-medium">{product.height} см</span>
            </div>
          )}
          {product.diameter && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Диаметр</span>
              <span className="text-gray-900 font-medium">{product.diameter} см</span>
            </div>
          )}
          {product.length && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Длина</span>
              <span className="text-gray-900 font-medium">{product.length} см</span>
            </div>
          )}
          {product.width && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Ширина</span>
              <span className="text-gray-900 font-medium">{product.width} см</span>
            </div>
          )}
          {product.depth && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Глубина</span>
              <span className="text-gray-900 font-medium">{product.depth} см</span>
            </div>
          )}
          {product.chainLength && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Длина цепи</span>
              <span className="text-gray-900 font-medium">{product.chainLength} см</span>
            </div>
          )}
          
          {(product.shadeDirection || product.diffuserType || product.diffuserShape) && (
            <div className="pt-4 pb-2">
              <h3 className="font-semibold text-gray-900">Плафон</h3>
            </div>
          )}
          {product.shadeDirection && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Направление плафона</span>
              <span className="text-gray-900 font-medium">{product.shadeDirection}</span>
            </div>
          )}
          {product.diffuserType && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Тип рассеивателя</span>
              <span className="text-gray-900 font-medium">{product.diffuserType}</span>
            </div>
          )}
          {product.diffuserShape && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Форма рассеивателя</span>
              <span className="text-gray-900 font-medium">{product.diffuserShape}</span>
            </div>
          )}
          
          {(product.ipRating || product.interior || product.place || product.mountType || product.suspendedCeiling !== undefined) && (
            <div className="pt-4 pb-2">
              <h3 className="font-semibold text-gray-900">Размещение и монтаж</h3>
            </div>
          )}
          {product.ipRating && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Степень защиты</span>
              <span className="text-gray-900 font-medium">{product.ipRating}</span>
            </div>
          )}
          {product.interior && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Интерьер</span>
              <span className="text-gray-900 font-medium">{product.interior}</span>
            </div>
          )}
          {product.place && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Место установки</span>
              <span className="text-gray-900 font-medium">{product.place}</span>
            </div>
          )}
          {product.mountType && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Тип крепления</span>
              <span className="text-gray-900 font-medium">{product.mountType}</span>
            </div>
          )}
          {product.suspendedCeiling !== undefined && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Натяжной потолок</span>
              <span className="text-gray-900 font-medium">{product.suspendedCeiling ? 'Да' : 'Нет'}</span>
            </div>
          )}
          
          {(product.hasRemote || product.isDimmable || product.hasColorChange) && (
            <div className="pt-4 pb-2">
              <h3 className="font-semibold text-gray-900">Функции</h3>
            </div>
          )}
          {product.hasRemote && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Пульт управления</span>
              <span className="text-gray-900 font-medium">Да</span>
            </div>
          )}
          {product.isDimmable && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Диммирование</span>
              <span className="text-gray-900 font-medium">Да</span>
            </div>
          )}
          {product.hasColorChange && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Смена цвета</span>
              <span className="text-gray-900 font-medium">Да</span>
            </div>
          )}
          
          {(product.officialWarranty || product.shopWarranty || product.inStock !== undefined) && (
            <div className="pt-4 pb-2">
              <h3 className="font-semibold text-gray-900">Прочее</h3>
            </div>
          )}
          {product.inStock !== undefined && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Наличие</span>
              <span className="text-gray-900 font-medium">
                {product.inStock ? 'В наличии' : 'Под заказ'}
              </span>
            </div>
          )}
          {product.officialWarranty && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Гарантия производителя</span>
              <span className="text-gray-900 font-medium">{product.officialWarranty}</span>
            </div>
          )}
          {product.shopWarranty && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Гарантия магазина</span>
              <span className="text-gray-900 font-medium">{product.shopWarranty}</span>
            </div>
          )}
          {product.assemblyInstructionUrl && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Инструкция</span>
              <a 
                href={product.assemblyInstructionUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-900 font-medium hover:text-primary underline"
              >
                Скачать
              </a>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="description" className="mt-6">
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 leading-relaxed">
            {product.description || 'Описание товара отсутствует.'}
          </p>
          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3">
              <Icon name="Check" className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm text-gray-600">
                Высокое качество материалов и комплектующих
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Icon name="Check" className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm text-gray-600">
                Современный дизайн, подходящий к любому интерьеру
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Icon name="Check" className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm text-gray-600">
                Простая установка и подключение
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Icon name="Check" className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm text-gray-600">
                Официальная гарантия производителя
              </p>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="reviews" className="mt-6">
        <div className="space-y-6">
          {[
            {
              name: 'Александра К.',
              rating: 5,
              date: '15 декабря 2024',
              text: 'Отличное качество! Быстрая доставка, упаковка надежная.',
            },
            {
              name: 'Дмитрий М.',
              rating: 4,
              date: '10 декабря 2024',
              text: 'Хороший товар за свою цену. Рекомендую.',
            },
            {
              name: 'Елена П.',
              rating: 5,
              date: '5 декабря 2024',
              text: 'Очень довольна покупкой! Выглядит стильно и современно.',
            },
          ].map((review, idx) => (
            <div key={idx} className="border-b border-gray-200 pb-6 last:border-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">{review.name}</p>
                  <p className="text-sm text-gray-500">{review.date}</p>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Icon
                      key={i}
                      name="Star"
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-gray-600">{review.text}</p>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ProductTabs;