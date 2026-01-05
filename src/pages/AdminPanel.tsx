import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ADMIN_AUTH_URL = 'https://functions.poehali.dev/44942252-4c42-4971-9ae8-c9e43de1ca10';
const ADMIN_PRODUCTS_URL = 'https://functions.poehali.dev/722ef0fd-ab85-4438-b34d-464a0b50d4d7';
const UPLOAD_IMAGE_URL = 'https://functions.poehali.dev/e3579ac7-cd2e-4676-b1ff-8833a602ad6f';

interface Admin {
  id: number;
  email: string;
  name: string;
}

interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  brand: string;
  type: string;
  image_url: string;
  in_stock: boolean;
  article: string;
}

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [product, setProduct] = useState<Product>({
    name: '',
    description: '',
    price: 0,
    brand: '',
    type: 'люстра',
    image_url: '',
    in_stock: true,
    article: ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(ADMIN_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'verify' })
      });

      const data = await response.json();
      if (data.valid) {
        setIsAuthenticated(true);
        setAdmin(data.admin);
      } else {
        localStorage.removeItem('admin_token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('admin_token');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const action = showLogin ? 'login' : 'register';
      const body = showLogin 
        ? { action, email, password }
        : { action, email, password, name };

      const response = await fetch(ADMIN_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin_token', data.token);
        setIsAuthenticated(true);
        setAdmin(data.admin);
        setMessage(showLogin ? 'Успешный вход!' : 'Регистрация успешна!');
      } else {
        setMessage(data.error || 'Ошибка авторизации');
      }
    } catch (error) {
      setMessage('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        const response = await fetch(UPLOAD_IMAGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64,
            filename: file.name,
            folder: 'products'
          })
        });

        const data = await response.json();
        if (response.ok) {
          setProduct({ ...product, image_url: data.url });
          setMessage('Изображение загружено!');
        } else {
          setMessage(data.error || 'Ошибка загрузки изображения');
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setMessage('Ошибка загрузки изображения');
      setLoading(false);
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(ADMIN_PRODUCTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(product)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Товар "${product.name}" успешно добавлен!`);
        setProduct({
          name: '',
          description: '',
          price: 0,
          brand: '',
          type: 'люстра',
          image_url: '',
          in_stock: true,
          article: ''
        });
        setImageFile(null);
      } else {
        setMessage(data.error || 'Ошибка добавления товара');
      }
    } catch (error) {
      setMessage('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setAdmin(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6">
                <Icon name="Lock" className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">
                  {showLogin ? 'Вход для администраторов' : 'Регистрация администратора'}
                </h1>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {!showLogin && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Имя</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border bg-background"
                      required={!showLogin}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Пароль</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                    required
                    minLength={6}
                  />
                </div>

                {message && (
                  <div className={`p-3 rounded-lg ${message.includes('Ошибка') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Загрузка...' : (showLogin ? 'Войти' : 'Зарегистрироваться')}
                </Button>

                <button
                  type="button"
                  onClick={() => setShowLogin(!showLogin)}
                  className="w-full text-sm text-primary hover:underline"
                >
                  {showLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                </button>
              </form>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Админ-панель</h1>
            <p className="text-muted-foreground">Добро пожаловать, {admin?.name}!</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <Icon name="LogOut" className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-6">Добавить новый товар</h2>

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Название *</label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Артикул</label>
                  <input
                    type="text"
                    value={product.article}
                    onChange={(e) => setProduct({ ...product, article: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Описание</label>
                <textarea
                  value={product.description}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border bg-background"
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Цена (₽) *</label>
                  <input
                    type="number"
                    value={product.price}
                    onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Бренд</label>
                  <input
                    type="text"
                    value={product.brand}
                    onChange={(e) => setProduct({ ...product, brand: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Категория *</label>
                  <select
                    value={product.type}
                    onChange={(e) => setProduct({ ...product, type: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                    required
                  >
                    <option value="люстра">Люстры</option>
                    <option value="бра">Бра</option>
                    <option value="торшер">Торшеры</option>
                    <option value="настольная лампа">Настольные лампы</option>
                    <option value="точечный светильник">Точечные светильники</option>
                    <option value="уличное освещение">Уличное освещение</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Изображение</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 rounded-lg border bg-background"
                />
                {product.image_url && (
                  <div className="mt-4">
                    <img src={product.image_url} alt="Preview" className="h-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="in_stock"
                  checked={product.in_stock}
                  onChange={(e) => setProduct({ ...product, in_stock: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="in_stock" className="text-sm font-medium">В наличии</label>
              </div>

              {message && (
                <div className={`p-3 rounded-lg ${message.includes('Ошибка') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Сохранение...' : 'Добавить товар'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default AdminPanel;
