import { Button } from "@/components/ui/button";
import ProductGrid from "./ProductGrid";
import { Product } from "@/lib/api";

interface CatalogContentProps {
  filteredProducts: Product[];
  loading: boolean;
  favorites: number[];
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: Product) => void;
  onResetAll: () => void;
}

const CatalogContent = ({
  filteredProducts,
  loading,
  favorites,
  onToggleFavorite,
  onAddToCart,
  onResetAll,
}: CatalogContentProps) => {
  return (
    <div className="flex-1">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Загрузка..." : `Найдено товаров: ${filteredProducts.length}`}
        </p>
        <Button variant="ghost" size="sm" onClick={onResetAll}>
          Сбросить всё
        </Button>
      </div>

      <ProductGrid
        products={filteredProducts}
        favorites={favorites}
        loading={loading}
        onToggleFavorite={onToggleFavorite}
        onAddToCart={onAddToCart}
      />
    </div>
  );
};

export default CatalogContent;
