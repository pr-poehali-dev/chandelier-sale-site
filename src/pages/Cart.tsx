import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthDialog from '@/components/AuthDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { api, User } from '@/lib/api';

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items: cartItems, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleCheckout = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setIsCheckout(true);
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress || !phone) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля доставки',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо авторизоваться',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        customer_name: `${user.first_name} ${user.last_name || ''}`.trim(),
        customer_email: user.email,
        customer_phone: phone,
        customer_address: deliveryAddress,
        payment_method: paymentMethod,
        items: cartItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          product_image: item.image,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      const result = await api.createOrder(orderData);

      toast({
        title: 'Заказ оформлен!',
        description: `Ваш заказ №${result.order_id} на сумму ${result.total_amount.toLocaleString('ru-RU')} ₽ принят в обработку`,
      });

      clearCart();
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('Order error:', error);
      toast({
        title: 'Ошибка оформления заказа',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header cartItemsCount={0} onAuthClick={() => setShowAuth(true)} />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <Icon name="ShoppingCart" className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Корзина пуста</h2>
            <p className="text-muted-foreground mb-6">Добавьте товары из каталога</p>
            <Button onClick={() => navigate('/catalog')}>
              Перейти в каталог
            </Button>
          </div>
        </div>
        <AuthDialog
          open={showAuth}
          onOpenChange={setShowAuth}
          onAuthSuccess={(user) => setUser(user)}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        cartItemsCount={cartItems.length} 
        onCartClick={() => navigate('/cart')}
        onAuthClick={() => setShowAuth(true)} 
      />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            {isCheckout ? 'Оформление заказа' : 'Корзина'}
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {!isCheckout ? (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{item.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{item.brand}</p>
                          <p className="text-lg font-bold text-primary">
                            {item.price.toLocaleString('ru-RU')} ₽
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Icon name="Trash2" className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Icon name="Minus" className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Icon name="Plus" className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-6">Данные доставки</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Адрес доставки</Label>
                      <Input
                        id="address"
                        placeholder="Москва, ул. Примерная, д. 1, кв. 1"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Телефон</Label>
                      <Input
                        id="phone"
                        placeholder="+7 (999) 999-99-99"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    <Separator className="my-6" />

                    <div>
                      <Label className="text-lg font-semibold mb-4 block">Способ оплаты</Label>
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Icon name="CreditCard" className="h-5 w-5" />
                            Банковская карта
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                          <RadioGroupItem value="cash" id="cash" />
                          <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Icon name="Wallet" className="h-5 w-5" />
                            Наличные при получении
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div>
              <Card className="p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Итого</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Товары ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                    <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Доставка</span>
                    <span className="text-green-600">Бесплатно</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Итого</span>
                    <span className="text-primary">{totalPrice.toLocaleString('ru-RU')} ₽</span>
                  </div>
                </div>

                {!isCheckout ? (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCheckout}
                  >
                    Оформить заказ
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handlePlaceOrder}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                          Оформление...
                        </>
                      ) : (
                        'Подтвердить заказ'
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsCheckout(false)}
                      disabled={isSubmitting}
                    >
                      Назад к корзине
                    </Button>
                  </div>
                )}
              </Card>
            </div>
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

export default Cart;
