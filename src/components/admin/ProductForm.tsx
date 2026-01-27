import { useState, ChangeEvent, FormEvent } from 'react';
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

interface ProductFormProps {
  adminProductsUrl: string;
  uploadImageUrl: string;
  onProductAdded: () => void;
}

const ProductForm = ({ adminProductsUrl, uploadImageUrl, onProductAdded }: ProductFormProps) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
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

  const handleSubmitProduct = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(adminProductsUrl, {
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
        onProductAdded();
      } else {
        setMessage(data.error || 'Ошибка добавления товара');
      }
    } catch (error) {
      setMessage('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Добавить новый товар</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Название товара</label>
            <Input
              type="text"
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              required
              placeholder="Люстра Элегант"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Описание</label>
            <Textarea
              value={product.description}
              onChange={(e) => setProduct({ ...product, description: e.target.value })}
              rows={4}
              placeholder="Подробное описание товара..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Цена (₽)</label>
              <Input
                type="number"
                value={product.price || ''}
                onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) || 0 })}
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Артикул</label>
              <Input
                type="text"
                value={product.article}
                onChange={(e) => setProduct({ ...product, article: e.target.value })}
                required
                placeholder="ART-12345"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Бренд</label>
              <Input
                type="text"
                value={product.brand}
                onChange={(e) => setProduct({ ...product, brand: e.target.value })}
                required
                placeholder="LuxLight"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Тип</label>
              <select
                value={product.type}
                onChange={(e) => setProduct({ ...product, type: e.target.value })}
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
            {product.image_url && (
              <img src={product.image_url} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="in_stock"
              checked={product.in_stock}
              onChange={(e) => setProduct({ ...product, in_stock: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="in_stock" className="text-sm font-medium">В наличии</label>
          </div>

          {message && (
            <div className={`text-sm ${message.includes('Ошибка') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                Добавление...
              </>
            ) : (
              'Добавить товар'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductForm;
