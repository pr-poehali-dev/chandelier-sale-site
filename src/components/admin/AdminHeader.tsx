import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Admin {
  id: number;
  email: string;
  name: string;
}

interface AdminHeaderProps {
  admin: Admin | null;
  activeTab: 'add' | 'list' | 'best-deals';
  onTabChange: (tab: 'add' | 'list' | 'best-deals') => void;
  onLogout: () => void;
}

const AdminHeader = ({ admin, activeTab, onTabChange, onLogout }: AdminHeaderProps) => {
  return (
    <div className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Панель администратора</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              <Icon name="User" className="inline h-4 w-4 mr-1" />
              {admin?.name || admin?.email}
            </span>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <Icon name="LogOut" className="mr-2 h-4 w-4" />
              Выйти
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'list' ? 'default' : 'outline'}
            onClick={() => onTabChange('list')}
          >
            <Icon name="List" className="mr-2 h-4 w-4" />
            Список товаров
          </Button>
          <Button
            variant={activeTab === 'add' ? 'default' : 'outline'}
            onClick={() => onTabChange('add')}
          >
            <Icon name="Plus" className="mr-2 h-4 w-4" />
            Добавить товар
          </Button>
          <Button
            variant={activeTab === 'best-deals' ? 'default' : 'outline'}
            onClick={() => onTabChange('best-deals')}
          >
            <Icon name="Star" className="mr-2 h-4 w-4" />
            Лучшие предложения
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
