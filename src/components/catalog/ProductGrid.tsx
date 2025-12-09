import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Product } from '@/lib/api';

interface TypeItem {
  value: string;
  label: string;
  icon: string;
  color: string;
}

interface ProductGridProps {
  products: Product[];
  types: TypeItem[];
  favorites: number[];
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: Product) => void;
}

const ProductGrid = ({
  products,
  types,
  favorites,
  onToggleFavorite,
  onAddToCart,
}: ProductGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {products.map((product) => {
        const productType = types.find(t => t.value === product.type);
        const isLuxury = product.price > 50000;
        const isBudget = product.price < 10000;
        
        return (
          <Card 
            key={product.id} 
            className={`overflow-hidden hover:shadow-lg transition-all animate-fade-in cursor-pointer group ${
              isLuxury ? 'border-2 border-yellow-500/20 hover:border-yellow-500/40' :
              isBudget ? 'border-green-500/20 hover:border-green-500/40' :
              'hover:border-primary/20'
            }`}
            onClick={() => window.location.href = `/product/${product.id}`}
          >
            <CardHeader className="p-0 relative">
              <div className="aspect-square overflow-hidden bg-muted relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {isLuxury && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                    <Icon name="Crown" className="h-3 w-3" />
                    Premium
                  </div>
                )}
                {isBudget && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                    <Icon name="Tag" className="h-3 w-3" />
                    Выгодно
                  </div>
                )}
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge variant="destructive" className="text-lg px-4 py-2">
                      Нет в наличии
                    </Badge>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(product.id);
                }}
              >
                <Icon 
                  name="Heart" 
                  className={`h-5 w-5 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
                />
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="flex items-center gap-1">
                  {productType && (
                    <Icon name={productType.icon as any} className={`h-3 w-3 ${productType.color}`} />
                  )}
                  {product.brand}
                </Badge>
                <div className="flex items-center gap-1 text-sm">
                  <Icon name="Star" className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{product.rating}</span>
                  <span className="text-muted-foreground">({product.reviews})</span>
                </div>
              </div>
              <h3 className="font-semibold text-lg leading-tight min-h-[3.5rem]">{product.name}</h3>
              
              <div className="space-y-2">
                {(product.lampType || product.totalPower || product.lampCount) && (
                  <div className="flex flex-wrap gap-1">
                    {product.lampType && (
                      <Badge variant="outline" className="text-xs">
                        {product.lampType}
                      </Badge>
                    )}
                    {product.totalPower && (
                      <Badge variant="outline" className="text-xs">
                        {product.totalPower}W
                      </Badge>
                    )}
                    {product.lampCount && (
                      <Badge variant="outline" className="text-xs">
                        {product.lampCount} {product.lampCount === 1 ? 'лампа' : product.lampCount < 5 ? 'лампы' : 'ламп'}
                      </Badge>
                    )}
                  </div>
                )}
                
                {(product.color || product.materials) && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {product.color && (
                      <div className="flex items-center gap-1">
                        <Icon name="Palette" className="h-3 w-3" />
                        <span>{product.color}</span>
                      </div>
                    )}
                    {product.materials && (
                      <div className="flex items-center gap-1">
                        <Icon name="Box" className="h-3 w-3" />
                        <span>{product.materials}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {(product.hasRemote || product.isDimmable || product.hasColorChange) && (
                  <div className="flex flex-wrap gap-1">
                    {product.hasRemote && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Icon name="Radio" className="h-3 w-3" />
                        Пульт
                      </Badge>
                    )}
                    {product.isDimmable && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Icon name="Sun" className="h-3 w-3" />
                        Диммер
                      </Badge>
                    )}
                    {product.hasColorChange && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Icon name="Palette" className="h-3 w-3" />
                        RGB
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {product.price.toLocaleString()} ₽
                  </p>
                  {isLuxury && (
                    <p className="text-xs text-muted-foreground">
                      Рассрочка от {Math.round(product.price / 12).toLocaleString()} ₽/мес
                    </p>
                  )}
                </div>
                {productType && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Icon name={productType.icon as any} className={`h-3 w-3 ${productType.color}`} />
                    {productType.label}
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/product/${product.id}`;
                }}
              >
                <Icon name="Eye" className="mr-2 h-4 w-4" />
                Подробнее
              </Button>
              <Button
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product);
                }}
                disabled={!product.inStock}
              >
                <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
                В корзину
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default ProductGrid;