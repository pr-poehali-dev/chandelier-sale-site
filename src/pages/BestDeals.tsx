import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthDialog from "@/components/AuthDialog";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface BestDealProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  brand?: string;
  imageUrl?: string;
  images: string[];
  inStock: boolean;
}

const BestDeals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, totalItems } = useCart();
  const [products, setProducts] = useState<BestDealProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  const BEST_DEALS_API = "https://functions.poehali.dev/6a11bad0-b439-4e23-84f2-0008a31965f6";

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    console.log('🛍️ Загрузка товаров из best-deals API...');
    try {
      const response = await fetch(BEST_DEALS_API);
      if (!response.ok) throw new Error('Ошибка загрузки');
      const data = await response.json();
      console.log('✅ Загружено товаров:', data.products?.length, data);
      setProducts(data.products || []);
    } catch (error) {
      console.error('❌ Ошибка загрузки товаров:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить товары",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: BestDealProduct) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.discountPrice || product.price,
      image: product.images[0] || product.imageUrl || '',
      quantity: 1,
    });
    toast({
      title: "Добавлено в корзину",
      description: `${product.name} добавлен в корзину`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Товары по самым выгодным ценам"
        description="Акции и специальные предложения на освещение. Скидки до 50% на люстры, светильники и лампы."
      />
      <Header 
        onAuthClick={() => setShowAuth(true)}
        cartItemsCount={totalItems}
        onCartClick={() => navigate('/cart')}
      />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Icon name="Percent" className="h-10 w-10 text-red-500" />
              <Badge variant="destructive" className="text-lg px-4 py-2">Акция</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              Товары по самым выгодным ценам
            </h1>
            <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
              Специальные предложения и скидки на качественное освещение. 
              Успейте купить по выгодной цене!
            </p>
          </div>
        </section>

        <section className="py-12 container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Icon name="ShoppingBag" className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Товаров пока нет</h3>
              <p className="text-muted-foreground mb-6">
                Товары появятся здесь после добавления через админ-панель
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-center text-muted-foreground">
                  Найдено товаров: <span className="font-bold">{products.length}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const mainImage = product.images[0] || product.imageUrl || '';
                  const discount = product.discountPrice 
                    ? Math.round((1 - product.discountPrice / product.price) * 100)
                    : 0;

                  return (
                    <Card 
                      key={product.id} 
                      className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        {mainImage ? (
                          <img 
                            src={mainImage} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              console.error('❌ Ошибка загрузки картинки:', mainImage);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => console.log('✅ Картинка загружена:', mainImage)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon name="Image" className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                        {discount > 0 && (
                          <Badge variant="destructive" className="absolute top-3 right-3">
                            -{discount}%
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        {product.brand && (
                          <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
                        )}
                        <div className="flex items-baseline gap-2 mb-4">
                          {product.discountPrice ? (
                            <>
                              <span className="text-2xl font-bold text-red-500">
                                {product.discountPrice.toLocaleString('ru-RU')} ₽
                              </span>
                              <span className="text-sm text-muted-foreground line-through">
                                {product.price.toLocaleString('ru-RU')} ₽
                              </span>
                            </>
                          ) : (
                            <span className="text-2xl font-bold">
                              {product.price.toLocaleString('ru-RU')} ₽
                            </span>
                          )}
                        </div>
                        <Button 
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={!product.inStock}
                        >
                          <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
                          {product.inStock ? 'В корзину' : 'Нет в наличии'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
      <AuthDialog 
        open={showAuth} 
        onOpenChange={setShowAuth}
        onAuthSuccess={() => {}}
      />
    </div>
  );
};

export default BestDeals;