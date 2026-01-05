import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const About = () => {
  const stats = [
    { value: '10+', label: 'Лет на рынке' },
    { value: '50K+', label: 'Довольных клиентов' },
    { value: '5000+', label: 'Товаров в ассортименте' },
    { value: '100+', label: 'Брендов' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">О компании Светит всем</h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Мы создаем идеальное освещение для вашего дома более 10 лет
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Наша история</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Светит всем начала свой путь в 2014 году как небольшой магазин освещения. С тех пор мы выросли, предлагаем широкий ассортимент светильников для дома и офиса.</p>
                <p>
                  Наша миссия — помочь каждому клиенту создать уникальную атмосферу в своем пространстве 
                  с помощью качественного и стильного освещения. Мы работаем только с проверенными 
                  производителями и предлагаем продукцию, которая прослужит долгие годы.
                </p>
                <p>
                  Сегодня Светит всем — это команда профессионалов, которые любят свое дело и готовы 
                  помочь вам с выбором идеального освещения для любого интерьера.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <Card key={stat.label} className="text-center p-6 animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <CardContent className="p-0">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Наши ценности</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="Star" className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Качество</h3>
                  <p className="text-muted-foreground">
                    Мы предлагаем только сертифицированную продукцию от ведущих производителей
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="Heart" className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Забота</h3>
                  <p className="text-muted-foreground">
                    Каждый клиент для нас важен, мы помогаем с выбором и решаем любые вопросы
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="Sparkles" className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Инновации</h3>
                  <p className="text-muted-foreground">
                    Следим за трендами и предлагаем самые современные решения в освещении
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;