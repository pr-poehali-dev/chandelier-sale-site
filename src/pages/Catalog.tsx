import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: number;
  name: string;
  price: number;
  brand: string;
  type: string;
  image: string;
  inStock: boolean;
}

const products: Product[] = [
  { id: 1, name: 'Люстра Crystal Dream', price: 45900, brand: 'LuxCrystal', type: 'chandelier', image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/ea3f6d76-2db5-45df-8995-27d163a48b43.jpg', inStock: true },
  { id: 2, name: 'Люстра Modern Style', price: 32500, brand: 'ModernLight', type: 'chandelier', image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/ea3f6d76-2db5-45df-8995-27d163a48b43.jpg', inStock: true },
  { id: 3, name: 'Настольная лампа Desk Pro', price: 8900, brand: 'OfficeLight', type: 'lamp', image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/08d2e311-543a-444f-bd95-27580dbf222a.jpg', inStock: true },
  { id: 4, name: 'Настольная лампа Reading Plus', price: 12400, brand: 'ModernLight', type: 'lamp', image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/08d2e311-543a-444f-bd95-27580dbf222a.jpg', inStock: false },
  { id: 5, name: 'Бра Wave Light', price: 15600, brand: 'DesignLight', type: 'sconce', image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/2544184f-df96-433d-8e76-14c189cae2d4.jpg', inStock: true },
  { id: 6, name: 'Бра Art Deco', price: 19200, brand: 'LuxCrystal', type: 'sconce', image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/2544184f-df96-433d-8e76-14c189cae2d4.jpg', inStock: true },
  { id: 7, name: 'Спот Track Light', price: 6700, brand: 'OfficeLight', type: 'spotlight', image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/08d2e311-543a-444f-bd95-27580dbf222a.jpg', inStock: true },
  { id: 8, name: 'Люстра Elite Crystal', price: 67800, brand: 'LuxCrystal', type: 'chandelier', image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/ea3f6d76-2db5-45df-8995-27d163a48b43.jpg', inStock: true },
];

const Catalog = () => {
  const { toast } = useToast();
  const [cart, setCart] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 100000]);
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const brands = ['LuxCrystal', 'ModernLight', 'OfficeLight', 'DesignLight'];
  const types = [
    { value: 'chandelier', label: 'Люстры' },
    { value: 'lamp', label: 'Настольные лампы' },
    { value: 'sconce', label: 'Бра' },
    { value: 'spotlight', label: 'Споты' },
  ];

  const filteredProducts = products.filter((product) => {
    const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(product.type);
    const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
    return brandMatch && typeMatch && priceMatch;
  });

  const addToCart = (productId: number) => {
    setCart([...cart, productId]);
    toast({
      title: 'Товар добавлен в корзину',
      duration: 2000,
    });
  };

  const removeFromCart = (productId: number) => {
    const index = cart.indexOf(productId);
    if (index > -1) {
      const newCart = [...cart];
      newCart.splice(index, 1);
      setCart(newCart);
    }
  };

  const cartItems = cart.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Цена</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={100000}
          step={1000}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{priceRange[0].toLocaleString()} ₽</span>
          <span>{priceRange[1].toLocaleString()} ₽</span>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Бренд</h3>
        <div className="space-y-2">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedBrands([...selectedBrands, brand]);
                  } else {
                    setSelectedBrands(selectedBrands.filter((b) => b !== brand));
                  }
                }}
              />
              <Label htmlFor={`brand-${brand}`} className="cursor-pointer">
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Тип освещения</h3>
        <div className="space-y-2">
          {types.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type.value}`}
                checked={selectedTypes.includes(type.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedTypes([...selectedTypes, type.value]);
                  } else {
                    setSelectedTypes(selectedTypes.filter((t) => t !== type.value));
                  }
                }}
              />
              <Label htmlFor={`type-${type.value}`} className="cursor-pointer">
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setSelectedBrands([]);
          setSelectedTypes([]);
          setPriceRange([0, 100000]);
        }}
      >
        Сбросить фильтры
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartItemsCount={cart.length}
        onCartClick={() => setShowCart(true)}
        onAuthClick={() => setShowAuth(true)}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Каталог освещения</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block w-64 shrink-0">
            <FilterSidebar />
          </aside>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden mb-4 w-full">
                <Icon name="SlidersHorizontal" className="mr-2 h-4 w-4" />
                Фильтры
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Фильтры</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterSidebar />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1">
            <div className="mb-4 text-sm text-muted-foreground">
              Найдено товаров: {filteredProducts.length}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow animate-fade-in">
                  <CardHeader className="p-0">
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Badge variant="secondary" className="mb-2">
                      {product.brand}
                    </Badge>
                    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                    <p className="text-2xl font-bold text-primary">
                      {product.price.toLocaleString()} ₽
                    </p>
                    {!product.inStock && (
                      <Badge variant="destructive" className="mt-2">
                        Нет в наличии
                      </Badge>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button
                      className="w-full"
                      onClick={() => addToCart(product.id)}
                      disabled={!product.inStock}
                    >
                      <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
                      В корзину
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Корзина ({cart.length})</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {cartItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Корзина пуста</p>
            ) : (
              <>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex gap-3 p-3 border rounded-lg">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-sm text-primary font-semibold">
                          {item.price.toLocaleString()} ₽
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Icon name="Trash2" className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Итого:</span>
                    <span>{cartTotal.toLocaleString()} ₽</span>
                  </div>
                  <Button className="w-full" size="lg">
                    Оформить заказ
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showAuth} onOpenChange={setShowAuth}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Вход / Регистрация</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Войдите в свой аккаунт или создайте новый
            </p>
            <div className="space-y-4">
              <Button variant="outline" className="w-full">
                <Icon name="Mail" className="mr-2 h-4 w-4" />
                Войти через Email
              </Button>
              <Button variant="outline" className="w-full">
                <Icon name="Phone" className="mr-2 h-4 w-4" />
                Войти через Телефон
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Footer />
    </div>
  );
};

export default Catalog;
