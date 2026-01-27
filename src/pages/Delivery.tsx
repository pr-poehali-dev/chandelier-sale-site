import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';
import { useCart } from '@/contexts/CartContext';

const Delivery = () => {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const deliveryOptions = [
    {
      icon: 'Truck',
      title: 'Курьерская доставка',
      description: 'По Уфе',
      price: 'от 500 ₽',
      time: '1-3 дня',
    },
    {
      icon: 'Package',
      title: 'Самовывоз',
      description: 'Из нашего магазина',
      price: 'Бесплатно',
      time: 'В день заказа',
    },
    {
      icon: 'MapPin',
      title: 'Доставка по России',
      description: 'Транспортными компаниями',
      price: 'от 1000 ₽',
      time: '3-10 дней',
    },
  ];

  const paymentMethods = [
    {
      icon: 'CreditCard',
      title: 'Банковская карта',
      description: 'Visa, MasterCard, Мир',
    },
    {
      icon: 'Wallet',
      title: 'Наличными',
      description: 'При получении заказа',
    },
    {
      icon: 'Smartphone',
      title: 'Онлайн-оплата',
      description: 'СБП, электронные кошельки',
    },
    {
      icon: 'Receipt',
      title: 'Рассрочка',
      description: 'До 12 месяцев без переплаты',
    },
  ];

  const faq = [
    {
      question: 'Как отследить мой заказ?',
      answer: 'После отправки заказа вы получите трек-номер на электронную почту. С его помощью можно отследить местоположение посылки в личном кабинете или на сайте транспортной компании.',
    },
    {
      question: 'Можно ли изменить адрес доставки?',
      answer: 'Да, вы можете изменить адрес доставки до момента отправки заказа. Свяжитесь с нашей службой поддержки по телефону или в чате.',
    },
    {
      question: 'Что делать, если товар пришел с дефектом?',
      answer: 'Если товар пришел с заводским браком или был поврежден при доставке, мы заменим его на новый или вернем деньги. Просто свяжитесь с нами в течение 14 дней после получения.',
    },

    {
      question: 'Когда списываются деньги при оплате картой?',
      answer: 'При оплате картой онлайн деньги списываются сразу после подтверждения заказа. При оплате картой курьеру — в момент получения заказа.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        cartItemsCount={totalItems}
        onCartClick={() => navigate('/cart')}
        onAuthClick={() => {}}
      />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Доставка и оплата</h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Выберите удобный способ получения и оплаты вашего заказа
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-8">Способы доставки</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {deliveryOptions.map((option, index) => (
              <Card key={option.title} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Icon name={option.icon as any} className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>{option.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{option.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Стоимость:</span>
                      <span className="font-semibold">{option.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Срок:</span>
                      <span className="font-semibold">{option.time}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>


        </section>

        <section className="bg-muted py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Способы оплаты</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {paymentMethods.map((method, index) => (
                <Card key={method.title} className="text-center animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon name={method.icon as any} className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{method.title}</h3>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-8">Часто задаваемые вопросы</h2>
          <Accordion type="single" collapsible className="max-w-3xl">
            {faq.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Delivery;