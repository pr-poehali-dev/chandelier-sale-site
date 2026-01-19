import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthDialog from '@/components/AuthDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useCart } from '@/contexts/CartContext';
import { api, Product, User } from '@/lib/api';
import ProductGrid from '@/components/catalog/ProductGrid';
import SEO from '@/components/SEO';

const Home = () => {
  const navigate = useNavigate();
  const { totalItems, addToCart } = useCart();
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const categories = [
    {
      name: 'Люстры',
      image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/ea3f6d76-2db5-45df-8995-27d163a48b43.jpg',
      link: '/catalog?type=chandelier',
    },
    {
      name: 'Настольные лампы',
      image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/08d2e311-543a-444f-bd95-27580dbf222a.jpg',
      link: '/catalog?type=lamp',
    },
    {
      name: 'Бра',
      image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/2544184f-df96-433d-8e76-14c189cae2d4.jpg',
      link: '/catalog?type=sconce',
    },
    {
      name: 'Трековые светильники',
      image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/8b58c88a-caa8-4802-bfd8-fea8c222b354.jpg',
      link: '/catalog?type=track',
    },
  ];

  const features = [
    {
      icon: 'Truck',
      title: 'Быстрая доставка',
      description: 'Быстрая доставка по России',
    },
    {
      icon: 'ShieldCheck',
      title: 'Гарантия качества',
      description: 'Официальная гарантия на все товары от производителей',
    },
    {
      icon: 'Headphones',
      title: 'Поддержка 24/7',
      description: 'Наши специалисты всегда готовы помочь с выбором',
    },
    {
      icon: 'CreditCard',
      title: 'Удобная оплата',
      description: 'Оплата наличными, картой или в рассрочку',
    },
  ];

  useEffect(() => {
    loadFeaturedProducts();
    loadFavorites();
  }, []);

  const loadFeaturedProducts = async () => {
    setLoading(true);
    console.log('🏠 Загрузка товаров на главной странице...');
    const startTime = Date.now();
    
    try {
      const data = await api.getProducts({ limit: 6 });
      const loadTime = Date.now() - startTime;
      console.log(`✅ Главная: загружено ${data.products.length} товаров за ${loadTime}мс`);
      setFeaturedProducts(data.products);
    } catch (error) {
      console.error('❌ Главная: ошибка загрузки товаров:', error);
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

  return (
    <div className="min-h-screen flex flex-col">
      <SEO />
      <Header 
        onAuthClick={() => setShowAuth(true)}
        cartItemsCount={totalItems}
        onCartClick={() => navigate('/cart')}
      />

      <section className="relative bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 py-20 md:py-32 animate-fade-in">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Освещение для вашего идеального дома
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Широкий выбор люстр, светильников и ламп от ведущих производителей. 
              Создайте уютную атмосферу в каждой комнате.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild className="hover:scale-105 transition-transform">
                <Link to="/catalog">
                  Смотреть каталог
                  <Icon name="ArrowRight" className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/about">О компании</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/catalog">Товары по самым выгодным ценам в России</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
          Популярные категории
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category, index) => (
            <Link
              key={category.name}
              to={category.link}
              className="group relative overflow-hidden rounded-2xl aspect-[4/5] animate-scale-in shadow-xl hover:shadow-2xl transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <img
                src={category.image}
                alt={category.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
                <h3 className="text-white text-3xl md:text-4xl font-bold group-hover:translate-y-[-8px] transition-transform duration-300">{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Акции
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Специальные предложения и скидки на популярные товары
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Percent" className="h-6 w-6 text-red-500" />
                <Badge variant="destructive">-30%</Badge>
              </div>
              <CardTitle>Скидка на люстры</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Скидка до 30% на избранные модели люстр премиум класса</p>
              <Button asChild className="w-full">
                <Link to="/catalog?type=chandelier">Смотреть товары</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Gift" className="h-6 w-6 text-blue-500" />
                <Badge className="bg-blue-500">Подарок</Badge>
              </div>
              <CardTitle>Торшер в подарок</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">При покупке от 50 000 ₽ - настольная лампа в подарок</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/catalog">К покупкам</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Sparkles" className="h-6 w-6 text-green-500" />
                <Badge className="bg-green-500">Новинка</Badge>
              </div>
              <CardTitle>Новая коллекция</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Эксклюзивные светильники от европейских дизайнеров</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/catalog">Посмотреть</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Бренды
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Мы работаем только с проверенными производителями освещения
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            {['LuxCrystal', 'ModernLight', 'OfficeLight', 'DesignLight', 'EuroLux', 'ArtLight', 'SmartLight', 'ClassicLux'].map((brand) => (
              <Link
                key={brand}
                to={`/catalog?brand=${brand}`}
                className="bg-background rounded-lg p-6 flex items-center justify-center hover:shadow-lg transition-shadow border hover:border-primary"
              >
                <span className="font-semibold text-center">{brand}</span>
              </Link>
            ))}
          </div>
          <div className="flex justify-center">
            <Button size="lg" asChild className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all">
              <Link to="/catalog?sale=true" className="flex items-center gap-2">
                <Icon name="Tag" className="h-5 w-5" />
                Товары брендов со скидкой
                <Icon name="ArrowRight" className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Популярные товары
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Товары с лучшим соотношением цены и качества
        </p>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : (
          <ProductGrid
            products={featuredProducts}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={addToCart}
          />
        )}
      </section>

      <section className="py-16 bg-muted/30 container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Выгодно
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Специальные предложения
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="bg-yellow-500 text-white">
                  <Icon name="Tag" className="mr-1 h-3 w-3" />
                  Выгодная цена
                </Badge>
                <span className="text-2xl font-bold">от 2 990 ₽</span>
              </div>
              <CardTitle>Настольные лампы</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <Icon name="Check" className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Современный дизайн</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="Check" className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Энергоэффективность</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="Check" className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Гарантия 2 года</span>
                </li>
              </ul>
              <Button asChild className="w-full">
                <Link to="/catalog?type=lamp">Смотреть товары</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="bg-purple-500 text-white">
                  <Icon name="Zap" className="mr-1 h-3 w-3" />
                  Хит продаж
                </Badge>
                <span className="text-2xl font-bold">от 8 900 ₽</span>
              </div>
              <CardTitle>Светодиодные люстры</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <Icon name="Check" className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Экономия до 90%</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="Check" className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Срок службы до 50 000 часов</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="Check" className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Регулировка яркости</span>
                </li>
              </ul>
              <Button asChild className="w-full">
                <Link to="/catalog?type=chandelier">Смотреть товары</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Почему выбирают нас
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="text-center animate-fade-in hover:shadow-lg transition-shadow"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Icon name={feature.icon as any} className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Скидка 15% на первый заказ
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Зарегистрируйтесь прямо сейчас и получите промокод на скидку
          </p>
          <Button size="lg" variant="secondary">
            Получить скидку
          </Button>
        </div>
      </section>

      <AuthDialog
        open={showAuth}
        onOpenChange={setShowAuth}
        onAuthSuccess={(user) => setUser(user)}
      />

      <Footer />
    </div>
  );
};

export default Home;