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
  rating?: number;
  reviews?: number;
}

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('list');

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

  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  const itemsPerPage = 20;

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      verifyToken(token);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'list') {
      setCurrentPage(1);
      loadProducts(1);
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'list') {
      loadProducts(currentPage);
    }
  }, [currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'list') {
      setCurrentPage(1);
      loadProducts(1);
    }
  }, [debouncedSearch]);

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

  const loadProducts = async (page = currentPage) => {
    setLoading(true);
    try {
      const url = new URL(ADMIN_PRODUCTS_URL);
      url.searchParams.append('limit', itemsPerPage.toString());
      url.searchParams.append('offset', ((page - 1) * itemsPerPage).toString());
      if (debouncedSearch) {
        url.searchParams.append('search', debouncedSearch);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url.toString(), { 
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products || []);
        setTotalProducts(data.total || 0);
        setInitialLoad(false);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to load products:', error);
        setMessage('Ошибка загрузки товаров');
      }
    } finally {
      setLoading(false);
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
          if (editingProduct) {
            setEditingProduct({ ...editingProduct, image_url: data.url });
          } else {
            setProduct({ ...product, image_url: data.url });
          }
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
        loadProducts();
      } else {
        setMessage(data.error || 'Ошибка добавления товара');
      }
    } catch (error) {
      setMessage('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(ADMIN_PRODUCTS_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingProduct)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Товар "${editingProduct.name}" успешно обновлён!`);
        setEditingProduct(null);
        loadProducts();
      } else {
        setMessage(data.error || 'Ошибка обновления товара');
      }
    } catch (error) {
      setMessage('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Вы уверены, что хотите снять товар с продажи?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${ADMIN_PRODUCTS_URL}?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Товар снят с продажи');
        loadProducts();
      } else {
        setMessage(data.error || 'Ошибка удаления товара');
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

        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'list' ? 'default' : 'outline'}
            onClick={() => setActiveTab('list')}
          >
            <Icon name="List" className="h-4 w-4 mr-2" />
            Список товаров
          </Button>
          <Button
            variant={activeTab === 'add' ? 'default' : 'outline'}
            onClick={() => setActiveTab('add')}
          >
            <Icon name="Plus" className="h-4 w-4 mr-2" />
            Добавить товар
          </Button>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-6 ${message.includes('Ошибка') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {activeTab === 'list' && (
          <Card>
            <CardContent className="pt-6">
              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Список товаров
                    {!initialLoad && (
                      <span className="ml-2 text-sm text-muted-foreground font-normal">
                        ({totalProducts} {totalProducts === 1 ? 'товар' : totalProducts < 5 ? 'товара' : 'товаров'})
                      </span>
                    )}
                  </h2>
                </div>
                <div className="relative">
                  <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Поиск товаров по названию, бренду..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Загрузка товаров...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="Package" className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">
                    {searchTerm ? 'Товары не найдены' : 'Нет товаров'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {products.map((prod) => (
                      <div key={prod.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        {prod.image_url && (
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            loading="lazy"
                            className="w-full h-32 object-cover rounded mb-3"
                          />
                        )}
                        <div className="space-y-2">
                          <h3 className="font-semibold text-sm line-clamp-2">{prod.name}</h3>
                          <p className="text-xs text-muted-foreground">{prod.brand} • {prod.type}</p>
                          <p className="text-lg font-bold text-primary">{prod.price} ₽</p>
                          <p className="text-xs">
                            {prod.in_stock ? (
                              <span className="text-green-600">В наличии</span>
                            ) : (
                              <span className="text-red-600">Нет в наличии</span>
                            )}
                          </p>
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingProduct(prod)}
                            >
                              <Icon name="Edit" className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => prod.id && handleDeleteProduct(prod.id)}
                            >
                              <Icon name="Trash2" className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalProducts > itemsPerPage && (
                    <div className="flex justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        <Icon name="ChevronLeft" className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-2 px-4">
                        <span className="text-sm">
                          Страница {currentPage} из {Math.ceil(totalProducts / itemsPerPage)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          (всего {totalProducts} товаров)
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= Math.ceil(totalProducts / itemsPerPage)}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        <Icon name="ChevronRight" className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'add' && (
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

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Сохранение...' : 'Добавить товар'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {editingProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Редактировать товар</h2>
                  <Button variant="ghost" size="sm" onClick={() => setEditingProduct(null)}>
                    <Icon name="X" className="h-5 w-5" />
                  </Button>
                </div>

                <form onSubmit={handleUpdateProduct} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Название *</label>
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border bg-background"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Артикул</label>
                      <input
                        type="text"
                        value={editingProduct.article}
                        onChange={(e) => setEditingProduct({ ...editingProduct, article: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border bg-background"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Описание</label>
                    <textarea
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border bg-background"
                      rows={4}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Цена (₽) *</label>
                      <input
                        type="number"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                        className="w-full px-4 py-2 rounded-lg border bg-background"
                        required
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Бренд</label>
                      <input
                        type="text"
                        value={editingProduct.brand}
                        onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border bg-background"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Категория *</label>
                      <select
                        value={editingProduct.type}
                        onChange={(e) => setEditingProduct({ ...editingProduct, type: e.target.value })}
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
                    {editingProduct.image_url && (
                      <div className="mt-4">
                        <img src={editingProduct.image_url} alt="Preview" className="h-32 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit_in_stock"
                      checked={editingProduct.in_stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, in_stock: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="edit_in_stock" className="text-sm font-medium">В наличии</label>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? 'Сохранение...' : 'Сохранить изменения'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                      Отмена
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminPanel;