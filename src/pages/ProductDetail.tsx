import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api, Product } from '@/lib/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProduct();
    updateCartCount();
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

  const updateCartCount = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      setCartCount(cart.length);
    }
  };

  const addToCart = () => {
    if (!product) return;
    
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
          cartItemsCount={cartCount}
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
    <div className="min-h-screen flex flex-col">
      <Header
        cartItemsCount={cartCount}
        onCartClick={() => navigate('/cart')}
        onAuthClick={() => {}}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/catalog')}
        >
          <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
          Назад к каталогу
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div
              ref={imageRef}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-crosshair"
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
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === idx
                      ? 'border-primary'
                      : 'border-transparent hover:border-muted-foreground/30'
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
              <Badge variant="secondary" className="mb-2">
                {product.brand}
              </Badge>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Icon
                      key={i}
                      name="Star"
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {product.rating} ({product.reviews} отзывов)
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-primary">
                  {product.price.toLocaleString()} ₽
                </span>
              </div>

              {product.inStock ? (
                <Badge variant="default" className="bg-green-500">
                  <Icon name="Check" className="mr-1 h-3 w-3" />
                  В наличии
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <Icon name="X" className="mr-1 h-3 w-3" />
                  Нет в наличии
                </Badge>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={addToCart}
                disabled={!product.inStock}
              >
                <Icon name="ShoppingCart" className="mr-2 h-5 w-5" />
                Добавить в корзину
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={toggleFavorite}
              >
                <Icon
                  name={isFavorite ? "Heart" : "Heart"}
                  className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                />
              </Button>
            </div>

            <Tabs defaultValue="specs" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="specs">
                  Технические характеристики
                </TabsTrigger>
                <TabsTrigger value="payment">
                  Оплата
                </TabsTrigger>
                <TabsTrigger value="delivery">
                  Доставка
                </TabsTrigger>
                <TabsTrigger value="return">
                  Обмен и возврат
                </TabsTrigger>
                <TabsTrigger value="warranty">
                  Гарантия
                </TabsTrigger>
              </TabsList>

              <TabsContent value="specs" className="space-y-6 mt-4">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Основные</h3>
                  <div className="grid gap-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Артикул</span>
                      <span className="font-medium">{product.article || `#${product.id}`}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Бренд</span>
                      <span className="font-medium">{product.brand}</span>
                    </div>
                    {product.brandCountry && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Страна бренда</span>
                        <span className="font-medium">{product.brandCountry}</span>
                      </div>
                    )}
                    {product.manufacturerCountry && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Страна производства</span>
                        <span className="font-medium">{product.manufacturerCountry}</span>
                      </div>
                    )}
                    {product.collection && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Коллекция</span>
                        <span className="font-medium">{product.collection}</span>
                      </div>
                    )}
                    {product.style && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Стиль</span>
                        <span className="font-medium">{product.style}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Лампы</h3>
                  <div className="grid gap-2">
                    {product.socketType && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Тип цоколя</span>
                        <span className="font-medium">{product.socketType}</span>
                      </div>
                    )}
                    {product.bulbType && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Тип лампочки (основной)</span>
                        <span className="font-medium">{product.bulbType}</span>
                      </div>
                    )}
                    {product.lampCount && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Количество ламп</span>
                        <span className="font-medium">{product.lampCount}</span>
                      </div>
                    )}
                    {product.lampPower && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Мощность лампы, W</span>
                        <span className="font-medium">{product.lampPower}</span>
                      </div>
                    )}
                    {product.totalPower && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Общая мощность, W</span>
                        <span className="font-medium">{product.totalPower}</span>
                      </div>
                    )}
                    {product.lightingArea && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Площадь освещения, м²</span>
                        <span className="font-medium">{product.lightingArea}</span>
                      </div>
                    )}
                    {product.voltage && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Напряжение, V</span>
                        <span className="font-medium">{product.voltage}</span>
                      </div>
                    )}
                  </div>
                </div>

                {product.color && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Цвет и материал</h3>
                    <div className="grid gap-2">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Цвет</span>
                        <span className="font-medium">{product.color}</span>
                      </div>
                    </div>
                  </div>
                )}

                {(product.height || product.diameter || product.length || product.width) && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Размеры</h3>
                    <div className="grid gap-2">
                      {product.height && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Высота, мм</span>
                          <span className="font-medium">{product.height}</span>
                        </div>
                      )}
                      {product.diameter && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Диаметр, мм</span>
                          <span className="font-medium">{product.diameter}</span>
                        </div>
                      )}
                      {product.length && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Длина, мм</span>
                          <span className="font-medium">{product.length}</span>
                        </div>
                      )}
                      {product.width && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Ширина, мм</span>
                          <span className="font-medium">{product.width}</span>
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
                      <p className="font-medium">Оплата картой</p>
                      <p className="text-sm text-muted-foreground">Принимаем Visa, MasterCard, МИР</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Wallet" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Наличными</p>
                      <p className="text-sm text-muted-foreground">При получении товара курьеру или в магазине</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Building" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Рассрочка 0%</p>
                      <p className="text-sm text-muted-foreground">До 12 месяцев без переплат</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="FileText" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Безналичный расчет</p>
                      <p className="text-sm text-muted-foreground">Для юридических лиц с НДС</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="delivery" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Icon name="Truck" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Доставка по городу</p>
                      <p className="text-sm text-muted-foreground">1-2 рабочих дня, от 500 ₽</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Package" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Самовывоз</p>
                      <p className="text-sm text-muted-foreground">Бесплатно, готов к выдаче сегодня</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="MapPin" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Доставка по России</p>
                      <p className="text-sm text-muted-foreground">3-7 рабочих дней, рассчитывается при оформлении</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Home" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Подъем на этаж</p>
                      <p className="text-sm text-muted-foreground">Рассчитывается индивидуально</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="return" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Icon name="RotateCcw" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Возврат товара</p>
                      <p className="text-sm text-muted-foreground">В течение 14 дней с момента покупки при сохранении товарного вида</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="RefreshCw" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Обмен товара</p>
                      <p className="text-sm text-muted-foreground">Обмен на аналогичный или другой товар в течение 14 дней</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="CheckCircle" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Условия возврата</p>
                      <p className="text-sm text-muted-foreground">Товар не был в использовании, сохранена упаковка и документы</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="DollarSign" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Возврат денег</p>
                      <p className="text-sm text-muted-foreground">В течение 10 рабочих дней на карту или наличными</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="warranty" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Icon name="Shield" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Гарантия производителя</p>
                      <p className="text-sm text-muted-foreground">2 года на электронные компоненты</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Store" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Гарантия магазина</p>
                      <p className="text-sm text-muted-foreground">12 месяцев дополнительной гарантии</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Wrench" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Сервисное обслуживание</p>
                      <p className="text-sm text-muted-foreground">Бесплатный ремонт в течение гарантийного срока</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="FileCheck" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Документы</p>
                      <p className="text-sm text-muted-foreground">Гарантийный талон и чек выдаются при покупке</p>
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