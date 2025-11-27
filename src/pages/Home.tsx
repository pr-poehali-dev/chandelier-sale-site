import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthDialog from '@/components/AuthDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { User } from '@/lib/api';

const Home = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
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
  ];

  const features = [
    {
      icon: 'Truck',
      title: 'Быстрая доставка',
      description: 'Доставим ваш заказ в течение 1-3 дней по Москве и области',
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header onAuthClick={() => setShowAuth(true)} />

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
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Популярные категории
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.name}
              to={category.link}
              className="group relative overflow-hidden rounded-xl aspect-square animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                <h3 className="text-white text-2xl font-bold">{category.name}</h3>
              </div>
            </Link>
          ))}
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