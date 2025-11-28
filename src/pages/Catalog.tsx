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
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api, Product, User } from '@/lib/api';

const Catalog = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
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
  const [sizeRange, setSizeRange] = useState({
    height: [0, 3000],
    length: [0, 3000],
    depth: [0, 3000],
    width: [0, 3000],
    diameter: [0, 3000],
    chainLength: [0, 3000],
  });
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const brands = ['LuxCrystal', 'ModernLight', 'OfficeLight', 'DesignLight', 'EuroLux', 'ArtLight', 'SmartLight', 'ClassicLux'];
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
    { value: 'electric_breaker', label: 'Автоматические выключатели', icon: 'Power', color: 'text-red-700' },
    { value: 'electric_ammeter', label: 'Амперметры', icon: 'Gauge', color: 'text-teal-600' },
    { value: 'electric_video_doorbell', label: 'Видеозвонки', icon: 'Video', color: 'text-blue-700' },
    
    { value: 'floor_lamp', label: 'Торшеры', icon: 'FlashlightOff', color: 'text-green-500' },
  ];
  
  const styles = [
    'Американский', 'Арт-деко', 'Винтажный', 'Восточный', 'Джапанди', 
    'Дизайнерские', 'Замковые', 'Индустриальный', 'Кантри', 'Классика', 
    'Кристалл', 'Лофт', 'Мегаполис', 'Минимализм', 'Модерн', 'Морской', 
    'Неоклассика', 'Прованс', 'Ретро', 'Скандинавский', 'Современный', 
    'Техно', 'Тиффани', 'Флора', 'Флористика', 'Хай-тек', 'Хрусталь', 
    'ЭКО', 'Элеганс', 'Этнический', 'Японский'
  ];
  
  const categories = [
    { value: '', label: 'Все товары' },
    { value: 'chandelier', label: 'Люстры' },
    { value: 'lights', label: 'Светильники' },
    { value: 'lamps', label: 'Настольные лампы' },
    { value: 'sconce', label: 'Бра' },
    { value: 'spots', label: 'Споты' },
    { value: 'outdoor', label: 'Уличное освещение' },
    { value: 'track', label: 'Трековые системы' },
    { value: 'electric', label: 'Электротовары' },
    { value: 'floor_lamp', label: 'Торшеры' },
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

  const FilterSidebar = () => {
    const filteredStyles = styles.filter(style => 
      style.toLowerCase().includes(styleSearch.toLowerCase())
    );
    
    const currentCategoryTypes = selectedCategory ? types.filter((type) => {
      if (selectedCategory === 'chandelier') return type.value.includes('chandelier') || type.value === 'chandelier' || type.value === 'cascade' || type.value === 'rod' || type.value === 'large';
      if (selectedCategory === 'lights') return type.value.startsWith('light_');
      if (selectedCategory === 'lamps') return type.value.startsWith('lamp_');
      if (selectedCategory === 'sconce') return type.value === 'sconce';
      if (selectedCategory === 'spots') return type.value.startsWith('spot_');
      if (selectedCategory === 'outdoor') return type.value.startsWith('outdoor_');
      if (selectedCategory === 'track') return type.value.startsWith('track_');
      if (selectedCategory === 'electric') return type.value.startsWith('electric_');
      if (selectedCategory === 'floor_lamp') return type.value === 'floor_lamp';
      return false;
    }) : [];

    return (
    <div className="space-y-6">
      {selectedCategory && currentCategoryTypes.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">Виды</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {currentCategoryTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`sidebar-type-${type.value}`}
                  checked={selectedTypes.includes(type.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTypes([...selectedTypes, type.value]);
                    } else {
                      setSelectedTypes(selectedTypes.filter((t) => t !== type.value));
                    }
                  }}
                />
                <Label htmlFor={`sidebar-type-${type.value}`} className="cursor-pointer text-sm flex items-center gap-2">
                  <Icon name={type.icon as any} className={`h-3 w-3 ${type.color}`} />
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
      
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
        <h3 className="font-semibold mb-4">Специальные предложения</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-sale"
              checked={isSale}
              onCheckedChange={(checked) => setIsSale(!!checked)}
            />
            <Label htmlFor="is-sale" className="cursor-pointer flex items-center gap-2">
              <Icon name="Percent" className="h-4 w-4 text-red-500" />
              Распродажа
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-new"
              checked={isNew}
              onCheckedChange={(checked) => setIsNew(!!checked)}
            />
            <Label htmlFor="is-new" className="cursor-pointer flex items-center gap-2">
              <Icon name="Sparkles" className="h-4 w-4 text-yellow-500" />
              Новинка
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-pickup"
              checked={isPickup}
              onCheckedChange={(checked) => setIsPickup(!!checked)}
            />
            <Label htmlFor="is-pickup" className="cursor-pointer flex items-center gap-2">
              <Icon name="Store" className="h-4 w-4 text-blue-500" />
              Забрать из магазина
            </Label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Размеры (мм)</h3>
        <div className="space-y-3 text-sm">
          {[
            { key: 'height', label: 'Высота', icon: 'ArrowUp' },
            { key: 'length', label: 'Длина', icon: 'ArrowRight' },
            { key: 'width', label: 'Ширина', icon: 'ArrowLeftRight' },
            { key: 'depth', label: 'Глубина', icon: 'BoxSelect' },
            { key: 'diameter', label: 'Диаметр', icon: 'Circle' },
            { key: 'chainLength', label: 'Длина цепи', icon: 'Link' },
          ].map(({ key, label, icon }) => (
            <div key={key}>
              <Label className="text-xs flex items-center gap-1 mb-1">
                <Icon name={icon as any} className="h-3 w-3" />
                {label}
              </Label>
              <Slider
                value={sizeRange[key as keyof typeof sizeRange]}
                onValueChange={(value) => setSizeRange({ ...sizeRange, [key]: value })}
                max={3000}
                step={50}
                className="mb-1"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{sizeRange[key as keyof typeof sizeRange][0]}</span>
                <span>{sizeRange[key as keyof typeof sizeRange][1]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Стиль</h3>
        <Input
          type="text"
          placeholder="Поиск стиля..."
          value={styleSearch}
          onChange={(e) => setStyleSearch(e.target.value)}
          className="mb-3"
        />
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredStyles.map((style) => (
            <div key={style} className="flex items-center space-x-2">
              <Checkbox
                id={`style-${style}`}
                checked={selectedStyles.includes(style)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedStyles([...selectedStyles, style]);
                  } else {
                    setSelectedStyles(selectedStyles.filter((s) => s !== style));
                  }
                }}
              />
              <Label htmlFor={`style-${style}`} className="cursor-pointer text-sm">
                {style}
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
          setHasRemote(false);
          setIsDimmable(false);
          setHasColorChange(false);
          setIsSale(false);
          setIsNew(false);
          setIsPickup(false);
          setSelectedStyles([]);
          setSizeRange({
            height: [0, 3000],
            length: [0, 3000],
            depth: [0, 3000],
            width: [0, 3000],
            diameter: [0, 3000],
            chainLength: [0, 3000],
          });
        }}
      >
        Сбросить фильтры
      </Button>
    </div>
  )};
  

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

        <div className="mb-8 border-b relative">
          <div className="flex gap-1 overflow-x-auto pb-px scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.value}
                ref={(el) => categoryRefs.current[category.value] = el}
                onMouseEnter={() => category.value && setHoverCategory(category.value)}
                onMouseLeave={() => setHoverCategory('')}
                onClick={() => {
                  setSelectedCategory(selectedCategory === category.value ? '' : category.value);
                  setHoverCategory('');
                }}
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
          
          {hoverCategory && hoverCategory !== '' && (
            <div 
              className="absolute top-full left-0 mt-2 z-40 bg-background border rounded-lg shadow-xl p-4 animate-in fade-in slide-in-from-top-2 min-w-[320px] max-w-[600px]"
              style={{
                left: categoryRefs.current[hoverCategory]?.offsetLeft || 0
              }}
              onMouseEnter={() => setHoverCategory(hoverCategory)}
              onMouseLeave={() => setHoverCategory('')}
            >
              <h3 className="font-semibold text-sm mb-3 text-foreground">Виды</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[400px] overflow-y-auto scrollbar-thin pr-2">
              {types
                .filter((type) => {
                  if (hoverCategory === 'chandelier') return type.value.includes('chandelier') || type.value === 'chandelier' || type.value === 'cascade' || type.value === 'rod' || type.value === 'large';
                  if (hoverCategory === 'lights') return type.value.startsWith('light_');
                  if (hoverCategory === 'lamps') return type.value.startsWith('lamp_');
                  if (hoverCategory === 'sconce') return type.value === 'sconce';
                  if (hoverCategory === 'spots') return type.value.startsWith('spot_');
                  if (hoverCategory === 'outdoor') return type.value.startsWith('outdoor_');
                  if (hoverCategory === 'track') return type.value.startsWith('track_');
                  if (hoverCategory === 'electric') return type.value.startsWith('electric_');
                  if (hoverCategory === 'floor_lamp') return type.value === 'floor_lamp';
                  return false;
                })
                .map((type) => {
                  const isSelected = selectedTypes.includes(type.value);
                  return (
                    <button
                      key={type.value}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTypes(selectedTypes.filter((t) => t !== type.value));
                        } else {
                          setSelectedTypes([...selectedTypes, type.value]);
                        }
                        setSelectedCategory(hoverCategory);
                        setHoverCategory('');
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'hover:bg-accent border border-transparent hover:border-border'
                      }`}
                    >
                      <Icon name={type.icon as any} className={`h-4 w-4 ${isSelected ? '' : type.color}`} />
                      {type.label}
                    </button>
                  );
                })}
            </div>
          </div>
          )}
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
                  {(searchQuery || selectedBrands.length > 0 || selectedTypes.length > 0 || selectedCategory || priceRange[0] > 0 || priceRange[1] < 150000 || hasRemote || isDimmable || hasColorChange || isSale || isNew || isPickup || selectedStyles.length > 0) && (
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
                        setIsSale(false);
                        setIsNew(false);
                        setIsPickup(false);
                        setSelectedStyles([]);
                        setSizeRange({
                          height: [0, 3000],
                          length: [0, 3000],
                          depth: [0, 3000],
                          width: [0, 3000],
                          diameter: [0, 3000],
                          chainLength: [0, 3000],
                        });
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

      <Footer />
    </div>
  );
};

export default Catalog;