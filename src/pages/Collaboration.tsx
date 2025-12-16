import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface PartnerCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  benefits: string[];
}

const partnerCategories: PartnerCategory[] = [
  {
    id: 'designers',
    title: 'Дизайнерам',
    description: 'Специальные условия для дизайнеров интерьера',
    icon: 'Palette',
    benefits: [
      'Специальные цены для дизайнеров интерьера',
      'Приоритетное обслуживание ваших заказов',
      'Бонусная программа за привлечение клиентов',
      'Доступ к эксклюзивным коллекциям'
    ]
  },
  {
    id: 'builders',
    title: 'Строителям',
    description: 'Выгодные условия для строительных компаний',
    icon: 'HardHat',
    benefits: [
      'Оптовые цены на крупные партии',
      'Гибкие условия оплаты и доставки',
      'Техническая поддержка на объектах',
      'Бонусы за объёмы'
    ]
  },
  {
    id: 'ceilings',
    title: 'Потолочникам',
    description: 'Партнерство с мастерами натяжных потолков',
    icon: 'Layers',
    benefits: [
      'Специальные цены на материалы',
      'Бесплатное обучение и сертификация',
      'Совместное продвижение услуг',
      'Гарантия качества материалов'
    ]
  },
  {
    id: 'wholesale',
    title: 'Оптовикам',
    description: 'Сотрудничество для оптовых покупателей',
    icon: 'Package',
    benefits: [
      'Максимальные скидки от производителя',
      'Индивидуальные условия поставки',
      'Эксклюзивные права на территорию',
      'Маркетинговая поддержка'
    ]
  },
  {
    id: 'suppliers',
    title: 'Поставщикам',
    description: 'Расширьте ассортимент нашими товарами',
    icon: 'Truck',
    benefits: [
      'Прямые поставки от производителя',
      'Конкурентные оптовые цены',
      'Широкий ассортимент продукции',
      'Логистическая поддержка'
    ]
  }
];

const Collaboration = () => {
  const navigate = useNavigate();

  const handleCategorySelect = (categoryId: string) => {
    navigate(`/partnership/${categoryId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Сотрудничество</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Выберите категорию партнерства и получите выгодные условия для развития вашего бизнеса
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {partnerCategories.map((category) => (
              <Card 
                key={category.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleCategorySelect(category.id)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon name={category.icon} className="h-8 w-8 text-primary" />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                      <CardDescription className="text-sm mb-4">
                        {category.description}
                      </CardDescription>
                    </div>

                    <div className="w-full text-left space-y-2 mb-4">
                      {category.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs">
                          <Icon name="Check" className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    <Button className="w-full group-hover:bg-primary/90">
                      Стать партнёром
                      <Icon name="ArrowRight" className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Почему выбирают нас?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Мы работаем с партнёрами на долгосрочной основе, обеспечивая взаимовыгодное сотрудничество
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon name="TrendingUp" className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Рост прибыли</h3>
                <p className="text-sm text-muted-foreground">
                  Увеличьте доход благодаря выгодным условиям
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon name="Shield" className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Надёжность</h3>
                <p className="text-sm text-muted-foreground">
                  Стабильное качество и своевременные поставки
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon name="Users" className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Поддержка</h3>
                <p className="text-sm text-muted-foreground">
                  Персональный менеджер и техническая помощь
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Collaboration;