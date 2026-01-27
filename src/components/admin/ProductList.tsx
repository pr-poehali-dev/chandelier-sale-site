import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

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

interface ProductListProps {
  adminProductsUrl: string;
  uploadImageUrl: string;
  isAuthenticated: boolean;
  activeTab: string;
}

const ProductList = ({ adminProductsUrl, uploadImageUrl, isAuthenticated, activeTab }: ProductListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const itemsPerPage = 20;

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

  const loadProducts = async (page = currentPage) => {
    setLoading(true);
    try {
      const url = new URL(adminProductsUrl);
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

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        const response = await fetch(uploadImageUrl, {
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

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${adminProductsUrl}/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingProduct)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Товар успешно обновлён!');
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
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${adminProductsUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessage('Товар успешно удалён!');
        loadProducts();
      } else {
        const data = await response.json();
        setMessage(data.error || 'Ошибка удаления товара');
      }
    } catch (error) {
      setMessage('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление товарами ({totalProducts})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Поиск по названию или артикулу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {message && (
          <div className={`mb-4 p-2 rounded ${message.includes('Ошибка') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {loading && initialLoad ? (
          <div className="text-center py-8">
            <Icon name="Loader2" className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-gray-600">Загрузка товаров...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Изображение</th>
                    <th className="text-left p-2">Название</th>
                    <th className="text-left p-2">Артикул</th>
                    <th className="text-left p-2">Цена</th>
                    <th className="text-left p-2">Бренд</th>
                    <th className="text-left p-2">Тип</th>
                    <th className="text-left p-2">Наличие</th>
                    <th className="text-left p-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => (
                    <tr key={prod.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{prod.id}</td>
                      <td className="p-2">
                        {prod.image_url && (
                          <img src={prod.image_url} alt={prod.name} className="w-16 h-16 object-cover rounded" />
                        )}
                      </td>
                      <td className="p-2">{prod.name}</td>
                      <td className="p-2">{prod.article}</td>
                      <td className="p-2">{prod.price.toLocaleString()} ₽</td>
                      <td className="p-2">{prod.brand}</td>
                      <td className="p-2">{prod.type}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${prod.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {prod.in_stock ? 'В наличии' : 'Нет в наличии'}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingProduct(prod)}
                          >
                            <Icon name="Pencil" className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(prod.id!)}
                          >
                            <Icon name="Trash2" className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  <Icon name="ChevronLeft" className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Страница {currentPage} из {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  <Icon name="ChevronRight" className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Редактировать товар</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Название товара</label>
                    <Input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Описание</label>
                    <Textarea
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Цена (₽)</label>
                      <Input
                        type="number"
                        value={editingProduct.price || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Артикул</label>
                      <Input
                        type="text"
                        value={editingProduct.article}
                        onChange={(e) => setEditingProduct({ ...editingProduct, article: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Бренд</label>
                      <Input
                        type="text"
                        value={editingProduct.brand}
                        onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Тип</label>
                      <select
                        value={editingProduct.type}
                        onChange={(e) => setEditingProduct({ ...editingProduct, type: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="люстра">Люстра</option>
                        <option value="светильник">Светильник</option>
                        <option value="бра">Бра</option>
                        <option value="торшер">Торшер</option>
                        <option value="настольная лампа">Настольная лампа</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Изображение</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mb-2"
                    />
                    {editingProduct.image_url && (
                      <img src={editingProduct.image_url} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />
                    )}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit_in_stock"
                      checked={editingProduct.in_stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, in_stock: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="edit_in_stock" className="text-sm font-medium">В наличии</label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? (
                        <>
                          <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                          Сохранение...
                        </>
                      ) : (
                        'Сохранить'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingProduct(null)}
                      disabled={loading}
                    >
                      Отмена
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductList;
