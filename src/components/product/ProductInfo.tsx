import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Product } from '@/lib/api';

interface ProductInfoProps {
  product: Product;
  isFavorite: boolean;
  onAddToCart: () => void;
  onToggleFavorite: () => void;
  onBuyNow: () => void;
}

const ProductInfo = ({ 
  product, 
  isFavorite, 
  onAddToCart, 
  onToggleFavorite,
  onBuyNow 
}: ProductInfoProps) => {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-gray-500 text-sm">{product.brand}</span>
          {product.inStock ? (
            <span className="text-green-500 text-sm flex items-center gap-1">
              <Icon name="Check" className="h-4 w-4" />
              В наличии
            </span>
          ) : (
            <span className="text-red-500 text-sm flex items-center gap-1">
              <Icon name="X" className="h-4 w-4" />
              Нет в наличии
            </span>
          )}
        </div>
        
        <h1 className="text-3xl font-bold mb-4 text-gray-900">{product.name}</h1>
        
        {product.description && (
          <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</p>
        )}
        
        {product.type && (
          <div className="mb-6">
            <Badge variant="outline" className="text-gray-600 border-gray-300">
              {product.type}
            </Badge>
          </div>
        )}
        
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Icon
                key={i}
                name="Star"
                className={`h-5 w-5 ${
                  i < Math.floor(product.rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-zinc-700'
                }`}
              />
            ))}
          </div>
          <span className="text-gray-500 text-sm">
            {product.rating} ({product.reviews} отзывов)
          </span>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-gray-900">
              {product.price.toLocaleString()} ₽
            </span>
          </div>
          {product.price > 50000 && (
            <p className="text-sm text-gray-500">
              Рассрочка от {Math.round(product.price / 12).toLocaleString()} ₽/мес
            </p>
          )}
        </div>

        <div className="flex gap-3 mb-6">
          <Button
            size="lg"
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
            onClick={onBuyNow}
          >
            Купить сейчас
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 border-gray-900 text-gray-900 hover:bg-gray-50 rounded-xl"
            onClick={onAddToCart}
          >
            <Icon name="ShoppingCart" className="mr-2 h-5 w-5" />
            В корзину
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-xl border-gray-300 text-gray-600 hover:bg-gray-50"
            onClick={onToggleFavorite}
          >
            <Icon
              name="Heart"
              className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
            />
          </Button>
        </div>

        <div className="space-y-3 bg-gray-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-sm">
            <Icon name="Truck" className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Бесплатная доставка</p>
              <p className="text-gray-500">При заказе от 10 000 ₽</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Icon name="RotateCcw" className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Возврат в течение 14 дней</p>
              <p className="text-gray-500">Без объяснения причин</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Icon name="Shield" className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Гарантия 2 года</p>
              <p className="text-gray-500">Официальная гарантия производителя</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
