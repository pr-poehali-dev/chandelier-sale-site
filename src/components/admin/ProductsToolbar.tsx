import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import { api, Product } from "@/lib/api";

interface ProductsToolbarProps {
  products: Product[];
  onCreate: () => void;
  loadProducts: () => Promise<void>;
}

const ProductsToolbar = ({ products, onCreate, loadProducts }: ProductsToolbarProps) => {
  const { toast } = useToast();
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        products.map(async (product) => {
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

  return (
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
    </div>
  );
};

export default ProductsToolbar;
