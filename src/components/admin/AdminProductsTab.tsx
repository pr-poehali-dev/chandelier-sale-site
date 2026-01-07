import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Icon from "@/components/ui/icon";
import { Product } from "@/lib/api";

interface AdminProductsTabProps {
  products: Product[];
  selectedProducts: number[];
  deletingProducts: number[];
  currentPage: number;
  totalProducts: number;
  itemsPerPage: number;
  onSelectAll: () => void;
  onSelectProduct: (id: number) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
}

const AdminProductsTab = ({
  products,
  selectedProducts,
  deletingProducts,
  currentPage,
  totalProducts,
  itemsPerPage,
  onSelectAll,
  onSelectProduct,
  onEdit,
  onDelete,
  setCurrentPage,
}: AdminProductsTabProps) => {
  const allSelected =
    products.length > 0 && products.every((p) => selectedProducts.includes(p.id));

  return (
    <>
      <div className="mb-4">
        <Button variant="outline" size="sm" onClick={onSelectAll}>
          <Checkbox checked={allSelected} className="mr-2" />
          {allSelected ? "Снять выделение" : "Выбрать все"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card
            key={product.id}
            className={`overflow-hidden ${
              selectedProducts.includes(product.id)
                ? "ring-2 ring-primary"
                : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => onSelectProduct(product.id)}
                />
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold line-clamp-2 text-sm">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {product.brand}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={product.inStock ? "default" : "secondary"}>
                      {product.inStock ? "В наличии" : "Нет в наличии"}
                    </Badge>
                    <span className="text-lg font-bold">
                      {product.price.toLocaleString()} ₽
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit(product)}
                >
                  <Icon name="Pencil" className="mr-2 h-4 w-4" />
                  Изменить
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => onDelete(product.id)}
                  disabled={deletingProducts.includes(product.id)}
                >
                  {deletingProducts.includes(product.id) ? (
                    <>
                      <Icon
                        name="Loader2"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                      Удаление...
                    </>
                  ) : (
                    <>
                      <Icon name="Trash2" className="mr-2 h-4 w-4" />
                      Удалить
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalProducts > itemsPerPage && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <Icon name="ChevronsLeft" className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <Icon name="ChevronLeft" className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Страница</span>
            <Input
              type="number"
              min={1}
              max={Math.ceil(totalProducts / itemsPerPage)}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (
                  page >= 1 &&
                  page <= Math.ceil(totalProducts / itemsPerPage)
                ) {
                  setCurrentPage(page);
                }
              }}
              className="w-16 h-8 text-center"
            />
            <span className="text-sm text-muted-foreground">
              из {Math.ceil(totalProducts / itemsPerPage)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({totalProducts} товаров)
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((p) =>
                Math.min(Math.ceil(totalProducts / itemsPerPage), p + 1)
              )
            }
            disabled={currentPage >= Math.ceil(totalProducts / itemsPerPage)}
          >
            <Icon name="ChevronRight" className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage(Math.ceil(totalProducts / itemsPerPage))
            }
            disabled={currentPage >= Math.ceil(totalProducts / itemsPerPage)}
          >
            <Icon name="ChevronsRight" className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
};

export default AdminProductsTab;
