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
          {product.brand && (
            <div className="flex py-3 border-b border-gray-200">
              <span className="text-gray-500 w-1/3">Бренд</span>
              <span className="text-gray-900 font-medium">{product.brand}</span>
            </div>
          )}
          <div className="flex py-3 border-b border-gray-200">
            <span className="text-gray-500 w-1/3">Тип</span>
            <span className="text-gray-900 font-medium">{product.type}</span>
          </div>
          <div className="flex py-3 border-b border-gray-200">
            <span className="text-gray-500 w-1/3">Наличие</span>
            <span className="text-gray-900 font-medium">
              {product.inStock ? 'В наличии' : 'Под заказ'}
            </span>
          </div>
          <div className="flex py-3 border-b border-gray-200">
            <span className="text-gray-500 w-1/3">Гарантия</span>
            <span className="text-gray-900 font-medium">2 года</span>
          </div>
          <div className="flex py-3 border-b border-gray-200">
            <span className="text-gray-500 w-1/3">Артикул</span>
            <span className="text-gray-900 font-medium">#{product.id}</span>
          </div>
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
