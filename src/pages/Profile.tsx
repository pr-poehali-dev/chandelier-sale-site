import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { User, Product, Order, api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { totalItems } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/catalog');
      return;
    }
    const userData = JSON.parse(savedUser);
    setUser(userData);
    
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      const favIds = JSON.parse(savedFavorites);
      setFavorites(favIds);
      loadFavoriteProducts(favIds);
    } else {
      setLoadingFavorites(false);
    }
    
    loadOrders(userData.email);
  }, [navigate]);

  const loadFavoriteProducts = async (favIds: number[]) => {
    if (favIds.length === 0) {
      setLoadingFavorites(false);
      return;
    }
    
    try {
      const { products } = await api.getProducts({ limit: 200 });
      const favProducts = products.filter(p => favIds.includes(p.id));
      setFavoriteProducts(favProducts);
    } catch (error) {
      console.error('Failed to load favorites', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const loadOrders = async (email: string) => {
    setLoadingOrders(true);
    try {
      const data = await api.getOrders();
      const userOrders = data.orders.filter(order => order.customer_email === email);
      setOrders(userOrders);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const removeFavorite = (productId: number) => {
    const newFavorites = favorites.filter(id => id !== productId);
    setFavorites(newFavorites);
    setFavoriteProducts(favoriteProducts.filter(p => p.id !== productId));
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    
    toast({
      title: 'Удалено из избранного',
      duration: 2000,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/catalog');
  };

  const handlePayment = async (order: Order) => {
    try {
      const response = await fetch('https://functions.poehali.dev/eb9797fc-7fdb-4119-ab81-aee45041262d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: order.total_amount,
          user_name: order.customer_name,
          user_email: order.customer_email,
          order_id: order.id,
          cart_items: []
        })
      });
      
      const data = await response.json();
      
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать платёж',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка оплаты',
        description: 'Попробуйте позже',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Выполнен</Badge>;
      case 'processing':
        return <Badge className="bg-blue-600">В обработке</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600">Ожидает</Badge>;
      case 'awaiting_payment':
        return <Badge className="bg-orange-600">Ожидает оплаты</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Отменён</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        cartItemsCount={totalItems}
        onCartClick={() => navigate('/cart')}
        onAuthClick={() => {}}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold mb-2">Личный кабинет</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Управляйте заказами и настройками профиля
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
              <Icon name="LogOut" className="mr-2 h-4 w-4" />
              Выйти
            </Button>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            <aside className="hidden lg:block">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Icon name="User" className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start">
                      <Icon name="ShoppingBag" className="mr-2 h-4 w-4" />
                      Мои заказы
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <Icon name="Heart" className="mr-2 h-4 w-4" />
                      Избранное
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <Icon name="Settings" className="mr-2 h-4 w-4" />
                      Настройки
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardContent className="pt-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Icon name="Award" className="h-4 w-4 text-primary" />
                      <span>Бонусов: 1 250 ₽</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Percent" className="h-4 w-4 text-primary" />
                      <span>Скидка: 5%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="TrendingUp" className="h-4 w-4 text-primary" />
                      <span>Заказов: {orders.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>

            <div>
              <Tabs defaultValue="orders" className="w-full">
                <TabsList className="mb-6 w-full grid grid-cols-2 lg:grid-cols-4 gap-1">
                  <TabsTrigger value="orders" className="text-xs sm:text-sm">Заказы</TabsTrigger>
                  <TabsTrigger value="favorites" className="text-xs sm:text-sm">
                    Избранное
                    {favorites.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {favorites.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="info" className="text-xs sm:text-sm">Данные</TabsTrigger>
                  <TabsTrigger value="settings" className="text-xs sm:text-sm">Настройки</TabsTrigger>
                </TabsList>

                <TabsContent value="favorites">
                  {loadingFavorites ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Загрузка...</p>
                    </div>
                  ) : favoriteProducts.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Icon
                          name="Heart"
                          className="h-16 w-16 text-muted-foreground mx-auto mb-4"
                        />
                        <p className="text-muted-foreground mb-4">
                          У вас пока нет избранных товаров
                        </p>
                        <Button onClick={() => navigate('/catalog')}>
                          Перейти в каталог
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favoriteProducts.map((product) => (
                        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <CardHeader className="p-0 relative">
                            <div className="aspect-square overflow-hidden bg-muted cursor-pointer"
                              onClick={() => navigate('/catalog')}>
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
                              onClick={() => removeFavorite(product.id)}
                            >
                              <Icon 
                                name="Heart" 
                                className="h-5 w-5 fill-red-500 text-red-500"
                              />
                            </Button>
                          </CardHeader>
                          <CardContent className="p-4">
                            <Badge variant="secondary" className="mb-2">
                              {product.brand}
                            </Badge>
                            <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                              {product.name}
                            </h3>
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
                              onClick={() => navigate('/catalog')}
                              disabled={!product.inStock}
                            >
                              <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
                              В корзину
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="orders" className="space-y-4">
                  {loadingOrders ? (
                    <div className="text-center py-12">
                      <Icon name="Loader2" className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Загрузка заказов...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Icon name="ShoppingBag" className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">У вас пока нет заказов</h3>
                        <p className="text-muted-foreground mb-6">
                          Начните покупки в нашем каталоге
                        </p>
                        <Button onClick={() => navigate('/catalog')}>
                          Перейти в каталог
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    orders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <CardTitle className="text-base sm:text-lg">
                              Заказ №{order.id}
                            </CardTitle>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              {new Date(order.created_at).toLocaleString('ru-RU')}
                            </p>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                            {getStatusBadge(order.status)}
                            <p className="text-base sm:text-lg font-bold text-primary">
                              {order.total_amount.toLocaleString()} ₽
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {order.items && order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex gap-2 sm:gap-4 p-2 sm:p-3 border rounded-lg"
                            >
                              {item.product_image && (
                                <img
                                  src={item.product_image}
                                  alt={item.product_name}
                                  className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-xs sm:text-sm mb-1 line-clamp-2">
                                  {item.product_name}
                                </h4>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {item.quantity} × {item.price.toLocaleString()} ₽
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-sm sm:text-base">
                                  {(item.quantity * item.price).toLocaleString()} ₽
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {order.tracking_number && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon name="Package" className="h-4 w-4 text-primary" />
                              <span className="text-xs sm:text-sm font-medium">Трек-номер:</span>
                            </div>
                            <p className="text-xs sm:text-sm font-mono bg-background px-2 sm:px-3 py-2 rounded border break-all">
                              {order.tracking_number}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2 mt-4">
                          {order.status === 'awaiting_payment' && (
                            <Button 
                              onClick={() => handlePayment(order)}
                              className="flex-1"
                            >
                              <Icon name="CreditCard" className="mr-2 h-4 w-4" />
                              Оплатить
                            </Button>
                          )}
                          <Button variant="outline" className="flex-1">
                            <Icon name="RotateCcw" className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Повторить заказ</span>
                            <span className="sm:hidden">Повторить</span>
                          </Button>
                          <Button variant="outline" className="flex-1">
                            <Icon name="MessageCircle" className="mr-2 h-4 w-4" />
                            Поддержка
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                  )}
                </TabsContent>

                <TabsContent value="info">
                  <Card>
                    <CardHeader>
                      <CardTitle>Личные данные</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Имя
                          </label>
                          <input
                            type="text"
                            defaultValue={user.first_name}
                            className="w-full px-4 py-2 rounded-lg border bg-background"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Фамилия
                          </label>
                          <input
                            type="text"
                            defaultValue={user.last_name}
                            className="w-full px-4 py-2 rounded-lg border bg-background"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Email
                        </label>
                        <input
                          type="email"
                          defaultValue={user.email}
                          className="w-full px-4 py-2 rounded-lg border bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Телефон
                        </label>
                        <input
                          type="tel"
                          placeholder="+7 (___) ___-__-__"
                          className="w-full px-4 py-2 rounded-lg border bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Адрес доставки
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Введите адрес..."
                          className="w-full px-4 py-2 rounded-lg border bg-background"
                        />
                      </div>
                      <Button>
                        <Icon name="Save" className="mr-2 h-4 w-4" />
                        Сохранить изменения
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Настройки уведомлений</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email уведомления</p>
                          <p className="text-sm text-muted-foreground">
                            Получать новости и акции на почту
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Включено
                        </Button>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Уведомления о заказах</p>
                          <p className="text-sm text-muted-foreground">
                            Статус и отслеживание доставки
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Включено
                        </Button>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">SMS уведомления</p>
                          <p className="text-sm text-muted-foreground">
                            Получать SMS о статусе заказа
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Выключено
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-destructive">Опасная зона</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button variant="destructive" className="w-full">
                        <Icon name="Trash2" className="mr-2 h-4 w-4" />
                        Удалить аккаунт
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;