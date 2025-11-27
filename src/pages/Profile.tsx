import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { User } from '@/lib/api';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/catalog');
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/catalog');
  };

  const orders = [
    {
      id: '12345',
      date: '15 ноября 2024',
      status: 'delivered',
      total: 45900,
      items: [
        {
          name: 'Хрустальная люстра LuxCrystal Premium',
          quantity: 1,
          price: 45900,
          image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400',
        },
      ],
    },
    {
      id: '12344',
      date: '8 ноября 2024',
      status: 'shipped',
      total: 31800,
      items: [
        {
          name: 'Настольная лампа ModernLight Studio',
          quantity: 2,
          price: 15900,
          image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
        },
      ],
    },
    {
      id: '12343',
      date: '1 ноября 2024',
      status: 'processing',
      total: 67500,
      items: [
        {
          name: 'Торшер ClassicLux Floor',
          quantity: 1,
          price: 28900,
          image: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400',
        },
        {
          name: 'Бра DesignLight Wall',
          quantity: 2,
          price: 19300,
          image: 'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=400',
        },
      ],
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-600">Доставлен</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-600">В пути</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-600">Обрабатывается</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Личный кабинет</h1>
              <p className="text-muted-foreground">
                Управляйте заказами и настройками профиля
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <Icon name="LogOut" className="mr-2 h-4 w-4" />
              Выйти
            </Button>
          </div>

          <div className="grid md:grid-cols-[300px_1fr] gap-6">
            <aside>
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
                <TabsList className="mb-6">
                  <TabsTrigger value="orders">Мои заказы</TabsTrigger>
                  <TabsTrigger value="info">Личные данные</TabsTrigger>
                  <TabsTrigger value="settings">Настройки</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              Заказ №{order.id}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {order.date}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(order.status)}
                            <p className="text-lg font-bold text-primary mt-2">
                              {order.total.toLocaleString()} ₽
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex gap-4 p-3 border rounded-lg"
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm mb-1">
                                  {item.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {item.quantity} × {item.price.toLocaleString()} ₽
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  {(item.quantity * item.price).toLocaleString()} ₽
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" className="flex-1">
                            <Icon name="RotateCcw" className="mr-2 h-4 w-4" />
                            Повторить заказ
                          </Button>
                          <Button variant="outline" className="flex-1">
                            <Icon name="MessageCircle" className="mr-2 h-4 w-4" />
                            Поддержка
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {orders.length === 0 && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Icon
                          name="ShoppingBag"
                          className="h-16 w-16 text-muted-foreground mx-auto mb-4"
                        />
                        <p className="text-muted-foreground mb-4">
                          У вас пока нет заказов
                        </p>
                        <Button onClick={() => navigate('/catalog')}>
                          Перейти в каталог
                        </Button>
                      </CardContent>
                    </Card>
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
