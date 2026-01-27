import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { Product } from "@/lib/api";

interface ProductsFiltersProps {
  products: Product[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterBrand: string;
  setFilterBrand: (brand: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  filterStock: string;
  setFilterStock: (stock: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  selectedProducts: number[];
  setSelectedProducts: (products: number[]) => void;
  deletingProducts: number[];
  onDelete: (ids: number[]) => Promise<void>;
}

const ProductsFilters = ({
  products,
  searchQuery,
  setSearchQuery,
  filterBrand,
  setFilterBrand,
  filterType,
  setFilterType,
  filterStock,
  setFilterStock,
  filterCategory,
  setFilterCategory,
  selectedProducts,
  setSelectedProducts,
  deletingProducts,
  onDelete,
}: ProductsFiltersProps) => {
  const brands = Array.from(new Set(products.map((p) => p.brand))).sort();
  const types = Array.from(new Set(products.map((p) => p.type))).sort();
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();

  return (
    <>
      <div className="mb-4 grid gap-4 md:grid-cols-5">
        <Input
          placeholder="Поиск по названию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select value={filterBrand} onValueChange={setFilterBrand}>
          <SelectTrigger>
            <SelectValue placeholder="Бренд" />
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
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger>
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {types.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStock} onValueChange={setFilterStock}>
          <SelectTrigger>
            <SelectValue placeholder="Наличие" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="in">В наличии</SelectItem>
            <SelectItem value="out">Нет в наличии</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProducts.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="secondary">Выбрано: {selectedProducts.length}</Badge>
          <Button
            onClick={() => onDelete(selectedProducts)}
            variant="destructive"
            size="sm"
            disabled={deletingProducts.length > 0}
          >
            {deletingProducts.length > 0 ? (
              <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icon name="Trash2" className="mr-2 h-4 w-4" />
            )}
            Удалить выбранные
          </Button>
          <Button
            onClick={() => setSelectedProducts([])}
            variant="outline"
            size="sm"
          >
            Отменить выбор
          </Button>
        </div>
      )}
    </>
  );
};

export default ProductsFilters;
