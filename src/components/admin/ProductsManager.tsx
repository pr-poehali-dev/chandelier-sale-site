import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Product } from "@/lib/api";
import { LogEntry } from "./DebugPanel";
import ProductsToolbar from "./ProductsToolbar";
import ProductsFilters from "./ProductsFilters";
import ProductsTable from "./ProductsTable";
import ImportDialog from "./ImportDialog";

interface ProductsManagerProps {
  products: Product[];
  loading: boolean;
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
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalProducts: number;
  itemsPerPage: number;
  onEdit: (product: Product) => void;
  onCreate: () => void;
  onDelete: (ids: number[]) => Promise<void>;
  onUpdateStock: (productId: number, inStock: boolean) => Promise<void>;
  onImportProducts: (urls: string) => Promise<void>;
  addLog: (level: LogEntry["level"], category: string, message: string, details?: any) => void;
  loadProducts: () => Promise<void>;
}

const ProductsManager = ({
  products,
  loading,
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
  currentPage,
  setCurrentPage,
  totalProducts,
  itemsPerPage,
  onEdit,
  onCreate,
  onDelete,
  onUpdateStock,
  onImportProducts,
  loadProducts,
}: ProductsManagerProps) => {
  const [showImportDialog, setShowImportDialog] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Товары ({totalProducts})</span>
            <div className="flex gap-2">
              <ProductsToolbar
                products={products}
                onCreate={onCreate}
                loadProducts={loadProducts}
              />
              <Button
                onClick={() => setShowImportDialog(true)}
                variant="outline"
                size="sm"
              >
                <Icon name="Link" className="mr-2 h-4 w-4" />
                Импорт по URL
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductsFilters
            products={products}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterBrand={filterBrand}
            setFilterBrand={setFilterBrand}
            filterType={filterType}
            setFilterType={setFilterType}
            filterStock={filterStock}
            setFilterStock={setFilterStock}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
            deletingProducts={deletingProducts}
            onDelete={onDelete}
          />

          <ProductsTable
            products={products}
            loading={loading}
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
            deletingProducts={deletingProducts}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalProducts={totalProducts}
            itemsPerPage={itemsPerPage}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateStock={onUpdateStock}
          />
        </CardContent>
      </Card>

      <ImportDialog
        showImportDialog={showImportDialog}
        setShowImportDialog={setShowImportDialog}
        onImportProducts={onImportProducts}
      />
    </div>
  );
};

export default ProductsManager;
