import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const BEST_DEALS_API = 'https://functions.poehali.dev/6a11bad0-b439-4e23-84f2-0008a31965f6';
const UPLOAD_IMAGE_URL = 'https://functions.poehali.dev/e3579ac7-cd2e-4676-b1ff-8833a602ad6f';

interface BestDealProduct {
  id?: number;
  name: string;
  description: string;
  price: number;
  discountPrice: number;
  brand: string;
  imageUrl: string;
  images: string[];
  inStock: boolean;
}

const BestDealsManager = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<BestDealProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BestDealProduct | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState<BestDealProduct>({
    name: '',
    description: '',
    price: 0,
    discountPrice: 0,
    brand: '',
    imageUrl: '',
    images: [],
    inStock: true,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(BEST_DEALS_API);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить товары',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, isEdit: boolean = false) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(UPLOAD_IMAGE_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Ошибка загрузки');
      const data = await response.json();

      if (isEdit && editingProduct) {
        setEditingProduct({
          ...editingProduct,
          imageUrl: data.url,
          images: [data.url],
        });
      } else {
        setNewProduct({
          ...newProduct,
          imageUrl: data.url,
          images: [data.url],
        });
      }

      toast({
        title: 'Успешно',
        description: 'Изображение загружено',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить изображение',
        variant: 'destructive',
      });
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(BEST_DEALS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) throw new Error('Ошибка добавления');

      toast({
        title: 'Успешно',
        description: 'Товар добавлен',
      });

      setNewProduct({
        name: '',
        description: '',
        price: 0,
        discountPrice: 0,
        brand: '',
        imageUrl: '',
        images: [],
        inStock: true,
      });
      setShowAddForm(false);
      loadProducts();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить товар',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setLoading(true);
    try {
      const response = await fetch(BEST_DEALS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      });

      if (!response.ok) throw new Error('Ошибка обновления');

      toast({
        title: 'Успешно',
        description: 'Товар обновлен',
      });

      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить товар',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Удалить товар?')) return;

    try {
      const response = await fetch(`${BEST_DEALS_API}?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Ошибка удаления');

      toast({
        title: 'Успешно',
        description: 'Товар удален',
      });

      loadProducts();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить товар',
        variant: 'destructive',
      });
    }
  };

  const calculateDiscount = (price: number, discountPrice: number) => {
    if (!discountPrice || discountPrice >= price) return 0;
    return Math.round((1 - discountPrice / price) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Управление выгодными предложениями</h2>
          <a 
            href="/best-deals" 
            target="_blank"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
          >
            <Icon name="ExternalLink" className="h-3 w-3" />
            Открыть страницу "Товары по выгодным ценам"
          </a>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Icon name={showAddForm ? 'X' : 'Plus'} className="h-4 w-4 mr-2" />
          {showAddForm ? 'Отмена' : 'Добавить товар'}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Название *</label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Бренд</label>
                  <Input
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Описание</label>
                <Textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Обычная цена *</label>
                  <Input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Цена со скидкой</label>
                  <Input
                    type="number"
                    value={newProduct.discountPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, discountPrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Скидка</label>
                  <div className="px-4 py-2 rounded-lg border bg-muted">
                    {calculateDiscount(newProduct.price, newProduct.discountPrice)}%
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Изображение</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                />
                {newProduct.imageUrl && (
                  <div className="mt-4">
                    <img src={newProduct.imageUrl} alt="Preview" className="h-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={newProduct.inStock}
                  onChange={(e) => setNewProduct({ ...newProduct, inStock: e.target.checked })}
                />
                <label htmlFor="inStock" className="text-sm font-medium">В наличии</label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Добавление...' : 'Добавить товар'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Текущие товары ({products.length})</h3>

          {loading && !products.length ? (
            <div className="text-center py-8">
              <Icon name="Loader2" className="h-8 w-8 animate-spin mx-auto" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Товаров пока нет
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50">
                  <div className="w-24 h-24 flex-shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                        <Icon name="Image" className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold">{product.name}</h4>
                    {product.brand && <p className="text-sm text-muted-foreground">{product.brand}</p>}
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-lg font-bold text-red-500">
                        {product.discountPrice?.toLocaleString('ru-RU')} ₽
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {product.price?.toLocaleString('ru-RU')} ₽
                      </span>
                      <span className="text-sm font-medium text-red-500">
                        -{calculateDiscount(product.price, product.discountPrice)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Icon name="Edit" className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => product.id && handleDeleteProduct(product.id)}
                    >
                      <Icon name="Trash" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                    <Input
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Бренд</label>
                    <Input
                      value={editingProduct.brand}
                      onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Описание</label>
                  <Textarea
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Обычная цена *</label>
                    <Input
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Цена со скидкой</label>
                    <Input
                      type="number"
                      value={editingProduct.discountPrice}
                      onChange={(e) => setEditingProduct({ ...editingProduct, discountPrice: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Скидка</label>
                    <div className="px-4 py-2 rounded-lg border bg-muted">
                      {calculateDiscount(editingProduct.price, editingProduct.discountPrice)}%
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Изображение</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], true)}
                  />
                  {editingProduct.imageUrl && (
                    <div className="mt-4">
                      <img src={editingProduct.imageUrl} alt="Preview" className="h-32 object-cover rounded-lg" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editInStock"
                    checked={editingProduct.inStock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                  />
                  <label htmlFor="editInStock" className="text-sm font-medium">В наличии</label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Сохранение...' : 'Сохранить'}
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
    </div>
  );
};

export default BestDealsManager;