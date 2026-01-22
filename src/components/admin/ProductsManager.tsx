import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import { api, Product } from "@/lib/api";
import { LogEntry } from "./DebugPanel";

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
  addLog,
  loadProducts,
}: ProductsManagerProps) => {
  const { toast } = useToast();
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [importingProducts, setImportingProducts] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importUrls, setImportUrls] = useState("");
  const [updatingStock, setUpdatingStock] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const brands = Array.from(new Set(products.map((p) => p.brand))).sort();
  const types = Array.from(new Set(products.map((p) => p.type))).sort();
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();

  const toggleSelectProduct = (id: number) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBulk(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const productsToUpload: any[] = jsonData.map((row: any) => ({
        name: row["Название"] || row["Name"] || "",
        price: parseFloat(row["Цена"] || row["Price"] || "0"),
        brand: row["Бренд"] || row["Brand"] || "",
        type: row["Тип"] || row["Type"] || "chandelier",
        image: row["Изображение"] || row["Image"] || "",
        inStock: row["В наличии"] !== "Нет",
        rating: parseFloat(row["Рейтинг"] || "5"),
        reviews: parseInt(row["Отзывы"] || "0"),
        description: row["Описание"] || row["Description"] || "",
      }));

      const result = await api.bulkCreateProducts(productsToUpload);

      toast({
        title: "Товары загружены",
        description: `Успешно: ${result.success}, Ошибки: ${result.errors}`,
      });

      await loadProducts();
    } catch (error) {
      console.error("Bulk upload error:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить файл",
        variant: "destructive",
      });
    } finally {
      setUploadingBulk(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImport = async () => {
    if (!importUrls.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите URL товаров",
        variant: "destructive",
      });
      return;
    }

    setImportingProducts(true);
    try {
      await onImportProducts(importUrls);
      setShowImportDialog(false);
      setImportUrls("");
    } finally {
      setImportingProducts(false);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      products.map((p) => ({
        ID: p.id,
        Название: p.name,
        Цена: p.price,
        Бренд: p.brand,
        Тип: p.type,
        "В наличии": p.inStock ? "Да" : "Нет",
        Рейтинг: p.rating,
        Отзывы: p.reviews,
      })),
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Товары");
    XLSX.writeFile(workbook, "products.xlsx");

    toast({
      title: "Экспорт завершён",
      description: "Файл products.xlsx загружен",
    });
  };

  const exportProductsWithImages = async () => {
    try {
      const zip = new JSZip();
      const imagesFolder = zip.folder("images");

      const productData = await Promise.all(
        products.map(async (product, index) => {
          if (product.image && imagesFolder) {
            try {
              const imageResponse = await fetch(product.image);
              const imageBlob = await imageResponse.blob();
              const extension = product.image.split(".").pop() || "jpg";
              const imageName = `product_${product.id}.${extension}`;
              imagesFolder.file(imageName, imageBlob);

              return {
                ...product,
                imageFile: imageName,
              };
            } catch (error) {
              console.error(`Failed to fetch image for product ${product.id}:`, error);
              return product;
            }
          }
          return product;
        }),
      );

      const worksheet = XLSX.utils.json_to_sheet(
        productData.map((p) => ({
          ID: p.id,
          Название: p.name,
          Цена: p.price,
          Бренд: p.brand,
          Тип: p.type,
          "В наличии": p.inStock ? "Да" : "Нет",
          Рейтинг: p.rating,
          Отзывы: p.reviews,
          Описание: p.description || "",
          "Файл изображения": (p as any).imageFile || "",
          "URL изображения": p.image,
        })),
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Товары");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

      zip.file("products.xlsx", excelBuffer);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = "products_with_images.zip";
      link.click();

      toast({
        title: "Экспорт завершён",
        description: "ZIP-архив с товарами и изображениями загружен",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось создать архив",
        variant: "destructive",
      });
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Товары ({totalProducts})</span>
            <div className="flex gap-2">
              <Button onClick={onCreate} size="sm">
                <Icon name="Plus" className="mr-2 h-4 w-4" />
                Добавить товар
              </Button>
              <Button
                onClick={exportToExcel}
                variant="outline"
                size="sm"
                disabled={products.length === 0}
              >
                <Icon name="Download" className="mr-2 h-4 w-4" />
                Экспорт Excel
              </Button>
              <Button
                onClick={exportProductsWithImages}
                variant="outline"
                size="sm"
                disabled={products.length === 0}
              >
                <Icon name="Package" className="mr-2 h-4 w-4" />
                Экспорт с картинками
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                disabled={uploadingBulk}
              >
                {uploadingBulk ? (
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icon name="Upload" className="mr-2 h-4 w-4" />
                )}
                Импорт Excel
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
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

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Товары не найдены
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Импорт товаров по URL</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={importUrls}
                onChange={(e) => setImportUrls(e.target.value)}
                placeholder="Введите URL товаров (по одному на строку)"
                className="min-h-[200px] w-full rounded border p-2"
              />
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleImport}
                  disabled={importingProducts}
                  className="flex-1"
                >
                  {importingProducts ? (
                    <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Icon name="Download" className="mr-2 h-4 w-4" />
                  )}
                  Импортировать
                </Button>
                <Button
                  onClick={() => setShowImportDialog(false)}
                  variant="outline"
                  disabled={importingProducts}
                >
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProductsManager;
