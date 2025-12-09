import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { api, Product } from '@/lib/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart: addToCartContext, totalItems } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({ limit: 200 });
      const foundProduct = data.products.find(p => p.id === Number(id));
      if (foundProduct) {
        setProduct(foundProduct);
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        setIsFavorite(favorites.includes(foundProduct.id));
      } else {
        toast({
          title: 'Товар не найден',
          variant: 'destructive',
        });
        navigate('/catalog');
      }
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить товар',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!product) return;
    
    addToCartContext(product);
    
    toast({
      title: 'Товар добавлен в корзину',
      duration: 2000,
    });
  };

  const toggleFavorite = () => {
    if (!product) return;
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const newFavorites = isFavorite
      ? favorites.filter((id: number) => id !== product.id)
      : [...favorites, product.id];
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
    
    toast({
      title: isFavorite ? 'Удалено из избранного' : 'Добавлено в избранное',
      duration: 2000,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomPosition({ x, y });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header
          cartItemsCount={totalItems}
          onCartClick={() => navigate('/cart')}
          onAuthClick={() => {}}
        />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const images = product.images && product.images.length > 0 
    ? [product.image, ...product.images] 
    : [product.image, product.image, product.image];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <Header
        cartItemsCount={totalItems}
        onCartClick={() => navigate('/cart')}
        onAuthClick={() => {}}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 text-zinc-400 hover:text-zinc-100"
          onClick={() => navigate('/catalog')}
        >
          <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div
              ref={imageRef}
              className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 cursor-crosshair"
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-200"
                style={
                  isZooming
                    ? {
                        transform: 'scale(2)',
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      }
                    : {}
                }
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === idx
                      ? 'border-zinc-500'
                      : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-zinc-500 text-sm">{product.brand}</span>
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
              
              <h1 className="text-3xl font-bold mb-6 text-zinc-100">{product.name}</h1>
              
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
                <span className="text-zinc-400 text-sm">
                  {product.rating} ({product.reviews} отзывов)
                </span>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-6 mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-zinc-100">
                    {product.price.toLocaleString()} ₽
                  </span>
                </div>
                {product.price > 50000 && (
                  <p className="text-sm text-zinc-500">
                    Рассрочка от {Math.round(product.price / 12).toLocaleString()} ₽/мес
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={addToCart}
                disabled={!product.inStock}
              >
                <Icon name="ShoppingCart" className="mr-2 h-5 w-5" />
                Добавить в корзину
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-zinc-700 hover:bg-zinc-800"
                onClick={toggleFavorite}
              >
                <Icon
                  name={isFavorite ? "Heart" : "Heart"}
                  className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-zinc-400'}`}
                />
              </Button>
            </div>

            <Tabs defaultValue="specs" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-zinc-900 border-zinc-800">
                <TabsTrigger value="specs" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-zinc-100">
                  Характеристики
                </TabsTrigger>
                <TabsTrigger value="payment" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-zinc-100">
                  Оплата
                </TabsTrigger>
                <TabsTrigger value="delivery" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-zinc-100">
                  Доставка
                </TabsTrigger>
                <TabsTrigger value="return" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-zinc-100">
                  Возврат
                </TabsTrigger>
                <TabsTrigger value="warranty" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-zinc-100">
                  Гарантия
                </TabsTrigger>
              </TabsList>

              <TabsContent value="specs" className="space-y-6 mt-4">
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-zinc-100">Основные</h3>
                  <div className="grid gap-2">
                    <div className="flex justify-between py-2 border-b border-zinc-800">
                      <span className="text-zinc-400">Артикул</span>
                      <span className="font-medium text-zinc-100">{product.article || `#${product.id}`}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-zinc-800">
                      <span className="text-zinc-400">Бренд</span>
                      <span className="font-medium text-zinc-100">{product.brand}</span>
                    </div>
                    {product.brandCountry && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Страна бренда</span>
                        <span className="font-medium text-zinc-100">{product.brandCountry}</span>
                      </div>
                    )}
                    {product.manufacturerCountry && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Страна производства</span>
                        <span className="font-medium text-zinc-100">{product.manufacturerCountry}</span>
                      </div>
                    )}
                    {product.collection && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Коллекция</span>
                        <span className="font-medium text-zinc-100">{product.collection}</span>
                      </div>
                    )}
                    {product.style && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Стиль</span>
                        <span className="font-medium text-zinc-100">{product.style}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3 text-zinc-100">Лампы</h3>
                  <div className="grid gap-2">
                    {product.lampType && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Тип лампы</span>
                        <span className="font-medium text-zinc-100">{product.lampType}</span>
                      </div>
                    )}
                    {product.socketType && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Тип цоколя</span>
                        <span className="font-medium text-zinc-100">{product.socketType}</span>
                      </div>
                    )}
                    {product.bulbType && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Тип лампочки (основной)</span>
                        <span className="font-medium text-zinc-100">{product.bulbType}</span>
                      </div>
                    )}
                    {product.lampCount && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Количество ламп</span>
                        <span className="font-medium text-zinc-100">{product.lampCount}</span>
                      </div>
                    )}
                    {product.lampPower && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Мощность лампы, W</span>
                        <span className="font-medium text-zinc-100">{product.lampPower}</span>
                      </div>
                    )}
                    {product.totalPower && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Общая мощность, W</span>
                        <span className="font-medium text-zinc-100">{product.totalPower}</span>
                      </div>
                    )}
                    {product.lightingArea && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Площадь освещения, м²</span>
                        <span className="font-medium text-zinc-100">{product.lightingArea}</span>
                      </div>
                    )}
                    {product.voltage && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Напряжение, V</span>
                        <span className="font-medium text-zinc-100">{product.voltage}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(product.color || product.materials || product.frameMaterial || product.shadeMaterial || product.frameColor || product.shadeColor) && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-zinc-100">Цвет и материал</h3>
                    <div className="grid gap-2">
                      {product.color && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Цвет</span>
                          <span className="font-medium text-zinc-100">{product.color}</span>
                        </div>
                      )}
                      {product.materials && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Материалы</span>
                          <span className="font-medium text-zinc-100">{product.materials}</span>
                        </div>
                      )}
                      {product.frameMaterial && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Материал каркаса</span>
                          <span className="font-medium text-zinc-100">{product.frameMaterial}</span>
                        </div>
                      )}
                      {product.shadeMaterial && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Материал плафона</span>
                          <span className="font-medium text-zinc-100">{product.shadeMaterial}</span>
                        </div>
                      )}
                      {product.frameColor && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Цвет каркаса</span>
                          <span className="font-medium text-zinc-100">{product.frameColor}</span>
                        </div>
                      )}
                      {product.shadeColor && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Цвет плафона</span>
                          <span className="font-medium text-zinc-100">{product.shadeColor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(product.height || product.diameter || product.length || product.width || product.depth || product.chainLength) && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-zinc-100">Размеры</h3>
                    <div className="grid gap-2">
                      {product.height && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Высота, мм</span>
                          <span className="font-medium text-zinc-100">{product.height}</span>
                        </div>
                      )}
                      {product.diameter && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Диаметр, мм</span>
                          <span className="font-medium text-zinc-100">{product.diameter}</span>
                        </div>
                      )}
                      {product.length && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Длина, мм</span>
                          <span className="font-medium text-zinc-100">{product.length}</span>
                        </div>
                      )}
                      {product.width && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Ширина, мм</span>
                          <span className="font-medium text-zinc-100">{product.width}</span>
                        </div>
                      )}
                      {product.depth && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Глубина, мм</span>
                          <span className="font-medium text-zinc-100">{product.depth}</span>
                        </div>
                      )}
                      {product.chainLength && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Длина цепи, мм</span>
                          <span className="font-medium text-zinc-100">{product.chainLength}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(product.shadeDirection || product.diffuserType || product.diffuserShape) && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-zinc-100">Характеристики плафона</h3>
                    <div className="grid gap-2">
                      {product.shadeDirection && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Направление плафонов</span>
                          <span className="font-medium text-zinc-100">{product.shadeDirection}</span>
                        </div>
                      )}
                      {product.diffuserType && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Тип рассеивателя</span>
                          <span className="font-medium text-zinc-100">{product.diffuserType}</span>
                        </div>
                      )}
                      {product.diffuserShape && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Форма рассеивателя</span>
                          <span className="font-medium text-zinc-100">{product.diffuserShape}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(product.ipRating || product.interior || product.place || product.mountType || product.suspendedCeiling) && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-zinc-100">Защита и размещение</h3>
                    <div className="grid gap-2">
                      {product.ipRating && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Степень защиты (IP)</span>
                          <span className="font-medium text-zinc-100">{product.ipRating}</span>
                        </div>
                      )}
                      {product.interior && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Интерьер</span>
                          <span className="font-medium text-zinc-100">{product.interior}</span>
                        </div>
                      )}
                      {product.place && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Место установки</span>
                          <span className="font-medium text-zinc-100">{product.place}</span>
                        </div>
                      )}
                      {product.mountType && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Тип крепления</span>
                          <span className="font-medium text-zinc-100">{product.mountType}</span>
                        </div>
                      )}
                      {product.suspendedCeiling !== undefined && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Натяжной потолок</span>
                          <span className="font-medium text-zinc-100">{product.suspendedCeiling ? 'Да' : 'Нет'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(product.section || product.catalog || product.subcategory) && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-zinc-100">Категоризация</h3>
                    <div className="grid gap-2">
                      {product.section && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Раздел</span>
                          <span className="font-medium text-zinc-100">{product.section}</span>
                        </div>
                      )}
                      {product.catalog && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Каталог</span>
                          <span className="font-medium text-zinc-100">{product.catalog}</span>
                        </div>
                      )}
                      {product.subcategory && (
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">Подкатегория</span>
                          <span className="font-medium text-zinc-100">{product.subcategory}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payment" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Icon name="CreditCard" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Оплата картой</p>
                      <p className="text-sm text-zinc-400">Принимаем Visa, MasterCard, МИР</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Wallet" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Наличными</p>
                      <p className="text-sm text-zinc-400">При получении товара курьеру или в магазине</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Building" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Рассрочка 0%</p>
                      <p className="text-sm text-zinc-400">До 12 месяцев без переплат</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="FileText" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Безналичный расчет</p>
                      <p className="text-sm text-zinc-400">Для юридических лиц с НДС</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="delivery" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Icon name="Truck" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Доставка по городу</p>
                      <p className="text-sm text-zinc-400">1-2 рабочих дня, от 500 ₽</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Package" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Самовывоз</p>
                      <p className="text-sm text-zinc-400">Бесплатно, готов к выдаче сегодня</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="MapPin" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Доставка по России</p>
                      <p className="text-sm text-zinc-400">3-7 рабочих дней, рассчитывается при оформлении</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Home" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Подъем на этаж</p>
                      <p className="text-sm text-zinc-400">Рассчитывается индивидуально</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="return" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Icon name="RotateCcw" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Возврат товара</p>
                      <p className="text-sm text-zinc-400">В течение 14 дней с момента покупки при сохранении товарного вида</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="RefreshCw" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Обмен товара</p>
                      <p className="text-sm text-zinc-400">Обмен на аналогичный или другой товар в течение 14 дней</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="CheckCircle" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Условия возврата</p>
                      <p className="text-sm text-zinc-400">Товар не был в использовании, сохранена упаковка и документы</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="DollarSign" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Возврат денег</p>
                      <p className="text-sm text-zinc-400">В течение 10 рабочих дней на карту или наличными</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="warranty" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Icon name="Shield" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Гарантия производителя</p>
                      <p className="text-sm text-zinc-400">{product.officialWarranty || '2 года на электронные компоненты'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Store" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Гарантия магазина</p>
                      <p className="text-sm text-zinc-400">{product.shopWarranty || '12 месяцев дополнительной гарантии'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Wrench" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Сервисное обслуживание</p>
                      <p className="text-sm text-zinc-400">Бесплатный ремонт в течение гарантийного срока</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="FileCheck" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-100">Документы</p>
                      <p className="text-sm text-zinc-400">Гарантийный талон и чек выдаются при покупке</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;