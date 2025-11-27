import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthDialog from '@/components/AuthDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api, Product, User } from '@/lib/api';

const Catalog = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [cart, setCart] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<number[]>([0, 150000]);
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);

  const brands = ['LuxCrystal', 'ModernLight', 'OfficeLight', 'DesignLight', 'EuroLux', 'ArtLight', 'SmartLight', 'ClassicLux'];
  const types = [
    { value: 'chandelier', label: 'Люстры' },
    { value: 'lamp', label: 'Настольные лампы' },
    { value: 'sconce', label: 'Бра' },
    { value: 'spotlight', label: 'Споты' },
    { value: 'floor_lamp', label: 'Торшеры' },
    { value: 'pendant', label: 'Подвесные светильники' },
  ];
  
  const categories = [
    { value: 'sale', label: 'Распродажа', highlight: true },
    { value: 'chandelier', label: 'Люстры' },
    { value: 'sconce', label: 'Светильники' },
    { value: 'sconce-wall', label: 'Бра' },
    { value: 'lamp', label: 'Настольные лампы' },
    { value: 'spotlight', label: 'Споты' },
    { value: 'street', label: 'Уличное освещение' },
    { value: 'track', label: 'Трековые светильники' },
    { value: 'appliances', label: 'Электротовары' },
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({ limit: 200 });
      if (data.products.length < 50) {
        await api.seedProducts();
        const refreshedData = await api.getProducts({ limit: 200 });
        setProducts(refreshedData.products);
      } else {
        setProducts(data.products);
      }
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить товары',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const searchMatch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(product.type);
    const categoryMatch = selectedCategory === '' || selectedCategory === 'sale' || product.type === selectedCategory || 
      (selectedCategory === 'sconce-wall' && product.type === 'sconce');
    const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
    return searchMatch && brandMatch && typeMatch && categoryMatch && priceMatch;
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, загрузите изображение',
        variant: 'destructive',
      });
      return;
    }

    setImageSearchLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const base64Data = base64.split(',')[1];

        try {
          const result = await api.searchByImage(base64Data);
          setProducts(result.products);
          setSearchQuery('');
          setSelectedBrands([]);
          setSelectedTypes([]);
          
          toast({
            title: 'Поиск завершён',
            description: result.description || `Найдено ${result.products.length} товаров`,
          });
        } catch (error) {
          toast({
            title: 'Ошибка поиска',
            description: error instanceof Error ? error.message : 'Попробуйте другое фото',
            variant: 'destructive',
          });
        } finally {
          setImageSearchLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setImageSearchLoading(false);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить изображение',
        variant: 'destructive',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

  const removeAllOfProduct = (productId: number) => {
    setCart(cart.filter(id => id !== productId));
  };

  const getCartItemQuantity = (productId: number) => {
    return cart.filter(id => id === productId).length;
  };

  const uniqueCartItems = Array.from(new Set(cart))
    .map(id => products.find(p => p.id === id))
    .filter(Boolean) as Product[];
  
  const cartTotal = cart.reduce((sum, id) => {
    const product = products.find(p => p.id === id);
    return sum + (product?.price || 0);
  }, 0);

  const toggleFavorite = (productId: number) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    
    toast({
      title: favorites.includes(productId) ? 'Удалено из избранного' : 'Добавлено в избранное',
      duration: 2000,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    toast({
      title: 'Выход выполнен',
    });
    window.location.reload();
  };

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Цена</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={150000}
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
          setPriceRange([0, 150000]);
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">Каталог освещения</h1>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm">Привет, {user.first_name}!</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Выйти
              </Button>
            </div>
          )}
        </div>

        <div className="mb-8 border-b">
          <div className="flex gap-1 overflow-x-auto pb-px scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(selectedCategory === category.value ? '' : category.value)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all relative ${
                  selectedCategory === category.value
                    ? 'text-foreground'
                    : category.highlight
                    ? 'text-secondary hover:text-secondary/80'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {category.label}
                {selectedCategory === category.value && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск по названию, бренду..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageSearchLoading}
              className="whitespace-nowrap"
            >
              {imageSearchLoading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Поиск...
                </>
              ) : (
                <>
                  <Icon name="Image" className="mr-2 h-4 w-4" />
                  Поиск по фото
                </>
              )}
            </Button>
          </div>
          
          {searchQuery && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                Поиск: {searchQuery}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
              >
                <Icon name="X" className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block w-64 shrink-0">
            <FilterSidebar />
          </aside>

          <Sheet>
            <Button variant="outline" className="lg:hidden mb-4 w-full">
              <Icon name="SlidersHorizontal" className="mr-2 h-4 w-4" />
              Фильтры
            </Button>
          </Sheet>

          <div className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Загрузка товаров...</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Найдено товаров: {filteredProducts.length}
                  </span>
                  {(searchQuery || selectedBrands.length > 0 || selectedTypes.length > 0 || selectedCategory || priceRange[0] > 0 || priceRange[1] < 150000) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedBrands([]);
                        setSelectedTypes([]);
                        setSelectedCategory('');
                        setPriceRange([0, 150000]);
                        loadProducts();
                      }}
                    >
                      <Icon name="RotateCcw" className="mr-2 h-4 w-4" />
                      Сбросить всё
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow animate-fade-in cursor-pointer" onClick={() => setSelectedProduct(product)}>
                      <CardHeader className="p-0 relative">
                        <div className="aspect-square overflow-hidden bg-muted">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(product.id);
                          }}
                        >
                          <Icon 
                            name="Heart" 
                            className={`h-5 w-5 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
                          />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-4">
                        <Badge variant="secondary" className="mb-2">
                          {product.brand}
                        </Badge>
                        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                        )}
                        <p className="text-2xl font-bold text-primary">
                          {product.price.toLocaleString()} ₽
                        </p>
                        {!product.inStock && (
                          <Badge variant="destructive" className="mt-2">
                            Нет в наличии
                          </Badge>
                        )}
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                          }}
                        >
                          <Icon name="Eye" className="mr-2 h-4 w-4" />
                          Подробнее
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product.id);
                          }}
                          disabled={!product.inStock}
                        >
                          <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
                          В корзину
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Корзина ({cart.length} товаров)</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4 flex flex-col h-[calc(100vh-120px)]">
            {uniqueCartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Icon name="ShoppingCart" className="h-20 w-20 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">Корзина пуста</p>
                <Button className="mt-4" onClick={() => setShowCart(false)}>
                  Перейти к покупкам
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                  {uniqueCartItems.map((item) => {
                    const quantity = getCartItemQuantity(item.id);
                    const itemTotal = item.price * quantity;
                    
                    return (
                      <div key={item.id} className="flex gap-4 p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-20 h-20 object-cover rounded flex-shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-1 line-clamp-2">{item.name}</h4>
                          <Badge variant="outline" className="text-xs mb-2">
                            {item.brand}
                          </Badge>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 border rounded-md">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Icon name="Minus" className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">
                                {quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => addToCart(item.id)}
                              >
                                <Icon name="Plus" className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-primary">
                                {itemTotal.toLocaleString()} ₽
                              </p>
                              {quantity > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  {item.price.toLocaleString()} ₽ × {quantity}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                          onClick={() => removeAllOfProduct(item.id)}
                        >
                          <Icon name="Trash2" className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                
                <div className="border-t pt-4 space-y-4 bg-background">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Товаров:</span>
                      <span>{cart.length} шт.</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Итого:</span>
                      <span className="text-primary">{cartTotal.toLocaleString()} ₽</span>
                    </div>
                  </div>
                  <Button className="w-full" size="lg">
                    <Icon name="CreditCard" className="mr-2 h-5 w-5" />
                    Оформить заказ
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setShowCart(false)}
                  >
                    Продолжить покупки
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AuthDialog
        open={showAuth}
        onOpenChange={setShowAuth}
        onAuthSuccess={(user) => setUser(user)}
      />

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
              </DialogHeader>
              
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4">
                  <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Badge variant="secondary" className="mb-3">
                      {selectedProduct.brand}
                    </Badge>
                    <p className="text-3xl font-bold text-primary mb-4">
                      {selectedProduct.price.toLocaleString()} ₽
                    </p>
                    {selectedProduct.inStock ? (
                      <Badge variant="default" className="bg-green-600">
                        <Icon name="Check" className="mr-1 h-3 w-3" />
                        В наличии
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Нет в наличии</Badge>
                    )}
                  </div>

                  <Tabs defaultValue="description" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="description">Описание</TabsTrigger>
                      <TabsTrigger value="specs">Характеристики</TabsTrigger>
                      <TabsTrigger value="reviews">Отзывы</TabsTrigger>
                    </TabsList>
                    <TabsContent value="description" className="space-y-4 mt-4">
                      <div>
                        <h3 className="font-semibold mb-2">О товаре</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {selectedProduct.description || 'Описание товара отсутствует'}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Преимущества</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <Icon name="Check" className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Высокое качество материалов</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Icon name="Check" className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Энергоэффективность</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Icon name="Check" className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Гарантия 2 года</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Icon name="Check" className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Бесплатная доставка</span>
                          </li>
                        </ul>
                      </div>
                    </TabsContent>
                    <TabsContent value="specs" className="mt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Бренд</span>
                          <span className="font-medium">{selectedProduct.brand}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Тип</span>
                          <span className="font-medium">
                            {types.find(t => t.value === selectedProduct.type)?.label || selectedProduct.type}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Мощность</span>
                          <span className="font-medium">40-60 Вт</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Световой поток</span>
                          <span className="font-medium">3000-4000 лм</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Цветовая температура</span>
                          <span className="font-medium">2700-6500K</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Материал</span>
                          <span className="font-medium">Металл, стекло</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Диммирование</span>
                          <span className="font-medium">Да</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Степень защиты</span>
                          <span className="font-medium">IP20</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Гарантия</span>
                          <span className="font-medium">2 года</span>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="reviews" className="mt-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Icon
                                    key={star}
                                    name="Star"
                                    className={`h-5 w-5 ${star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                              <span className="font-semibold text-lg">4.0</span>
                            </div>
                            <p className="text-sm text-muted-foreground">На основе 12 отзывов</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Icon name="MessageSquare" className="mr-2 h-4 w-4" />
                            Оставить отзыв
                          </Button>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                          <div className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-primary">АМ</span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">Анна М.</p>
                                  <p className="text-xs text-muted-foreground">15 ноября 2024</p>
                                </div>
                              </div>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Icon
                                    key={star}
                                    name="Star"
                                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Отличный светильник! Качество сборки на высоте, свет мягкий и приятный. 
                              Идеально вписался в интерьер гостиной. Рекомендую!
                            </p>
                          </div>

                          <div className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-primary">ДП</span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">Дмитрий П.</p>
                                  <p className="text-xs text-muted-foreground">8 ноября 2024</p>
                                </div>
                              </div>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Icon
                                    key={star}
                                    name="Star"
                                    className={`h-4 w-4 ${star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Хороший вариант за свои деньги. Единственный минус - немного долгая доставка, 
                              но это не критично. Светит отлично, дизайн современный.
                            </p>
                          </div>

                          <div className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-primary">ЕС</span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">Елена С.</p>
                                  <p className="text-xs text-muted-foreground">2 ноября 2024</p>
                                </div>
                              </div>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Icon
                                    key={star}
                                    name="Star"
                                    className={`h-4 w-4 ${star <= 3 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              В целом неплохо, но ожидала большего по яркости. 
                              Для небольшой комнаты подходит, но для просторного помещения может быть маловато.
                            </p>
                          </div>

                          <div className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-primary">ИВ</span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">Игорь В.</p>
                                  <p className="text-xs text-muted-foreground">28 октября 2024</p>
                                </div>
                              </div>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Icon
                                    key={star}
                                    name="Star"
                                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Превосходное качество! Установил в офисе - все довольны. 
                              Энергопотребление низкое, свет равномерный. Цена полностью оправдана.
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex gap-3 pt-4">
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={() => {
                        addToCart(selectedProduct.id);
                        setSelectedProduct(null);
                      }}
                      disabled={!selectedProduct.inStock}
                    >
                      <Icon name="ShoppingCart" className="mr-2 h-5 w-5" />
                      В корзину
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        addToCart(selectedProduct.id);
                        setSelectedProduct(null);
                        setShowCart(true);
                      }}
                      disabled={!selectedProduct.inStock}
                    >
                      Купить сейчас
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Catalog;