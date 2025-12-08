import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthDialog from '@/components/AuthDialog';
import CategoryNavigation from '@/components/catalog/CategoryNavigation';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import ProductGrid from '@/components/catalog/ProductGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { api, Product, User } from '@/lib/api';

const Catalog = () => {
  const { toast } = useToast();
  const { addToCart, totalItems } = useCart();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [hoverCategory, setHoverCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<number[]>([0, 150000]);
  const [hasRemote, setHasRemote] = useState(false);
  const [isDimmable, setIsDimmable] = useState(false);
  const [hasColorChange, setHasColorChange] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isSale, setIsSale] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [isPickup, setIsPickup] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [styleSearch, setStyleSearch] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colorSearch, setColorSearch] = useState('');
  const [sizeRange, setSizeRange] = useState({
    height: [0, 3000],
    length: [0, 3000],
    depth: [0, 3000],
    width: [0, 3000],
    diameter: [0, 3000],
    chainLength: [0, 3000],
  });
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');

  const brands = Array.from(new Set(products.map(p => p.brand))).sort();
  
  const types = [
    { value: 'chandelier', label: 'Люстры', icon: 'Lightbulb', color: 'text-yellow-500' },
    { value: 'ceiling_chandelier', label: 'Потолочные люстры', icon: 'Circle', color: 'text-amber-500' },
    { value: 'pendant_chandelier', label: 'Подвесные люстры', icon: 'Droplet', color: 'text-cyan-500' },
    { value: 'cascade', label: 'Каскадные', icon: 'Layers', color: 'text-indigo-500' },
    { value: 'rod', label: 'На штанге', icon: 'Minus', color: 'text-slate-500' },
    { value: 'large', label: 'Большие люстры', icon: 'Maximize2', color: 'text-rose-500' },
    { value: 'fan_chandelier', label: 'Люстры-вентиляторы', icon: 'Fan', color: 'text-teal-500' },
    { value: 'elite_chandelier', label: 'Элитные люстры', icon: 'Crown', color: 'text-yellow-600' },
    
    { value: 'light_pendant', label: 'Подвесные светильники', icon: 'Droplet', color: 'text-blue-400' },
    { value: 'light_ceiling', label: 'Потолочные светильники', icon: 'Circle', color: 'text-slate-400' },
    { value: 'light_wall', label: 'Настенные светильники', icon: 'Square', color: 'text-purple-400' },
    { value: 'light_wall_ceiling', label: 'Настенно-потолочные', icon: 'LayoutGrid', color: 'text-indigo-400' },
    { value: 'light_surface', label: 'Накладные светильники', icon: 'Box', color: 'text-emerald-400' },
    { value: 'light_recessed', label: 'Встраиваемые светильники', icon: 'CircleDot', color: 'text-teal-400' },
    { value: 'light_spot', label: 'Точечные светильники', icon: 'Dot', color: 'text-cyan-400' },
    { value: 'light_night', label: 'Ночники', icon: 'Moon', color: 'text-violet-400' },
    { value: 'light_furniture', label: 'Мебельные', icon: 'Sofa', color: 'text-amber-400' },
    { value: 'light_plant', label: 'Для растений', icon: 'Leaf', color: 'text-green-500' },
    { value: 'light_bactericidal', label: 'Бактерицидные', icon: 'ShieldPlus', color: 'text-red-400' },
    { value: 'light_kit', label: 'Комплекты светильников', icon: 'Package', color: 'text-orange-400' },
    { value: 'light_elite', label: 'Элитные светильники', icon: 'Crown', color: 'text-yellow-500' },
    
    { value: 'lamp_decorative', label: 'Декоративные лампы', icon: 'Sparkles', color: 'text-pink-500' },
    { value: 'lamp_office', label: 'Офисные лампы', icon: 'Briefcase', color: 'text-gray-500' },
    { value: 'lamp_kids', label: 'Детские лампы', icon: 'Baby', color: 'text-pink-400' },
    { value: 'lamp_clip', label: 'На прищепке', icon: 'Paperclip', color: 'text-blue-500' },
    { value: 'lamp_clamp', label: 'На струбцине', icon: 'Grip', color: 'text-slate-500' },
    
    { value: 'sconce', label: 'Бра', icon: 'WallLamp', color: 'text-purple-500' },
    
    { value: 'spot_one', label: 'Спот с 1 плафоном', icon: 'Circle', color: 'text-orange-500' },
    { value: 'spot_two', label: 'Спот с 2 плафонами', icon: 'CircleDot', color: 'text-orange-600' },
    { value: 'spot_three_plus', label: 'Спот с 3+ плафонами', icon: 'CircleEllipsis', color: 'text-orange-700' },
    { value: 'spot_recessed', label: 'Встраиваемые споты', icon: 'Disc', color: 'text-amber-600' },
    { value: 'spot_surface', label: 'Накладные споты', icon: 'Box', color: 'text-yellow-600' },
    
    { value: 'outdoor_street', label: 'Уличные светильники', icon: 'Lamp', color: 'text-slate-600' },
    { value: 'outdoor_landscape', label: 'Ландшафтные', icon: 'Trees', color: 'text-green-600' },
    { value: 'outdoor_architectural', label: 'Архитектурные', icon: 'Building', color: 'text-stone-600' },
    { value: 'outdoor_park', label: 'Парковые', icon: 'TreePine', color: 'text-emerald-600' },
    { value: 'outdoor_wall', label: 'Уличные настенные', icon: 'Square', color: 'text-zinc-600' },
    { value: 'outdoor_console', label: 'Консольные', icon: 'Minus', color: 'text-neutral-600' },
    { value: 'outdoor_ground', label: 'Грунтовые', icon: 'Mountain', color: 'text-brown-600' },
    { value: 'outdoor_underwater', label: 'Подводные', icon: 'Waves', color: 'text-blue-600' },
    { value: 'outdoor_solar', label: 'На солнечных батареях', icon: 'Sun', color: 'text-yellow-500' },
    { value: 'outdoor_floodlight', label: 'Прожекторы', icon: 'Lightbulb', color: 'text-orange-500' },
    { value: 'outdoor_flashlight', label: 'Фонарики', icon: 'Flashlight', color: 'text-gray-500' },
    
    { value: 'track_complete', label: 'Трековые системы в сборе', icon: 'Workflow', color: 'text-indigo-500' },
    { value: 'track_light', label: 'Трековые светильники', icon: 'Minus', color: 'text-indigo-600' },
    { value: 'track_string', label: 'Струнные светильники', icon: 'Cable', color: 'text-violet-500' },
    { value: 'track_rail', label: 'Шинопроводы', icon: 'Ruler', color: 'text-purple-600' },
    { value: 'track_accessories', label: 'Комплектующие трековых', icon: 'Wrench', color: 'text-slate-500' },
    
    { value: 'electric_switch', label: 'Выключатели', icon: 'ToggleLeft', color: 'text-gray-600' },
    { value: 'electric_socket', label: 'Розетки', icon: 'Plug', color: 'text-red-600' },
    { value: 'electric_frame', label: 'Рамки', icon: 'Square', color: 'text-neutral-500' },
    { value: 'electric_thermostat', label: 'Терморегуляторы', icon: 'Thermometer', color: 'text-red-500' },
    { value: 'electric_kit', label: 'Комплекты электрики', icon: 'Package', color: 'text-orange-600' },
    { value: 'electric_stabilizer', label: 'Стабилизаторы', icon: 'Activity', color: 'text-green-600' },
    { value: 'electric_transformer', label: 'Трансформаторы', icon: 'Zap', color: 'text-yellow-600' },
    { value: 'electric_motion', label: 'Датчики движения', icon: 'Radar', color: 'text-blue-600' },
    { value: 'electric_extension', label: 'Удлинители и фильтры', icon: 'Cable', color: 'text-purple-600' },
    { value: 'electric_cord', label: 'Шнуры', icon: 'Cable', color: 'text-gray-500' },
    { value: 'electric_accessories', label: 'Комплектующие для ЭУИ', icon: 'Wrench', color: 'text-stone-600' },
    { value: 'electric_doorbell', label: 'Звонки', icon: 'Bell', color: 'text-amber-500' },
    { value: 'electric_dimmer', label: 'Диммеры', icon: 'SlidersHorizontal', color: 'text-indigo-500' },
    { value: 'electric_fan', label: 'Вентиляторы', icon: 'Fan', color: 'text-cyan-500' },
    
    { value: 'floor_lamp', label: 'Торшеры', icon: 'Lamp', color: 'text-indigo-600' },
    { value: 'table_lamp', label: 'Настольные лампы', icon: 'Lamp', color: 'text-emerald-600' },
  ];

  const categories = [
    { value: '', label: 'Всё', highlight: false },
    { value: 'chandelier', label: 'Люстры', highlight: false },
    { value: 'lights', label: 'Светильники', highlight: false },
    { value: 'lamps', label: 'Лампы', highlight: false },
    { value: 'sconce', label: 'Бра', highlight: false },
    { value: 'floor_lamp', label: 'Торшеры', highlight: false },
    { value: 'spots', label: 'Споты', highlight: false },
    { value: 'outdoor', label: 'Уличное', highlight: false },
    { value: 'track', label: 'Трековые', highlight: false },
    { value: 'electric', label: 'Электрика', highlight: true },
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

  useEffect(() => {
    const brandParam = searchParams.get('brand');
    if (brandParam && brands.length > 0 && brands.includes(brandParam)) {
      setSelectedBrands([brandParam]);
    }
  }, [products, brands, searchParams]);



  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({ limit: 200 });
      setProducts(data.products);
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
    const categoryMatch = selectedCategory === '' || 
      product.type === selectedCategory || 
      (selectedCategory === 'chandelier' && product.type.includes('chandelier')) ||
      (selectedCategory === 'lights' && product.type.startsWith('light_')) ||
      (selectedCategory === 'lamps' && product.type.startsWith('lamp_')) ||
      (selectedCategory === 'spots' && product.type.startsWith('spot_')) ||
      (selectedCategory === 'outdoor' && product.type.startsWith('outdoor_')) ||
      (selectedCategory === 'track' && product.type.startsWith('track_')) ||
      (selectedCategory === 'electric' && product.type.startsWith('electric_')) ||
      (selectedCategory === 'sconce' && product.type === 'sconce') ||
      (selectedCategory === 'floor_lamp' && product.type === 'floor_lamp');
    const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
    const remoteMatch = !hasRemote || product.hasRemote;
    const dimmableMatch = !isDimmable || product.isDimmable;
    const colorChangeMatch = !hasColorChange || product.hasColorChange;
    const styleMatch = selectedStyles.length === 0 || (product.style && selectedStyles.includes(product.style));
    const colorMatch = selectedColors.length === 0 || (product.color && selectedColors.includes(product.color));
    
    return searchMatch && brandMatch && typeMatch && categoryMatch && priceMatch && remoteMatch && dimmableMatch && colorChangeMatch && styleMatch && colorMatch;
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
      toast({
        title: 'Ошибка',
        description: 'Не удалось обработать изображение',
        variant: 'destructive',
      });
      setImageSearchLoading(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleFavorite = (id: number) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter((fav) => fav !== id)
      : [...favorites, id];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));

    toast({
      title: favorites.includes(id) ? 'Удалено из избранного' : 'Добавлено в избранное',
      description: favorites.includes(id) ? '' : 'Товар добавлен в избранное',
    });
  };



  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    toast({
      title: 'Выход выполнен',
      description: 'Вы успешно вышли из аккаунта',
    });
  };

  const handleResetFilters = () => {
    setSelectedBrands([]);
    setSelectedTypes([]);
    setPriceRange([0, 150000]);
    setHasRemote(false);
    setIsDimmable(false);
    setHasColorChange(false);
    setIsSale(false);
    setIsNew(false);
    setIsPickup(false);
    setSelectedStyles([]);
    setSelectedColors([]);
    setBrandSearch('');
    setStyleSearch('');
    setColorSearch('');
    setSizeRange({
      height: [0, 3000],
      length: [0, 3000],
      depth: [0, 3000],
      width: [0, 3000],
      diameter: [0, 3000],
      chainLength: [0, 3000],
    });
  };

  const handleResetAll = () => {
    setSearchQuery('');
    setSelectedCategory('');
    handleResetFilters();
    loadProducts();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartItemsCount={totalItems}
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

        <CategoryNavigation
          categories={categories}
          types={types}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          hoverCategory={hoverCategory}
          setHoverCategory={setHoverCategory}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
        />

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
            <CatalogFilters
              products={products}
              selectedBrands={selectedBrands}
              setSelectedBrands={setSelectedBrands}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              hasRemote={hasRemote}
              setHasRemote={setHasRemote}
              isDimmable={isDimmable}
              setIsDimmable={setIsDimmable}
              hasColorChange={hasColorChange}
              setHasColorChange={setHasColorChange}
              isSale={isSale}
              setIsSale={setIsSale}
              isNew={isNew}
              setIsNew={setIsNew}
              isPickup={isPickup}
              setIsPickup={setIsPickup}
              selectedStyles={selectedStyles}
              setSelectedStyles={setSelectedStyles}
              styleSearch={styleSearch}
              setStyleSearch={setStyleSearch}
              selectedColors={selectedColors}
              setSelectedColors={setSelectedColors}
              colorSearch={colorSearch}
              setColorSearch={setColorSearch}
              sizeRange={sizeRange}
              setSizeRange={setSizeRange}
              brandSearch={brandSearch}
              setBrandSearch={setBrandSearch}
              onResetFilters={handleResetFilters}
            />
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
                <CatalogFilters
                  products={products}
                  selectedBrands={selectedBrands}
                  setSelectedBrands={setSelectedBrands}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  hasRemote={hasRemote}
                  setHasRemote={setHasRemote}
                  isDimmable={isDimmable}
                  setIsDimmable={setIsDimmable}
                  hasColorChange={hasColorChange}
                  setHasColorChange={setHasColorChange}
                  isSale={isSale}
                  setIsSale={setIsSale}
                  isNew={isNew}
                  setIsNew={setIsNew}
                  isPickup={isPickup}
                  setIsPickup={setIsPickup}
                  selectedStyles={selectedStyles}
                  setSelectedStyles={setSelectedStyles}
                  styleSearch={styleSearch}
                  setStyleSearch={setStyleSearch}
                  selectedColors={selectedColors}
                  setSelectedColors={setSelectedColors}
                  colorSearch={colorSearch}
                  setColorSearch={setColorSearch}
                  sizeRange={sizeRange}
                  setSizeRange={setSizeRange}
                  brandSearch={brandSearch}
                  setBrandSearch={setBrandSearch}
                  onResetFilters={handleResetFilters}
                />
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
                  {(searchQuery || selectedBrands.length > 0 || selectedTypes.length > 0 || selectedCategory || priceRange[0] > 0 || priceRange[1] < 150000 || hasRemote || isDimmable || hasColorChange || isSale || isNew || isPickup || selectedStyles.length > 0 || selectedColors.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetAll}
                    >
                      <Icon name="RotateCcw" className="mr-2 h-4 w-4" />
                      Сбросить всё
                    </Button>
                  )}
                </div>

                <ProductGrid
                  products={filteredProducts}
                  types={types}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onAddToCart={addToCart}
                />
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
};

export default Catalog;