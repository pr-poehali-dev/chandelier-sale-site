import { Button } from "@/components/ui/button";
import ProductGrid from "./ProductGrid";
import { Product } from "@/lib/api";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface CatalogContentProps {
  filteredProducts: Product[];
  loading: boolean;
  favorites: number[];
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: Product) => void;
  onResetAll: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
}

const CatalogContent = ({
  filteredProducts,
  loading,
  favorites,
  onToggleFavorite,
  onAddToCart,
  onResetAll,
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
}: CatalogContentProps) => {
  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
      items.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => onPageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(<PaginationEllipsis key="ellipsis-start" />);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => onPageChange(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<PaginationEllipsis key="ellipsis-end" />);
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => onPageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  return (
    <div className="flex-1">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Загрузка..." : `Найдено товаров: ${totalCount}`}
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

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {renderPaginationItems()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default CatalogContent;