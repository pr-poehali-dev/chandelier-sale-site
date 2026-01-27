import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useCart } from '@/contexts/CartContext';

const Blog = () => {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const articles = [
    {
      id: 1,
      title: 'Как выбрать люстру для гостиной: полное руководство',
      excerpt: 'Выбор люстры для гостиной — важная задача, которая требует учета множества факторов. В этой статье мы расскажем о ключевых параметрах...',
      category: 'Советы',
      date: '15 ноября 2024',
      readTime: '5 мин',
      image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/ea3f6d76-2db5-45df-8995-27d163a48b43.jpg',
    },
    {
      id: 2,
      title: 'Тренды освещения 2024: что будет в моде',
      excerpt: 'Дизайн освещения постоянно эволюционирует. Узнайте, какие тенденции будут определять стиль интерьеров в 2024 году...',
      category: 'Тренды',
      date: '10 ноября 2024',
      readTime: '7 мин',
      image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/2544184f-df96-433d-8e76-14c189cae2d4.jpg',
    },
    {
      id: 3,
      title: 'LED или галогенные лампы: что выбрать?',
      excerpt: 'Сравниваем технологии освещения и помогаем определиться с выбором ламп для вашего дома...',
      category: 'Обзоры',
      date: '5 ноября 2024',
      readTime: '4 мин',
      image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/08d2e311-543a-444f-bd95-27580dbf222a.jpg',
    },
    {
      id: 4,
      title: 'Освещение для рабочего места: как создать комфорт',
      excerpt: 'Правильное освещение рабочего пространства повышает продуктивность и сохраняет здоровье глаз...',
      category: 'Советы',
      date: '1 ноября 2024',
      readTime: '6 мин',
      image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/08d2e311-543a-444f-bd95-27580dbf222a.jpg',
    },
    {
      id: 5,
      title: 'Умное освещение: технологии будущего уже сегодня',
      excerpt: 'Управление светом с телефона, голосовые помощники и автоматизация — все об умном освещении...',
      category: 'Технологии',
      date: '28 октября 2024',
      readTime: '8 мин',
      image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/2544184f-df96-433d-8e76-14c189cae2d4.jpg',
    },
    {
      id: 6,
      title: 'Декоративное освещение: создаем настроение',
      excerpt: 'Как использовать свет для создания особой атмосферы в разных зонах вашего дома...',
      category: 'Дизайн',
      date: '20 октября 2024',
      readTime: '5 мин',
      image: 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/ea3f6d76-2db5-45df-8995-27d163a48b43.jpg',
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
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Блог и советы</h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Полезные статьи о выборе, установке и использовании освещения
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <Card
                key={article.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="p-0">
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{article.category}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icon name="Clock" className="h-3 w-3" />
                      {article.readTime}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{article.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{article.date}</span>
                    <Button variant="ghost" size="sm" className="h-8">
                      Читать далее
                      <Icon name="ArrowRight" className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="outline" size="lg">
              Загрузить еще статьи
            </Button>
          </div>
        </section>

        <section className="bg-muted py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Icon name="Mail" className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Подпишитесь на рассылку</h2>
              <p className="text-muted-foreground mb-6">
                Получайте свежие статьи, советы по освещению и специальные предложения
              </p>
              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Ваш email"
                  className="flex-1 px-4 py-2 rounded-lg border bg-background"
                />
                <Button>Подписаться</Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;