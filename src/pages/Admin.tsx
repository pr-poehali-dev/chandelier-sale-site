import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api, Product } from '@/lib/api';

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    image: '',
    brand: '',
    rating: 5,
    reviews: 0,
    inStock: true,
    type: 'chandelier' as 'chandelier' | 'lamp' | 'sconce' | 'spotlight' | 'floor_lamp' | 'pendant',
    description: '',
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
      return;
    }
    
    const userData = JSON.parse(user);
    if (userData.email !== 'admin@luxlight.ru') {
      navigate('/');
      return;
    }

    loadProducts();
  }, [navigate]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({ limit: 200 });
      setProducts(data.products);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить товары',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      image: product.image,
      brand: product.brand,
      rating: product.rating,
      reviews: product.reviews,
      inStock: product.inStock,
      type: product.type,
      description: product.description || '',
    });
    setIsNewProduct(false);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: 0,
      image: '',
      brand: '',
      rating: 5,
      reviews: 0,
      inStock: true,
      type: 'chandelier',
      description: '',
    });
    setIsNewProduct(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (isNewProduct) {
        await api.createProduct(formData);
        toast({
          title: 'Успешно',
          description: 'Товар создан',
        });
      } else if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
        toast({
          title: 'Успешно',
          description: 'Товар обновлён',
        });
      }
      setIsDialogOpen(false);
      loadProducts();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить товар',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот товар?')) return;
    
    try {
      await api.deleteProduct(id);
      toast({
        title: 'Успешно',
        description: 'Товар удалён',
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

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast({
        title: 'Ошибка',
        description: 'Поддерживаются только Excel (.xlsx, .xls) и CSV файлы',
        variant: 'destructive',
      });
      return;
    }

    setUploadingBulk(true);

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          let workbook: XLSX.WorkBook;
          
          if (fileExtension === '.csv') {
            workbook = XLSX.read(data, { type: 'binary' });
          } else {
            workbook = XLSX.read(data, { type: 'array' });
          }
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

          if (jsonData.length === 0) {
            toast({
              title: 'Ошибка',
              description: 'Файл пуст',
              variant: 'destructive',
            });
            setUploadingBulk(false);
            return;
          }

          let successCount = 0;
          let errorCount = 0;

          for (const row of jsonData) {
            try {
              const productData = {
                name: row['Название'] || row['name'] || '',
                description: row['Описание'] || row['description'] || '',
                price: Number(row['Цена'] || row['price'] || 0),
                brand: row['Бренд'] || row['brand'] || '',
                type: (row['Тип'] || row['type'] || 'chandelier') as any,
                image: row['Изображение'] || row['image'] || '',
                inStock: row['В наличии'] !== undefined ? row['В наличии'] : (row['inStock'] !== undefined ? row['inStock'] : true),
                rating: Number(row['Рейтинг'] || row['rating'] || 5),
                reviews: Number(row['Отзывы'] || row['reviews'] || 0),
              };

              if (!productData.name || !productData.price || !productData.brand) {
                errorCount++;
                continue;
              }

              await api.createProduct(productData);
              successCount++;
            } catch (err) {
              errorCount++;
            }
          }

          toast({
            title: 'Загрузка завершена',
            description: `Успешно: ${successCount}, Ошибок: ${errorCount}`,
          });

          loadProducts();
        } catch (error) {
          toast({
            title: 'Ошибка',
            description: 'Не удалось обработать файл',
            variant: 'destructive',
          });
        } finally {
          setUploadingBulk(false);
        }
      };

      if (fileExtension === '.csv') {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось прочитать файл',
        variant: 'destructive',
      });
      setUploadingBulk(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Название': 'Пример: Люстра Crystal',
        'Описание': 'Роскошный светильник из хрусталя',
        'Цена': 45000,
        'Бренд': 'LuxCrystal',
        'Тип': 'chandelier',
        'Изображение': 'https://example.com/image.jpg',
        'В наличии': true,
        'Рейтинг': 5.0,
        'Отзывы': 12
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Товары');
    XLSX.writeFile(wb, 'template_products.xlsx');
  };

  const types = [
    { value: 'chandelier', label: 'Люстра' },
    { value: 'lamp', label: 'Настольная лампа' },
    { value: 'sconce', label: 'Бра' },
    { value: 'spotlight', label: 'Спот' },
    { value: 'floor_lamp', label: 'Торшер' },
    { value: 'pendant', label: 'Подвесной светильник' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Управление товарами</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Icon name="Download" className="mr-2 h-4 w-4" />
              Шаблон Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingBulk}
            >
              {uploadingBulk ? (
                <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icon name="FileSpreadsheet" className="mr-2 h-4 w-4" />
              )}
              Загрузить Excel/CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleBulkUpload}
            />
            <Button onClick={handleCreate}>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Добавить товар
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <CardTitle className="text-lg">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Бренд:</span> {product.brand}</p>
                  <p><span className="font-medium">Цена:</span> {product.price.toLocaleString()} ₽</p>
                  <p><span className="font-medium">Тип:</span> {types.find(t => t.value === product.type)?.label}</p>
                  <p><span className="font-medium">Рейтинг:</span> {product.rating} ⭐</p>
                  <p><span className="font-medium">Наличие:</span> {product.inStock ? '✅ В наличии' : '❌ Нет'}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleEdit(product)}
                  >
                    <Icon name="Pencil" className="mr-2 h-4 w-4" />
                    Изменить
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Icon name="Trash2" className="mr-2 h-4 w-4" />
                    Удалить
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewProduct ? 'Добавить товар' : 'Редактировать товар'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Название товара"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Цена (₽)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="brand">Бренд</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Бренд"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="image">Изображение товара</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://... или загрузите файл"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingImage}
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    {uploadingImage ? (
                      <Icon name="Loader2" className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon name="Upload" className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      if (!file.type.startsWith('image/')) {
                        toast({
                          title: 'Ошибка',
                          description: 'Выберите изображение',
                          variant: 'destructive',
                        });
                        return;
                      }
                      
                      setUploadingImage(true);
                      
                      try {
                        const formDataUpload = new FormData();
                        formDataUpload.append('file', file);
                        
                        const response = await fetch('https://api.poehali.dev/upload', {
                          method: 'POST',
                          body: formDataUpload,
                        });
                        
                        if (!response.ok) throw new Error('Upload failed');
                        
                        const data = await response.json();
                        setFormData({ ...formData, image: data.url });
                        
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
                      } finally {
                        setUploadingImage(false);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
                {formData.image && (
                  <img 
                    src={formData.image} 
                    alt="Предпросмотр"
                    className="w-full max-w-xs h-48 object-cover rounded-lg"
                  />
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="type">Тип товара</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rating">Рейтинг</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="reviews">Отзывы</Label>
                <Input
                  id="reviews"
                  type="number"
                  value={formData.reviews}
                  onChange={(e) => setFormData({ ...formData, reviews: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-end">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.inStock}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                    className="w-4 h-4"
                  />
                  В наличии
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Подробное описание товара"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              <Icon name="Save" className="mr-2 h-4 w-4" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Admin;