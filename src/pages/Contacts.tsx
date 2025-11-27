import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const Contacts = () => {
  const contactInfo = [
    {
      icon: 'Phone',
      title: 'Телефон',
      items: ['+7 (495) 123-45-67', '+7 (800) 555-35-35'],
    },
    {
      icon: 'Mail',
      title: 'Email',
      items: ['info@luxlight.ru', 'support@luxlight.ru'],
    },
    {
      icon: 'MapPin',
      title: 'Адрес',
      items: ['г. Москва, ул. Примерная, д. 1', 'Пн-Вс: 09:00 - 21:00'],
    },
    {
      icon: 'Clock',
      title: 'Режим работы',
      items: ['Ежедневно: 09:00 - 21:00', 'Без выходных'],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Контакты</h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Свяжитесь с нами любым удобным способом
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {contactInfo.map((info, index) => (
              <Card key={info.title} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Icon name={info.icon as any} className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-3">{info.title}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {info.items.map((item, i) => (
                      <p key={i}>{item}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-6">Напишите нам</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Имя</label>
                    <input
                      type="text"
                      placeholder="Ваше имя"
                      className="w-full px-4 py-2 rounded-lg border bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-4 py-2 rounded-lg border bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Телефон</label>
                    <input
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      className="w-full px-4 py-2 rounded-lg border bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Сообщение</label>
                    <textarea
                      placeholder="Ваше сообщение"
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border bg-background"
                    />
                  </div>
                  <Button className="w-full">
                    Отправить сообщение
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Социальные сети</h3>
                  <div className="space-y-3">
                    <a
                      href="#"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Icon name="Instagram" className="h-5 w-5 text-primary" />
                      <span>@luxlight_official</span>
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Icon name="Facebook" className="h-5 w-5 text-primary" />
                      <span>LuxLight Russia</span>
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Icon name="Twitter" className="h-5 w-5 text-primary" />
                      <span>@luxlight_ru</span>
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground">
                <CardContent className="pt-6">
                  <Icon name="MessageCircle" className="h-8 w-8 mb-3" />
                  <h3 className="font-semibold mb-2">Онлайн-консультант</h3>
                  <p className="text-sm mb-4 opacity-90">
                    Нужна помощь с выбором? Наш консультант онлайн и готов ответить на ваши вопросы
                  </p>
                  <Button variant="secondary" className="w-full">
                    Начать чат
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-muted py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Как нас найти</h2>
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="text-center">
                      <Icon name="Map" className="h-16 w-16 text-primary mx-auto mb-4" />
                      <p className="text-lg font-semibold">Интерактивная карта</p>
                      <p className="text-sm text-muted-foreground">г. Москва, ул. Примерная, д. 1</p>
                    </div>
                  </div>
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

export default Contacts;