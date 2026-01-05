import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import Icon from '@/components/ui/icon';

interface HeaderProps {
  cartItemsCount?: number;
  onCartClick?: () => void;
  onAuthClick?: () => void;
}

const Header = ({ cartItemsCount = 0, onCartClick, onAuthClick }: HeaderProps) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!user);
  }, []);

  const navLinks = [
    { to: '/', label: 'Главная' },
    { to: '/catalog', label: 'Каталог' },
    { to: '/about', label: 'О компании' },
    { to: '/delivery', label: 'Доставка и оплата' },
    { to: '/blog', label: 'Блог' },
    { to: '/contacts', label: 'Контакты' },
  ];

  const partnershipLinks = [
    { to: '/partnership/designers', label: 'Дизайнерам', icon: 'Palette' },
    { to: '/partnership/ceiling', label: 'Потолочникам', icon: 'Home' },
    { to: '/partnership/builders', label: 'Строителям', icon: 'HardHat' },
    { to: '/partnership/wholesale', label: 'Оптовикам', icon: 'Package' },
    { to: '/partnership/franchise', label: 'Франшиза', icon: 'Store' },
    { to: '/partnership/suppliers', label: 'Поставщикам', icon: 'Truck' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Icon name="Lightbulb" className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Светит всем</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium">
                    Сотрудничество
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 w-[400px] md:w-[500px] lg:w-[600px] grid-cols-2">
                      {partnershipLinks.map((link) => (
                        <NavigationMenuLink key={link.to} asChild>
                          <Link
                            to={link.to}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Icon name={link.icon as any} className="h-5 w-5" />
                              </div>
                              <div className="text-sm font-medium leading-none">
                                {link.label}
                              </div>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onCartClick}
            >
              <Icon name="ShoppingCart" className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                if (isLoggedIn) {
                  navigate('/profile');
                } else {
                  onAuthClick?.();
                }
              }}
            >
              <Icon name="User" className="h-5 w-5" />
            </Button>

            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Icon name="Menu" className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="text-lg font-medium transition-colors hover:text-primary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  <div className="border-t pt-4 mt-4">
                    <div className="text-sm font-semibold text-muted-foreground mb-3">
                      Сотрудничество
                    </div>
                    <div className="flex flex-col space-y-3">
                      {partnershipLinks.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          className="flex items-center gap-3 text-sm font-medium transition-colors hover:text-primary"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Icon name={link.icon as any} className="h-4 w-4" />
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;