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
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<number[]>([0, 150000]);
  const [hasRemote, setHasRemote] = useState(false);
  const [isDimmable, setIsDimmable] = useState(false);
  const [hasColorChange, setHasColorChange] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const brands = ['LuxCrystal', 'ModernLight', 'OfficeLight', 'DesignLight', 'EuroLux', 'ArtLight', 'SmartLight', 'ClassicLux'];
  const types = [
    { value: 'chandelier', label: 'Люстры', icon: 'Lightbulb', color: 'text-yellow-500' },
    { value: 'lamp', label: 'Настольные лампы', icon: 'Lamp', color: 'text-blue-500' },
    { value: 'sconce', label: 'Бра', icon: 'WallLamp', color: 'text-purple-500' },
    { value: 'spotlight', label: 'Споты', icon: 'Flashlight', color: 'text-orange-500' },
    { value: 'floor_lamp', label: 'Торшеры', icon: 'FlashlightOff', color: 'text-green-500' },
    { value: 'pendant', label: 'Подвесные светильники', icon: 'Droplet', color: 'text-cyan-500' },
  ];
  
  const categories = [
    { value: '', label: 'Все товары' },
    { value: 'chandelier', label: 'Люстры' },
    { value: 'lamp', label: 'Настольные лампы' },
    { value: 'sconce', label: 'Бра' },
    { value: 'spotlight', label: 'Споты' },
    { value: 'floor_lamp', label: 'Торшеры' },
    { value: 'pendant', label: 'Подвесные' },
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
    updateCartCount();
    loadProducts();
  }, []);

  const updateCartCount = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      setCartCount(cart.length);
    }
  };

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
    const remoteMatch = !hasRemote || product.hasRemote;
    const dimmableMatch = !isDimmable || product.isDimmable;
    const colorChangeMatch = !hasColorChange || product.hasColorChange;
    return searchMatch && brandMatch && typeMatch && categoryMatch && priceMatch && remoteMatch && dimmableMatch && colorChangeMatch;
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

  const addToCart = (product: Product) => {
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];
    
    const existingItem = cart.find((item: any) => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    setCartCount(cart.length);
    
    toast({
      title: 'Товар добавлен в корзину',
      duration: 2000,
    });
  };

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

      <div>
        <h3 className="font-semibold mb-4">Дополнительно</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-remote"
              checked={hasRemote}
              onCheckedChange={(checked) => setHasRemote(!!checked)}
            />
            <Label htmlFor="has-remote" className="cursor-pointer flex items-center gap-2">
              <Icon name="Radio" className="h-4 w-4 text-primary" />
              С пультом управления
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-dimmable"
              checked={isDimmable}
              onCheckedChange={(checked) => setIsDimmable(!!checked)}
            />
            <Label htmlFor="is-dimmable" className="cursor-pointer flex items-center gap-2">
              <Icon name="Sun" className="h-4 w-4 text-orange-500" />
              Регулировка яркости
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-color-change"
              checked={hasColorChange}
              onCheckedChange={(checked) => setHasColorChange(!!checked)}
            />
            <Label htmlFor="has-color-change" className="cursor-pointer flex items-center gap-2">
              <Icon name="Palette" className="h-4 w-4 text-purple-500" />
              Смена цвета
            </Label>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setSelectedBrands([]);
          setSelectedTypes([]);
          setPriceRange([0, 150000]);
          setHasRemote(false);
          setIsDimmable(false);
          setHasColorChange(false);
        }}
      >
        Сбросить фильтры
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartItemsCount={cartCount}
        onCartClick={() => window.location.href = '/cart'}
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

          <Button 
            variant="outline" 
            className="lg:hidden mb-4 w-full"
            onClick={() => setShowMobileFilters(true)}
          >
            <Icon name="SlidersHorizontal" className="mr-2 h-4 w-4" />
            Фильтры
          </Button>

          <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Фильтры</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterSidebar />
              </div>
            </SheetContent>
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
                  {(searchQuery || selectedBrands.length > 0 || selectedTypes.length > 0 || selectedCategory || priceRange[0] > 0 || priceRange[1] < 150000 || hasRemote || isDimmable || hasColorChange) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedBrands([]);
                        setSelectedTypes([]);
                        setSelectedCategory('');
                        setPriceRange([0, 150000]);
                        setHasRemote(false);
                        setIsDimmable(false);
                        setHasColorChange(false);
                        loadProducts();
                      }}
                    >
                      <Icon name="RotateCcw" className="mr-2 h-4 w-4" />
                      Сбросить всё
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
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
                      onClick={() => setSelectedProduct(product)}
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
                            toggleFavorite(product.id);
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
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
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
                            addToCart(product);
                          }}
                          disabled={!product.inStock}
                        >
                          <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
                          В корзину
                        </Button>
                      </CardFooter>
                    </Card>
                  )})}
                </div>
              </>
            )}
          </div>
        </div>
      </main>



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
                        addToCart(selectedProduct);
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
                        addToCart(selectedProduct);
                        setSelectedProduct(null);
                        window.location.href = '/cart';
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