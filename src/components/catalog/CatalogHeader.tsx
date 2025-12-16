import { Button } from "@/components/ui/button";
import { User } from "@/lib/api";

interface CatalogHeaderProps {
  user: User | null;
  onLogout: () => void;
}

const CatalogHeader = ({ user, onLogout }: CatalogHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-4xl font-bold">Каталог освещения</h1>
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm">Привет, {user.first_name}!</span>
          <Button variant="outline" size="sm" onClick={onLogout}>
            Выйти
          </Button>
        </div>
      )}
    </div>
  );
};

export default CatalogHeader;
