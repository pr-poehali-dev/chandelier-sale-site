import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const Footer = () => {
  return (
    <footer className="bg-muted mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Icon name="Lightbulb" className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">LuxLight</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Интернет-магазин освещения с лучшими брендами и широким ассортиментом
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Каталог</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/catalog?type=chandelier" className="text-muted-foreground hover:text-primary">Люстры</Link></li>
              <li><Link to="/catalog?type=lamp" className="text-muted-foreground hover:text-primary">Настольные лампы</Link></li>
              <li><Link to="/catalog?type=sconce" className="text-muted-foreground hover:text-primary">Бра</Link></li>
              <li><Link to="/catalog?type=spotlight" className="text-muted-foreground hover:text-primary">Споты</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Информация</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-muted-foreground hover:text-primary">О компании</Link></li>
              <li><Link to="/delivery" className="text-muted-foreground hover:text-primary">Доставка и оплата</Link></li>
              <li><Link to="/collaboration" className="text-muted-foreground hover:text-primary">Сотрудничество</Link></li>
              <li><Link to="/blog" className="text-muted-foreground hover:text-primary">Блог</Link></li>
              <li><Link to="/contacts" className="text-muted-foreground hover:text-primary">Контакты</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Контакты</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center space-x-2">
                <Icon name="Phone" className="h-4 w-4" />
                <span>+7 (919) 154-69-41</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="Mail" className="h-4 w-4" />
                <span>luxlight@internet.ru</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="MapPin" className="h-4 w-4" />
                <span>г. Уфа, ул. Менделеева, 37к4</span>
              </li>
            </ul>
            <div className="flex space-x-3 mt-4">
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Icon name="Instagram" className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Icon name="Facebook" className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Icon name="Twitter" className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 LuxLight. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;