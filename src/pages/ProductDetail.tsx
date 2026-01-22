import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { api, Product } from '@/lib/api';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import ProductInfo from '@/components/product/ProductInfo';
import ProductTabs from '@/components/product/ProductTabs';
import SEO from '@/components/SEO';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart: addToCartContext, totalItems } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    let foundProduct = null;
    
    const productId = Number(id);
    console.log('🔍 Загрузка товара ID:', id, 'преобразован в:', productId);
    
    try {
      foundProduct = await api.getProductById(productId);
      console.log('✅ Товар найден в основном каталоге:', foundProduct);
    } catch (error) {
      console.log('⚠️ Товар не найден в основном каталоге, проверяю best-deals...');
    }
    
    if (!foundProduct) {
      try {
        const BEST_DEALS_API = 'https://functions.poehali.dev/6a11bad0-b439-4e23-84f2-0008a31965f6';
        console.log('🌐 Запрос к best-deals API...');
        const response = await fetch(BEST_DEALS_API);
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Получено товаров из best-deals:', data.products?.length);
          console.log('🔍 Ищу товар с ID:', productId, 'тип:', typeof productId);
          const bestDealProduct = data.products?.find((p: any) => {
            console.log('Сравниваю:', p.id, 'тип:', typeof p.id, 'с искомым:', productId);
            return p.id === productId;
          });
          console.log('🔎 Поиск товара ID', productId, '- результат:', bestDealProduct ? 'НАЙДЕН' : 'НЕ НАЙДЕН');
          if (bestDealProduct) {
            console.log('📝 Найденный товар best-deals:', bestDealProduct);
            foundProduct = {
              id: bestDealProduct.id,
              name: bestDealProduct.name,
              description: bestDealProduct.description || '',
              price: bestDealProduct.discountPrice || bestDealProduct.price,
              originalPrice: bestDealProduct.price !== bestDealProduct.discountPrice ? bestDealProduct.price : undefined,
              brand: bestDealProduct.brand || 'Без бренда',
              type: 'Люстра',
              image: bestDealProduct.images[0] || bestDealProduct.imageUrl || '',
              images: bestDealProduct.images || [],
              inStock: bestDealProduct.inStock,
              rating: 4.5,
              reviews: 0,
            } as any;
            console.log('✅ Товар из best-deals преобразован:', foundProduct);
          } else {
            console.log('❌ Товар НЕ найден в списке products, доступные ID:', data.products?.map((p: any) => p.id).slice(0, 10));
          }
        }
      } catch (bestDealsError) {
        console.error('❌ Ошибка загрузки из best-deals:', bestDealsError);
      }
    }
    
    if (foundProduct) {
      console.log('✅ Товар установлен в state');
      setProduct(foundProduct);
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(favorites.includes(foundProduct.id));
    } else {
      console.log('❌ Товар не найден нигде, показываю ошибку');
      toast({
        title: 'Товар не найден',
        variant: 'destructive',
      });
      navigate('/best-deals');
    }
    
    setLoading(false);
  };

  const addToCart = () => {
    if (!product) return;
    
    addToCartContext(product);
    
    toast({
      title: 'Товар добавлен в корзину',
      duration: 2000,
    });
  };

  const toggleFavorite = () => {
    if (!product) return;
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const newFavorites = isFavorite
      ? favorites.filter((id: number) => id !== product.id)
      : [...favorites, product.id];
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
    
    toast({
      title: isFavorite ? 'Удалено из избранного' : 'Добавлено в избранное',
      duration: 2000,
    });
  };

  const buyNow = () => {
    if (!product) return;
    addToCartContext(product);
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header
          cartItemsCount={totalItems}
          onCartClick={() => navigate('/cart')}
          onAuthClick={() => {}}
        />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const images = product.images && product.images.length > 0 
    ? [product.image, ...product.images] 
    : [product.image, product.image, product.image];

  const productTitle = `${product.name} — купить в интернет-магазине Светит всем`;
  const productDescription = `${product.name} по цене ${product.price.toLocaleString('ru-RU')} ₽. ${product.description || 'Качественное освещение с доставкой по России.'}`;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEO 
        title={productTitle}
        description={productDescription}
        image={product.image}
        type="product"
        canonicalPath={`/product/${id}`}
      />
      <Header
        cartItemsCount={totalItems}
        onCartClick={() => navigate('/cart')}
        onAuthClick={() => {}}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 text-gray-600 hover:text-gray-900"
          onClick={() => navigate('/catalog')}
        >
          <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <ProductImageGallery images={images} productName={product.name} />
          
          <ProductInfo
            product={product}
            isFavorite={isFavorite}
            onAddToCart={addToCart}
            onToggleFavorite={toggleFavorite}
            onBuyNow={buyNow}
          />
        </div>

        <div className="mt-12">
          <ProductTabs product={product} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;