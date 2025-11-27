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
import { User, Product } from '@/lib/api';

interface CartItem extends Product {
  quantity: number;
}

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedUser = localStorage.getItem('user');
    
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const updateCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('cart', JSON.stringify(items));
  };

  const updateQuantity = (id: number, delta: number) => {
    const updated = cartItems.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    updateCart(updated);
  };

  const removeItem = (id: number) => {
    const updated = cartItems.filter(item => item.id !== id);
    updateCart(updated);
    toast({
      title: 'Товар удалён',
      description: 'Товар удалён из корзины',
    });
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setIsCheckout(true);
  };

  const handlePlaceOrder = () => {
    if (!deliveryAddress || !phone) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля доставки',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Заказ оформлен!',
      description: `Ваш заказ на сумму ${totalPrice.toLocaleString('ru-RU')} ₽ принят в обработку`,
    });

    localStorage.removeItem('cart');
    setCartItems([]);
    setTimeout(() => navigate('/'), 2000);
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
                            onClick={() => removeItem(item.id)}
                          >
                            <Icon name="Trash2" className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Icon name="Minus" className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, 1)}
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
                            <Icon name="Banknote" className="h-5 w-5" />
                            Наличными при получении
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                          <RadioGroupItem value="installment" id="installment" />
                          <Label htmlFor="installment" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Icon name="Calendar" className="h-5 w-5" />
                            Рассрочка 0-0-12
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div>
              <Card className="p-6 sticky top-20">
                <h2 className="text-xl font-bold mb-4">Итого</h2>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Товары ({cartItems.length})</span>
                    <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Доставка</span>
                    <span className="text-green-600">Бесплатно</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between text-lg font-bold mb-6">
                  <span>Всего:</span>
                  <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
                </div>

                {!isCheckout ? (
                  <Button className="w-full" size="lg" onClick={handleCheckout}>
                    Оформить заказ
                  </Button>
                ) : (
                  <>
                    <Button className="w-full mb-2" size="lg" onClick={handlePlaceOrder}>
                      Подтвердить заказ
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline" 
                      onClick={() => setIsCheckout(false)}
                    >
                      Назад к корзине
                    </Button>
                  </>
                )}

                {!isCheckout && (
                  <Button
                    variant="ghost"
                    className="w-full mt-2"
                    onClick={() => navigate('/catalog')}
                  >
                    Продолжить покупки
                  </Button>
                )}

                <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Icon name="Shield" className="h-4 w-4" />
                    <span>Безопасная оплата</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Truck" className="h-4 w-4" />
                    <span>Доставка 1-3 дня</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="RefreshCw" className="h-4 w-4" />
                    <span>Возврат 14 дней</span>
                  </div>
                </div>
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
