import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Product } from "@/lib/api";

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  selectedProducts: number[];
  setSelectedProducts: (products: number[]) => void;
  deletingProducts: number[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalProducts: number;
  itemsPerPage: number;
  onEdit: (product: Product) => void;
  onDelete: (ids: number[]) => Promise<void>;
  onUpdateStock: (productId: number, inStock: boolean) => Promise<void>;
}

const ProductsTable = ({
  products,
  loading,
  selectedProducts,
  setSelectedProducts,
  deletingProducts,
  currentPage,
  setCurrentPage,
  totalProducts,
  itemsPerPage,
  onEdit,
  onDelete,
  onUpdateStock,
}: ProductsTableProps) => {
  const [updatingStock, setUpdatingStock] = useState(false);

  const toggleSelectProduct = (id: number) => {
    setSelectedProducts(
      selectedProducts.includes(id)
        ? selectedProducts.filter((pid) => pid !== id)
        : [...selectedProducts, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const updateStockStatus = async (productId: number, inStock: boolean) => {
    setUpdatingStock(true);
    try {
      await onUpdateStock(productId, inStock);
    } finally {
      setUpdatingStock(false);
    }
  };

  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Товары не найдены
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === products.length}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Изображение</th>
              <th className="p-2 text-left">Название</th>
              <th className="p-2 text-left">Цена</th>
              <th className="p-2 text-left">Бренд</th>
              <th className="p-2 text-left">Тип</th>
              <th className="p-2 text-left">Наличие</th>
              <th className="p-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b hover:bg-muted/50">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => toggleSelectProduct(product.id)}
                    className="rounded"
                  />
                </td>
                <td className="p-2">{product.id}</td>
                <td className="p-2">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                </td>
                <td className="p-2">{product.name}</td>
                <td className="p-2">{product.price.toLocaleString()} ₽</td>
                <td className="p-2">{product.brand}</td>
                <td className="p-2">{product.type}</td>
                <td className="p-2">
                  <Button
                    variant={product.inStock ? "default" : "destructive"}
                    size="sm"
                    onClick={() => updateStockStatus(product.id, !product.inStock)}
                    disabled={updatingStock}
                  >
                    {product.inStock ? "Да" : "Нет"}
                  </Button>
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onEdit(product)}
                      variant="outline"
                      size="sm"
                    >
                      <Icon name="Pencil" className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => onDelete([product.id])}
                      variant="destructive"
                      size="sm"
                      disabled={deletingProducts.includes(product.id)}
                    >
                      {deletingProducts.includes(product.id) ? (
                        <Icon name="Loader2" className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon name="Trash2" className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            <Icon name="ChevronLeft" className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Страница {currentPage} из {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            <Icon name="ChevronRight" className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
};

export default ProductsTable;
