import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";

interface AdminFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterBrand: string;
  setFilterBrand: (brand: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  filterStock: string;
  setFilterStock: (stock: string) => void;
  brands: string[];
  productTypes: string[];
  productsCount: number;
  totalProducts: number;
  currentPage: number;
}

const AdminFilters = ({
  searchQuery,
  setSearchQuery,
  filterBrand,
  setFilterBrand,
  filterType,
  setFilterType,
  filterStock,
  setFilterStock,
  brands,
  productTypes,
  productsCount,
  totalProducts,
  currentPage,
}: AdminFiltersProps) => {
  const hasActiveFilters =
    searchQuery ||
    filterBrand !== "all" ||
    filterType !== "all" ||
    filterStock !== "all";

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="search">Поиск</Label>
          <Input
            id="search"
            placeholder="Название, бренд, описание..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="brand-filter">Бренд</Label>
          <Select value={filterBrand} onValueChange={setFilterBrand}>
            <SelectTrigger id="brand-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все бренды</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="type-filter">Тип товара</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger id="type-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {productTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="stock-filter">Наличие</Label>
          <Select value={filterStock} onValueChange={setFilterStock}>
            <SelectTrigger id="stock-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все товары</SelectItem>
              <SelectItem value="inStock">В наличии</SelectItem>
              <SelectItem value="outOfStock">Нет в наличии</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Показано: {productsCount} из {totalProducts} товаров (страница {currentPage})
        </p>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setFilterBrand("all");
              setFilterType("all");
              setFilterStock("all");
            }}
          >
            <Icon name="X" className="mr-2 h-4 w-4" />
            Сбросить фильтры
          </Button>
        )}
      </div>
    </div>
  );
};

export default AdminFilters;
