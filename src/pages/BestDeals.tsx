import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthDialog from "@/components/AuthDialog";
import ProductGrid from "@/components/catalog/ProductGrid";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { api, Product } from "@/lib/api";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";

const BestDeals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, totalItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    loadProducts();
    loadFavorites();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({ sale: true, limit: 100 });
      setProducts(data.products);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить товары",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    const stored = localStorage.getItem('favorites');
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  };

  const handleToggleFavorite = (id: number) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter(fav => fav !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.discountPrice || product.price,
      image: product.images[0],
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
          <div className="mb-8">
            <p className="text-center text-muted-foreground">
              Найдено товаров: <span className="font-bold">{products.length}</span>
            </p>
          </div>

          <ProductGrid
            products={products}
            loading={loading}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={handleAddToCart}
            onProductClick={(id) => navigate(`/product/${id}`)}
          />

          {!loading && products.length === 0 && (
            <div className="text-center py-16">
              <Icon name="ShoppingBag" className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Пока нет акционных товаров</h3>
              <p className="text-muted-foreground">Следите за обновлениями!</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default BestDeals;
