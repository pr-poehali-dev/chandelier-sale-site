import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface CategoryInfo {
  title: string;
  description: string;
  icon: string;
  benefits: string[];
}

const categoryData: Record<string, CategoryInfo> = {
  designer: {
    title: 'Регистрация дизайнера',
    description: 'Присоединяйтесь к нашей партнёрской программе для дизайнеров интерьера',
    icon: 'Palette',
    benefits: [
      'Специальные цены для дизайнеров интерьера',
      'Приоритетное обслуживание ваших заказов',
      'Бонусная программа за привлечение клиентов',
      'Доступ к эксклюзивным коллекциям'
    ]
  },
  builder: {
    title: 'Регистрация строителя',
    description: 'Получите выгодные условия для строительных работ',
    icon: 'HardHat',
    benefits: [
      'Оптовые цены на крупные партии',
      'Гибкие условия оплаты и доставки',
      'Техническая поддержка на объектах',
      'Бонусы за объёмы'
    ]
  },
  ceiling: {
    title: 'Регистрация потолочника',
    description: 'Станьте нашим партнёром в сфере натяжных потолков',
    icon: 'Layers',
    benefits: [
      'Специальные цены на материалы',
      'Бесплатное обучение и сертификация',
      'Совместное продвижение услуг',
      'Гарантия качества материалов'
    ]
  },
  wholesale: {
    title: 'Регистрация оптовика',
    description: 'Оптовые поставки на выгодных условиях',
    icon: 'Package',
    benefits: [
      'Максимальные скидки от производителя',
      'Индивидуальные условия поставки',
      'Эксклюзивные права на территорию',
      'Маркетинговая поддержка'
    ]
  },
  supplier: {
    title: 'Регистрация поставщика',
    description: 'Расширьте ассортимент нашими товарами',
    icon: 'Truck',
    benefits: [
      'Прямые поставки от производителя',
      'Конкурентные оптовые цены',
      'Широкий ассортимент продукции',
      'Логистическая поддержка'
    ]
  }
};

const PartnerRegistration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const category = searchParams.get('category') || 'designer';
  const categoryInfo = categoryData[category] || categoryData.designer;
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    phone: '',
    email: '',
    category: category
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, category }));
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.email) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректный email',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/1318b8fa-01d2-4ca1-af97-a64c493d701a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка отправки заявки');
      }

      toast({
        title: 'Заявка отправлена!',
        description: 'Спасибо за интерес к сотрудничеству. Мы свяжемся с вами в ближайшее время.'
      });

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось отправить заявку',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => navigate('/collaboration')}
            >
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Назад к выбору категории
            </Button>

            <Card>
              <CardHeader className="text-center pb-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon name={categoryInfo.icon} className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">{categoryInfo.title}</CardTitle>
                <CardDescription>{categoryInfo.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="mb-8 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Icon name="Gift" className="h-5 w-5 text-primary" />
                    Преимущества партнёрства:
                  </h4>
                  <ul className="space-y-2">
                    {categoryInfo.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Icon name="Check" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">
                      Ваше имя <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Иван Иванов"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="organization">
                      Название организации
                    </Label>
                    <Input
                      id="organization"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="ООО 'Компания' или ИП"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">
                      Телефон <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+7 (999) 123-45-67"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@mail.ru"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-base"
                  >
                    {loading ? (
                      <>
                        <Icon name="Loader2" className="mr-2 h-5 w-5 animate-spin" />
                        Отправка...
                      </>
                    ) : (
                      <>
                        Отправить заявку
                        <Icon name="Send" className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Icon name="Info" className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Что дальше?</p>
                      <p>После отправки заявки наш менеджер свяжется с вами в течение 24 часов для обсуждения условий сотрудничества.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PartnerRegistration;
