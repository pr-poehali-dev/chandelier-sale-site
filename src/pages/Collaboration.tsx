import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface PartnerFormData {
  name: string;
  organization: string;
  phone: string;
  email: string;
  category: string;
}

const Collaboration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [designerForm, setDesignerForm] = useState<PartnerFormData>({
    name: '',
    organization: '',
    phone: '',
    email: '',
    category: 'designer'
  });

  const [builderForm, setBuilderForm] = useState<PartnerFormData>({
    name: '',
    organization: '',
    phone: '',
    email: '',
    category: 'builder'
  });

  const [ceilingForm, setCeilingForm] = useState<PartnerFormData>({
    name: '',
    organization: '',
    phone: '',
    email: '',
    category: 'ceiling'
  });

  const [wholesaleForm, setWholesaleForm] = useState<PartnerFormData>({
    name: '',
    organization: '',
    phone: '',
    email: '',
    category: 'wholesale'
  });

  const [supplierForm, setSupplierForm] = useState<PartnerFormData>({
    name: '',
    organization: '',
    phone: '',
    email: '',
    category: 'supplier'
  });

  const handleSubmit = async (formData: PartnerFormData, categoryLabel: string) => {
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
        description: `Спасибо за интерес к сотрудничеству в категории "${categoryLabel}". Мы свяжемся с вами в ближайшее время.`
      });

      switch(formData.category) {
        case 'designer':
          setDesignerForm({ name: '', organization: '', phone: '', email: '', category: 'designer' });
          break;
        case 'builder':
          setBuilderForm({ name: '', organization: '', phone: '', email: '', category: 'builder' });
          break;
        case 'ceiling':
          setCeilingForm({ name: '', organization: '', phone: '', email: '', category: 'ceiling' });
          break;
        case 'wholesale':
          setWholesaleForm({ name: '', organization: '', phone: '', email: '', category: 'wholesale' });
          break;
        case 'supplier':
          setSupplierForm({ name: '', organization: '', phone: '', email: '', category: 'supplier' });
          break;
      }
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

  const renderForm = (
    formData: PartnerFormData,
    setFormData: React.Dispatch<React.SetStateAction<PartnerFormData>>,
    categoryLabel: string,
    benefits: string[]
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{categoryLabel}</CardTitle>
        <CardDescription>Заполните форму для начала сотрудничества</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h4 className="font-semibold mb-3">Преимущества сотрудничества:</h4>
          <ul className="space-y-2">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Icon name="Check" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor={`${formData.category}-name`}>
              Ваше имя <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${formData.category}-name`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Иван Иванов"
            />
          </div>

          <div>
            <Label htmlFor={`${formData.category}-org`}>
              Название организации
            </Label>
            <Input
              id={`${formData.category}-org`}
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              placeholder="ООО 'Компания' или ИП"
            />
          </div>

          <div>
            <Label htmlFor={`${formData.category}-phone`}>
              Телефон <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${formData.category}-phone`}
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <div>
            <Label htmlFor={`${formData.category}-email`}>
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${formData.category}-email`}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@mail.ru"
            />
          </div>

          <Button
            onClick={() => handleSubmit(formData, categoryLabel)}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Отправка...' : 'Отправить заявку'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Сотрудничество</h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Присоединяйтесь к нашей партнерской программе и получайте выгодные условия
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <Tabs defaultValue="designer" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
              <TabsTrigger value="designer">Дизайнеры</TabsTrigger>
              <TabsTrigger value="builder">Строители</TabsTrigger>
              <TabsTrigger value="ceiling">Потолочники</TabsTrigger>
              <TabsTrigger value="wholesale">Оптовикам</TabsTrigger>
              <TabsTrigger value="supplier">Поставщикам</TabsTrigger>
            </TabsList>

            <TabsContent value="designer">
              {renderForm(
                designerForm,
                setDesignerForm,
                'Сотрудничество с дизайнерами',
                [
                  'Специальные цены для дизайнеров интерьера',
                  'Персональный менеджер для работы над проектами',
                  'Помощь в подборе освещения для любых интерьеров',
                  'Быстрая доставка и приоритетное обслуживание',
                  'Программа лояльности с накопительными бонусами'
                ]
              )}
            </TabsContent>

            <TabsContent value="builder">
              {renderForm(
                builderForm,
                setBuilderForm,
                'Сотрудничество со строителями',
                [
                  'Оптовые цены на большие объемы',
                  'Отсрочка платежа для постоянных партнеров',
                  'Консультации по выбору освещения для объектов',
                  'Доставка на объект в удобное время',
                  'Техническая поддержка на всех этапах строительства'
                ]
              )}
            </TabsContent>

            <TabsContent value="ceiling">
              {renderForm(
                ceilingForm,
                setCeilingForm,
                'Сотрудничество с потолочниками',
                [
                  'Скидки на встраиваемые светильники и споты',
                  'Помощь в расчете освещенности помещений',
                  'Рекомендации по монтажу различных типов светильников',
                  'Гарантия на всю продукцию',
                  'Бесплатные образцы для демонстрации клиентам'
                ]
              )}
            </TabsContent>

            <TabsContent value="wholesale">
              {renderForm(
                wholesaleForm,
                setWholesaleForm,
                'Оптовым покупателям',
                [
                  'Минимальные цены при закупке от 100 000 ₽',
                  'Индивидуальные условия для крупных заказов',
                  'Прямые поставки от производителей',
                  'Складская программа и дропшиппинг',
                  'Маркетинговая поддержка и рекламные материалы'
                ]
              )}
            </TabsContent>

            <TabsContent value="supplier">
              {renderForm(
                supplierForm,
                setSupplierForm,
                'Поставщикам',
                [
                  'Долгосрочное сотрудничество с надежным партнером',
                  'Прозрачные условия работы и своевременные платежи',
                  'Большие объемы закупок качественной продукции',
                  'Совместное продвижение брендов на рынке',
                  'Участие в выставках и отраслевых мероприятиях'
                ]
              )}
            </TabsContent>
          </Tabs>
        </section>

        <section className="bg-muted py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Остались вопросы?</h2>
              <p className="text-muted-foreground mb-8">
                Свяжитесь с нами любым удобным способом, и мы подробно расскажем об условиях сотрудничества
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Icon name="Phone" className="h-8 w-8 text-primary mx-auto mb-3" />
                    <p className="font-semibold mb-1">Телефон</p>
                    <a href="tel:+79191546941" className="text-sm text-muted-foreground hover:text-primary">
                      +7 (919) 154-69-41
                    </a>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Icon name="Mail" className="h-8 w-8 text-primary mx-auto mb-3" />
                    <p className="font-semibold mb-1">Email</p>
                    <a href="mailto:info@luxlight.ru" className="text-sm text-muted-foreground hover:text-primary">
                      info@luxlight.ru
                    </a>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Icon name="MapPin" className="h-8 w-8 text-primary mx-auto mb-3" />
                    <p className="font-semibold mb-1">Адрес</p>
                    <p className="text-sm text-muted-foreground">
                      г. Уфа, ул. Менделеева, 37к4
                    </p>
                  </CardContent>
                </Card>
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