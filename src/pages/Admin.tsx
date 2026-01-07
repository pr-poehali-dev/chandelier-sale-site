import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import { api, Product, Order } from "@/lib/api";
import ChatTab from "@/components/admin/ChatTab";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [importingProducts, setImportingProducts] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importUrls, setImportUrls] = useState("");
  const [updatingStock, setUpdatingStock] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [deletingProducts, setDeletingProducts] = useState<number[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [partnerApplications, setPartnerApplications] = useState<any[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = 100;

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    image: "",
    brand: "",
    rating: 5,
    reviews: 0,
    inStock: true,
    type: "",
    description: "",
    hasRemote: false,
    isDimmable: false,
    hasColorChange: false,
    article: "",
    brandCountry: "",
    manufacturerCountry: "",
    collection: "",
    style: "",
    lampType: "",
    socketType: "",
    bulbType: "",
    lampCount: 0,
    lampPower: 0,
    totalPower: 0,
    lightingArea: 0,
    voltage: 220,
    color: "",
    height: 0,
    diameter: 0,
    length: 0,
    width: 0,
    depth: 0,
    chainLength: 0,
    images: [] as string[],
    assemblyInstructionUrl: "",
    materials: "",
    frameMaterial: "",
    shadeMaterial: "",
    frameColor: "",
    shadeColor: "",
    shadeDirection: "",
    diffuserType: "",
    diffuserShape: "",
    ipRating: "",
    interior: "",
    place: "",
    suspendedCeiling: false,
    mountType: "",
    officialWarranty: "",
    shopWarranty: "",
    section: "",
    catalog: "",
    subcategory: "",
  });

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/");
      return;
    }

    const userData = JSON.parse(user);
    if (userData.email !== "raaniskakov@gmail.com") {
      navigate("/");
      return;
    }

    loadOrders();
    loadPartnerApplications();
  }, [navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterBrand, filterType, filterStock, filterCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔄 Загрузка товаров админки с фильтрами:', {
        page: currentPage,
        query: searchQuery,
        brand: filterBrand,
        type: filterType,
        stock: filterStock,
        category: filterCategory,
      });
      loadProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [currentPage, searchQuery, filterBrand, filterType, filterStock, filterCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const startTime = Date.now();
      
      const filters: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };

      if (searchQuery) filters.search = searchQuery;
      if (filterBrand !== 'all') filters.brands = filterBrand;
      if (filterType !== 'all') filters.category = filterType;
      if (filterStock === 'in') filters.in_stock = 'true';
      if (filterStock === 'out') filters.in_stock = 'false';
      if (filterCategory !== 'all') filters.category = filterCategory;

      console.log('📡 API запрос админки с фильтрами:', filters);
      const data = await api.getProducts(filters);
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ Товары админки загружены: ${data.products.length} шт. за ${loadTime}мс (всего: ${data.total})`);
      
      setProducts(data.products);
      setTotalProducts(data.total || 0);
    } catch (error) {
      console.error("Load products error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      toast({
        title: "Ошибка загрузки товаров",
        description: `${errorMessage}. Проверьте подключение к интернету или обновите страницу.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await api.getOrders();
      setOrders(data.orders);
    } catch (error) {
      console.error("Orders load error:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadPartnerApplications = async () => {
    setPartnersLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/1318b8fa-01d2-4ca1-af97-a64c493d701a');
      const data = await response.json();
      setPartnerApplications(data.applications || []);
    } catch (error) {
      console.error("Partner applications load error:", error);
      toast({
        title: "Ошибка загрузки заявок",
        description: "Не удалось загрузить заявки партнёров",
        variant: "destructive",
      });
    } finally {
      setPartnersLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await fetch(
        `https://functions.poehali.dev/fcd6dd35-a3e6-4d67-978f-190d82e2575a?id=${orderId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );

      toast({
        title: "Статус обновлён",
      });

      await loadOrders();
    } catch (error) {
      toast({
        title: "Ошибка обновления",
        variant: "destructive",
      });
    }
  };

  const updateOrderTracking = async (orderId: number, trackingNumber: string) => {
    try {
      await api.updateOrder(orderId, { tracking_number: trackingNumber });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, tracking_number: trackingNumber } : o,
        ),
      );
      toast({
        title: "Трек-номер обновлён",
        description: trackingNumber ? `Трек-номер: ${trackingNumber}` : "Трек-номер удалён",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить трек-номер",
        variant: "destructive",
      });
    }
  };

  const viewOrderDetails = async (orderId: number) => {
    try {
      const order = await api.getOrder(orderId);
      setSelectedOrder(order);
      setShowOrderDialog(true);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить детали заказа",
        variant: "destructive",
      });
    }
  };

  const deleteOrder = async (orderId: number) => {
    if (!confirm("Удалить этот заказ?")) return;

    try {
      await fetch(`https://functions.poehali.dev/fcd6dd35-a3e6-4d67-978f-190d82e2575a?id=${orderId}`, {
        method: "DELETE",
      });

      toast({
        title: "Заказ удалён",
      });

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
        setShowOrderDialog(false);
      }

      await loadOrders();
    } catch (error) {
      toast({
        title: "Ошибка удаления",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      image: product.image,
      brand: product.brand,
      rating: product.rating,
      reviews: product.reviews,
      inStock: product.inStock,
      type: product.type,
      description: product.description || "",
      hasRemote: product.hasRemote || false,
      isDimmable: product.isDimmable || false,
      hasColorChange: product.hasColorChange || false,
      article: product.article || "",
      brandCountry: product.brandCountry || "",
      manufacturerCountry: product.manufacturerCountry || "",
      collection: product.collection || "",
      style: product.style || "",
      lampType: product.lampType || "",
      socketType: product.socketType || "",
      bulbType: product.bulbType || "",
      lampCount: product.lampCount || 0,
      lampPower: product.lampPower || 0,
      totalPower: product.totalPower || 0,
      lightingArea: product.lightingArea || 0,
      voltage: product.voltage || 220,
      color: product.color || "",
      height: product.height || 0,
      diameter: product.diameter || 0,
      length: product.length || 0,
      width: product.width || 0,
      depth: product.depth || 0,
      chainLength: product.chainLength || 0,
      images: product.images || [],
      assemblyInstructionUrl: product.assemblyInstructionUrl || "",
      materials: product.materials || "",
      frameMaterial: product.frameMaterial || "",
      shadeMaterial: product.shadeMaterial || "",
      frameColor: product.frameColor || "",
      shadeColor: product.shadeColor || "",
      shadeDirection: product.shadeDirection || "",
      diffuserType: product.diffuserType || "",
      diffuserShape: product.diffuserShape || "",
      ipRating: product.ipRating || "",
      interior: product.interior || "",
      place: product.place || "",
      suspendedCeiling: product.suspendedCeiling || false,
      mountType: product.mountType || "",
      officialWarranty: product.officialWarranty || "",
      shopWarranty: product.shopWarranty || "",
      section: product.section || "",
      catalog: product.catalog || "",
      subcategory: product.subcategory || "",
    });
    setIsNewProduct(false);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      price: 0,
      image: "",
      brand: "",
      rating: 5,
      reviews: 0,
      inStock: true,
      type: "chandelier",
      description: "",
      hasRemote: false,
      isDimmable: false,
      hasColorChange: false,
      article: "",
      brandCountry: "",
      manufacturerCountry: "",
      collection: "",
      style: "",
      lampType: "",
      socketType: "",
      bulbType: "",
      lampCount: 0,
      lampPower: 0,
      totalPower: 0,
      lightingArea: 0,
      voltage: 220,
      color: "",
      height: 0,
      diameter: 0,
      length: 0,
      width: 0,
      depth: 0,
      chainLength: 0,
      images: [],
    });
    setIsNewProduct(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (isNewProduct) {
        await api.createProduct(formData);
        toast({
          title: "Успешно",
          description: "Товар создан",
        });
      } else if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
        toast({
          title: "Успешно",
          description: "Товар обновлён",
        });
      }
      setIsDialogOpen(false);
      loadProducts();
    } catch (error) {
      console.error("Save error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      const action = isNewProduct ? "создать" : "обновить";
      toast({
        title: `Не удалось ${action} товар`,
        description: `${errorMessage}. Проверьте заполнение обязательных полей (название, цена, бренд, тип).`,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить этот товар?")) return;

    setDeletingProducts((prev) => [...prev, id]);
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: "Успешно",
        description: "Товар удалён",
      });
      await loadProducts();
    } catch (error) {
      console.error("Delete product error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      toast({
        title: "Не удалось удалить товар",
        description: `${errorMessage}. Попробуйте ещё раз или обновите страницу.`,
        variant: "destructive",
        duration: 5000,
      });
      await loadProducts();
    } finally {
      setDeletingProducts((prev) => prev.filter((pid) => pid !== id));
    }
  };

  const handleMarkAllInStock = async () => {
    if (!confirm('Отметить ВСЕ товары как "в наличии"?')) return;

    setUpdatingStock(true);
    try {
      const allProductIds = products.map((p) => p.id);

      for (const id of allProductIds) {
        await api.updateProduct(id, { inStock: true });
      }

      toast({
        title: "Успешно",
        description: `Обновлено товаров: ${allProductIds.length}`,
      });

      await loadProducts();
    } catch (error) {
      console.error("Update stock error:", error);
      toast({
        title: "Ошибка обновления",
        description:
          error instanceof Error ? error.message : "Неизвестная ошибка",
        variant: "destructive",
      });
    } finally {
      setUpdatingStock(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!confirm(`Удалить ${selectedProducts.length} товаров?`)) return;

    setDeletingProducts((prev) => [...prev, ...selectedProducts]);
    try {
      await api.deleteProducts(selectedProducts);
      setProducts((prev) =>
        prev.filter((p) => !selectedProducts.includes(p.id)),
      );
      setSelectedProducts([]);
      toast({
        title: "Успешно",
        description: `Удалено товаров: ${selectedProducts.length}`,
      });
      await loadProducts();
    } catch (error) {
      console.error("Bulk delete error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      toast({
        title: "Не удалось удалить товары",
        description: `${errorMessage}. Возможно, некоторые товары были удалены. Обновите страницу.`,
        variant: "destructive",
        duration: 5000,
      });
      await loadProducts();
    } finally {
      setDeletingProducts([]);
    }
  };

  const toggleProductSelection = (id: number) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
  };

  const processJsonData = async (jsonData: any[]) => {
    let successCount = 0;
    let errorCount = 0;

    for (const row of jsonData) {
      try {
        const parsePrice = (priceStr: any): number => {
          if (typeof priceStr === "number") return priceStr;
          const cleaned = String(priceStr).replace(/[^\d.]/g, "");
          return Number(cleaned) || 0;
        };

        const parseBool = (val: any): boolean => {
          if (typeof val === "boolean") return val;
          return val === "Да" || val === "да" || val === "true" || val === true;
        };

        const parseInt = (val: any): number | undefined => {
          if (!val) return undefined;
          const num = Number(String(val).replace(/[^\d]/g, ""));
          return isNaN(num) ? undefined : num;
        };

        const productData = {
          name: row["Название"] || row["name"] || "",
          description: row["Описание"] || row["description"] || "",
          price: parsePrice(row["Цена"] || row["price"]),
          brand: row["Бренд"] || row["brand"] || "",
          type: row["Тип"] || row["type"] || "люстра",
          image: row["Изображение"] || row["image"] || "",
          inStock: parseBool(row["В наличии"] || row["inStock"]),
          rating: Number(row["Рейтинг"] || row["rating"] || 5),
          reviews: parseInt(row["Отзывы"] || row["reviews"]) || 0,

          article: row["article"] || row["Артикул"],
          brandCountry: row["brand_country"] || row["Страна бренда"],
          manufacturerCountry: row["manufacture_country"] || row["Страна производства"],
          collection: row["collection"] || row["Коллекция"],
          style: row["style"] || row["Стиль"],

          height: parseInt(row["height_mm"] || row["Высота"]),
          diameter: parseInt(row["diameter_mm"] || row["Диаметр"]),

          socketType: row["socket"] || row["Цоколь"],
          lampType: row["lamp_type"] || row["Тип лампы"],
          lampCount: parseInt(row["lamps_count"] || row["Количество ламп"]),
          lampPower: parseInt(row["lamp_power_w"] || row["Мощность лампы"]),
          totalPower: parseInt(row["total_power_w"] || row["Общая мощность"]),
          lightingArea: parseInt(row["light_area_m2"] || row["Площадь освещения"]),
          voltage: parseInt(row["voltage_v"] || row["Напряжение"]),

          materials: row["materials"] || row["Материалы"],
          frameMaterial: row["frame_material"] || row["Материал каркаса"],
          shadeMaterial: row["shade_material"] || row["Материал плафона"],
          color: row["color"] || row["Цвет"],
          frameColor: row["frame_color"] || row["Цвет каркаса"],
          shadeColor: row["shade_color"] || row["Цвет плафона"],

          shadeDirection: row["shade_direction"] || row["Направление плафонов"],
          diffuserType: row["diffuser_type"] || row["Тип рассеивателя"],
          diffuserShape: row["diffuser_shape"] || row["Форма рассеивателя"],

          ipRating: row["ip_rating"] || row["Степень защиты"],
          interior: row["interior"] || row["Интерьер"],
          place: row["place"] || row["Место установки"],
          suspendedCeiling: parseBool(row["suspended_ceiling"] || row["Натяжной потолок"]),
          mountType: row["mount_type"] || row["Тип крепления"],

          officialWarranty: row["official_warranty"] || row["Официальная гарантия"],
          shopWarranty: row["shop_warranty"] || row["Гарантия магазина"],

          section: row["section"] || row["Раздел"],
          catalog: row["catalog"] || row["Каталог"],
          subcategory: row["subcategory"] || row["Подкатегория"],
        };

        if (!productData.name || !productData.price || !productData.brand) {
          errorCount++;
          continue;
        }

        await api.createProduct(productData);
        successCount++;
      } catch (err) {
        errorCount++;
      }
    }

    return { successCount, errorCount };
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validExtensions = [".xlsx", ".xls", ".csv", ".json", ".zip"];
    const fileArray = Array.from(files);

    // Проверка всех файлов
    const invalidFiles = fileArray.filter((file) => {
      const fileExtension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();
      return !validExtensions.includes(fileExtension);
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "Ошибка",
        description: `Неподдерживаемые файлы: ${invalidFiles.map((f) => f.name).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setUploadingBulk(true);

    let totalSuccessCount = 0;
    let totalErrorCount = 0;
    let processedFiles = 0;

    // Обработка каждого файла
    for (const file of fileArray) {
      try {
        const fileExtension = file.name
          .substring(file.name.lastIndexOf("."))
          .toLowerCase();
        
        // Обработка ZIP архивов
        if (fileExtension === ".zip") {
          const zipData = await readFileAsync(file, fileExtension);
          const zip = await JSZip.loadAsync(zipData as ArrayBuffer);
          
          // Извлекаем все JSON файлы из архива
          const jsonFiles = Object.keys(zip.files).filter(name => 
            name.toLowerCase().endsWith('.json') && !zip.files[name].dir
          );
          
          for (const jsonFileName of jsonFiles) {
            try {
              const jsonContent = await zip.files[jsonFileName].async('text');
              const parsedData = JSON.parse(jsonContent);
              const jsonData = Array.isArray(parsedData) ? parsedData : [parsedData];
              
              const result = await processJsonData(jsonData);
              totalSuccessCount += result.successCount;
              totalErrorCount += result.errorCount;
              
              toast({
                title: `Обработан файл из архива: ${jsonFileName}`,
                description: `Добавлено: ${result.successCount}, ошибок: ${result.errorCount}`,
                duration: 2000,
              });
            } catch (err) {
              console.error(`Error processing ${jsonFileName}:`, err);
              totalErrorCount++;
            }
          }
          
          processedFiles++;
          continue;
        }
        
        const data = await readFileAsync(file, fileExtension);
        let jsonData: any[];

        if (fileExtension === ".json") {
          const parsedData = JSON.parse(data as string);
          jsonData = Array.isArray(parsedData) ? parsedData : [parsedData];
        } else {
          let workbook: XLSX.WorkBook;

          if (fileExtension === ".csv") {
            workbook = XLSX.read(data, { type: "binary" });
          } else {
            workbook = XLSX.read(data, { type: "array" });
          }

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        }

        if (jsonData.length === 0) {
          processedFiles++;
          continue;
        }

        const result = await processJsonData(jsonData);
        totalSuccessCount += result.successCount;
        totalErrorCount += result.errorCount;
        processedFiles++;

        // Обновить прогресс после каждого файла
        if (processedFiles < fileArray.length) {
          toast({
            title: `Обработано файлов: ${processedFiles}/${fileArray.length}`,
            description: `Текущий файл: +${result.successCount} товаров`,
            duration: 2000,
          });
        }
      } catch (error) {
        processedFiles++;
        console.error(`Ошибка обработки файла ${file.name}:`, error);
      }
    }

    // Финальное уведомление
    toast({
      title: "Загрузка завершена",
      description: `Файлов: ${processedFiles}/${fileArray.length} | Товаров: ${totalSuccessCount} | Ошибок: ${totalErrorCount}`,
      duration: 5000,
    });

    setUploadingBulk(false);
    loadProducts();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Вспомогательная функция для чтения файла
  const readFileAsync = (
    file: File,
    fileExtension: string,
  ): Promise<string | ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result);
        } else {
          reject(new Error("Не удалось прочитать файл"));
        }
      };

      reader.onerror = () => reject(new Error("Ошибка чтения файла"));

      if (fileExtension === ".json") {
        reader.readAsText(file);
      } else if (fileExtension === ".csv") {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const downloadTemplate = () => {
    const template = [
      {
        Название: "Пример: Люстра Crystal",
        Описание: "Роскошный светильник из хрусталя",
        Цена: 45000,
        Бренд: "LuxCrystal",
        Тип: "chandelier",
        Изображение: "https://example.com/image.jpg",
        "В наличии": true,
        Рейтинг: 5.0,
        Отзывы: 12,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Товары");
    XLSX.writeFile(wb, "template_products.xlsx");
  };

  const downloadJsonTemplate = () => {
    const template = [
      {
        name: "Подвесная люстра Eglo Basildon 43463",
        description:
          "Люстра, подходящая для современных интерьеров, с стильным дизайном и функциональностью.",
        price: "14790 RUB",
        brand: "Eglo",
        type: "люстра",
        image:
          "https://www.vamsvet.ru/upload/iblock/8fb/vamsvet-podvesnaya-lyustra-eglo-basildon-43463.jpeg",
        inStock: "Да",
        rating: "4.5",
        reviews: "120",
        article: "43463",
        brand_country: "Австрия",
        manufacture_country: "Китай",
        collection: "Basildon",
        style: "Современный",
        height_mm: "1000",
        diameter_mm: "600",
        socket: "E27",
        lamp_type: "LED",
        lamps_count: "3",
        lamp_power_w: "10",
        total_power_w: "30",
        light_area_m2: "20",
        voltage_v: "220",
        materials: "Металл, стекло",
        frame_material: "Металл",
        shade_material: "Стекло",
        shade_direction: "Ниже",
        diffuser_type: "Плоский",
        diffuser_shape: "Круглый",
        color: "Черный",
        frame_color: "Черный",
        shade_color: "Прозрачный",
        ip_rating: "IP20",
        interior: "Гостиная, Спальня",
        place: "На потолке",
        suspended_ceiling: "Да",
        mount_type: "Подвесной",
        official_warranty: "2 года",
        shop_warranty: "1 год",
        section: "Люстры",
        catalog: "Освещение",
        subcategory: "Подвесные люстры",
      },
    ];

    const jsonStr = JSON.stringify(template, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_products.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportProducts = () => {
    if (products.length === 0) {
      toast({
        title: "Нет данных",
        description: "Нет товаров для экспорта",
        variant: "destructive",
      });
      return;
    }

    const exportData = products.map((product) => ({
      ID: product.id,
      Название: product.name,
      Описание: product.description || "",
      Цена: product.price,
      Бренд: product.brand,
      Тип: product.type,
      Изображение: product.image,
      "В наличии": product.inStock ? "Да" : "Нет",
      Рейтинг: product.rating,
      Отзывы: product.reviews,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Товары");

    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `products_export_${date}.xlsx`);

    toast({
      title: "Успешно",
      description: `Экспортировано ${products.length} товаров`,
    });
  };

  const handleImportFromUrls = async () => {
    if (!importUrls.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите хотя бы одну ссылку на товар",
        variant: "destructive",
      });
      return;
    }

    const urls = importUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0 && url.startsWith("http"));

    if (urls.length === 0) {
      toast({
        title: "Ошибка",
        description: "Нет корректных ссылок для импорта",
        variant: "destructive",
      });
      return;
    }

    setImportingProducts(true);

    try {
      const result = await api.importProducts(urls);

      toast({
        title: "Импорт завершен",
        description: `Импортировано: ${result.imported}, Ошибок: ${result.failed}`,
      });

      if (result.failed > 0 && result.failed_urls.length > 0) {
        console.log("Failed URLs:", result.failed_urls);
      }

      setShowImportDialog(false);
      setImportUrls("");
      loadProducts();
    } catch (error) {
      toast({
        title: "Ошибка импорта",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось импортировать товары",
        variant: "destructive",
      });
    } finally {
      setImportingProducts(false);
    }
  };

  // Removed static types array - now using dynamic types from products
  const _removedTypes = [
    { value: "chandelier", label: "Люстра" },
    { value: "ceiling_chandelier", label: "Потолочная люстра" },
    { value: "pendant_chandelier", label: "Подвесная люстра" },
    { value: "cascade", label: "Каскадная" },
    { value: "rod", label: "На штанге" },
    { value: "large", label: "Большая люстра" },
    { value: "fan_chandelier", label: "Люстра-вентилятор" },
    { value: "elite_chandelier", label: "Элитная люстра" },

    { value: "light_pendant", label: "Подвесной светильник" },
    { value: "light_ceiling", label: "Потолочный светильник" },
    { value: "light_wall", label: "Настенный светильник" },
    { value: "light_wall_ceiling", label: "Настенно-потолочный" },
    { value: "light_surface", label: "Накладной светильник" },
    { value: "light_recessed", label: "Встраиваемый светильник" },
    { value: "light_spot", label: "Точечный светильник" },
    { value: "light_night", label: "Ночник" },
    { value: "light_furniture", label: "Мебельный" },
    { value: "light_plant", label: "Для растений" },
    { value: "light_bactericidal", label: "Бактерицидный" },
    { value: "light_kit", label: "Комплект светильников" },
    { value: "light_elite", label: "Элитный светильник" },

    { value: "lamp_decorative", label: "Декоративная лампа" },
    { value: "lamp_office", label: "Офисная лампа" },
    { value: "lamp_kids", label: "Детская лампа" },
    { value: "lamp_clip", label: "Лампа на прищепке" },
    { value: "lamp_clamp", label: "Лампа на струбцине" },

    { value: "sconce", label: "Бра" },

    { value: "spot_one", label: "Спот с 1 плафоном" },
    { value: "spot_two", label: "Спот с 2 плафонами" },
    { value: "spot_three_plus", label: "Спот с 3+ плафонами" },
    { value: "spot_recessed", label: "Встраиваемый спот" },
    { value: "spot_surface", label: "Накладной спот" },

    { value: "outdoor_street", label: "Уличный светильник" },
    { value: "outdoor_landscape", label: "Ландшафтный" },
    { value: "outdoor_architectural", label: "Архитектурный" },
    { value: "outdoor_park", label: "Парковый" },
    { value: "outdoor_wall", label: "Уличный настенный" },
    { value: "outdoor_console", label: "Консольный" },
    { value: "outdoor_ground", label: "Грунтовый" },
    { value: "outdoor_underwater", label: "Подводный" },
    { value: "outdoor_solar", label: "На солнечных батареях" },
    { value: "outdoor_floodlight", label: "Прожектор" },
    { value: "outdoor_flashlight", label: "Фонарик" },

    { value: "track_complete", label: "Трековая система в сборе" },
    { value: "track_light", label: "Трековый светильник" },
    { value: "track_string", label: "Струнный светильник" },
    { value: "track_rail", label: "Шинопровод" },
    { value: "track_accessories", label: "Комплектующие трековых" },

    { value: "electric_switch", label: "Выключатель" },
    { value: "electric_socket", label: "Розетка" },
    { value: "electric_frame", label: "Рамка" },
    { value: "electric_thermostat", label: "Терморегулятор" },
    { value: "electric_kit", label: "Комплект электрики" },
    { value: "electric_stabilizer", label: "Стабилизатор" },
    { value: "electric_transformer", label: "Трансформатор" },
    { value: "electric_motion", label: "Датчик движения" },
    { value: "electric_extension", label: "Удлинитель/фильтр" },
    { value: "electric_cord", label: "Шнур" },
    { value: "electric_accessories", label: "Комплектующие для ЭУИ" },
    { value: "electric_doorbell", label: "Звонок" },
    { value: "electric_dimmer", label: "Диммер" },
    { value: "electric_fan", label: "Вентилятор" },
    { value: "electric_breaker", label: "Автоматический выключатель" },
    { value: "electric_ammeter", label: "Амперметр" },
    { value: "electric_video_doorbell", label: "Видеозвонок" },

    { value: "floor_lamp", label: "Торшер" },
  ];

  const brands = Array.from(new Set(products.map((p) => p.brand))).sort();
  const productTypes = Array.from(
    new Set(products.map((p) => p.type).filter((t) => t)),
  ).sort();

  const filteredProducts = products;

  const stats = {
    totalProducts: products.length,
    inStock: products.filter((p) => p.inStock).length,
    outOfStock: products.filter((p) => !p.inStock).length,
    totalValue: products.reduce((sum, p) => sum + p.price, 0),
    averagePrice:
      products.length > 0
        ? products.reduce((sum, p) => sum + p.price, 0) / products.length
        : 0,
    averageRating:
      products.length > 0
        ? products.reduce((sum, p) => sum + p.rating, 0) / products.length
        : 0,
    totalReviews: products.reduce((sum, p) => sum + p.reviews, 0),
  };

  const topProducts = [...products]
    .sort((a, b) => b.rating * b.reviews - a.rating * a.reviews)
    .slice(0, 5);

  const brandStats = brands
    .map((brand) => ({
      brand,
      count: products.filter((p) => p.brand === brand).length,
      totalValue: products
        .filter((p) => p.brand === brand)
        .reduce((sum, p) => sum + p.price, 0),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const typeStats = productTypes
    .map((type) => ({
      type: type,
      count: products.filter((p) => p.type === type).length,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Панель управления</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadTemplate}>
                <Icon name="Download" className="mr-2 h-4 w-4" />
                Шаблон Excel
              </Button>
              <Button variant="outline" onClick={downloadJsonTemplate}>
                <Icon name="FileJson" className="mr-2 h-4 w-4" />
                Шаблон JSON
              </Button>
              <Button variant="outline" onClick={exportProducts}>
                <Icon name="FileDown" className="mr-2 h-4 w-4" />
                Экспорт
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingBulk}
                title="Поддерживаются: Excel (.xlsx, .xls), CSV (.csv), JSON (.json) и ZIP архивы с JSON файлами"
              >
                {uploadingBulk ? (
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icon name="FileSpreadsheet" className="mr-2 h-4 w-4" />
                )}
                Импорт файлов
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(true)}
              >
                <Icon name="Globe" className="mr-2 h-4 w-4" />
                Импорт с сайтов
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.json,.zip"
                className="hidden"
                onChange={handleBulkUpload}
                multiple
              />
              <Button
                variant="outline"
                onClick={handleMarkAllInStock}
                disabled={updatingStock}
              >
                {updatingStock ? (
                  <>
                    <Icon
                      name="Loader2"
                      className="mr-2 h-4 w-4 animate-spin"
                    />
                    Обновление...
                  </>
                ) : (
                  <>
                    <Icon name="CheckCircle" className="mr-2 h-4 w-4" />
                    Все в наличии
                  </>
                )}
              </Button>
              {selectedProducts.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={deletingProducts.length > 0}
                >
                  {deletingProducts.length > 0 ? (
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
                      Удалить ({selectedProducts.length})
                    </>
                  )}
                </Button>
              )}
              <Button onClick={handleCreate}>
                <Icon name="Plus" className="mr-2 h-4 w-4" />
                Добавить
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Всего товаров
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {stats.totalProducts}
                  </div>
                  <Icon
                    name="Package"
                    className="h-8 w-8 text-muted-foreground"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  В наличии: {stats.inStock} | Нет: {stats.outOfStock}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Общая стоимость
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {(stats.totalValue / 1000000).toFixed(1)}М
                  </div>
                  <Icon
                    name="DollarSign"
                    className="h-8 w-8 text-muted-foreground"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Средняя цена:{" "}
                  {stats.averagePrice.toLocaleString("ru-RU", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  ₽
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Средний рейтинг
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <Icon name="Star" className="h-8 w-8 text-yellow-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Всего отзывов: {stats.totalReviews}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Топ бренд
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {brandStats[0]?.brand || "-"}
                  </div>
                  <Icon
                    name="Award"
                    className="h-8 w-8 text-muted-foreground"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {brandStats[0]?.count || 0} товаров
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Топ-5 товаров по рейтингу</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {index + 1}
                      </div>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Icon
                              name="Star"
                              className="h-3 w-3 fill-yellow-400 text-yellow-400"
                            />
                            {product.rating}
                          </span>
                          <span>({product.reviews} отзывов)</span>
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        {product.price.toLocaleString()} ₽
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Товары по типам</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {typeStats.map((stat) => (
                      <div
                        key={stat.type}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{stat.type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${(stat.count / stats.totalProducts) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">
                            {stat.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Топ-5 брендов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {brandStats.map((stat) => (
                      <div
                        key={stat.brand}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium">
                          {stat.brand}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {(stat.totalValue / 1000).toFixed(0)}K ₽
                          </span>
                          <span className="text-sm font-medium">
                            {stat.count} шт
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

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
                Показано: {products.length} из {totalProducts} товаров (страница {currentPage})
              </p>
              {(searchQuery ||
                filterBrand !== "all" ||
                filterType !== "all" ||
                filterStock !== "all") && (
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
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">
              Товары ({totalProducts})
            </TabsTrigger>
            <TabsTrigger value="orders">Заказы ({orders.length})</TabsTrigger>
            <TabsTrigger value="partners">Партнёры ({partnerApplications.length})</TabsTrigger>
            <TabsTrigger value="chat">Чат</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="mb-4">
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                <Icon
                  name={
                    selectedProducts.length === filteredProducts.length
                      ? "CheckSquare"
                      : "Square"
                  }
                  className="mr-2 h-4 w-4"
                />
                {selectedProducts.length === filteredProducts.length
                  ? "Снять выделение"
                  : "Выбрать все"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className={
                    selectedProducts.includes(product.id)
                      ? "ring-2 ring-primary"
                      : ""
                  }
                >
                  <CardHeader className="relative">
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="w-5 h-5 cursor-pointer"
                      />
                    </div>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Бренд:</span>{" "}
                        {product.brand}
                      </p>
                      {product.article && (
                        <p>
                          <span className="font-medium">Артикул:</span>{" "}
                          {product.article}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Цена:</span>{" "}
                        {product.price.toLocaleString()} ₽
                      </p>
                      <p>
                        <span className="font-medium">Тип:</span> {product.type}
                      </p>
                      {product.collection && (
                        <p>
                          <span className="font-medium">Коллекция:</span>{" "}
                          {product.collection}
                        </p>
                      )}
                      {product.style && (
                        <p>
                          <span className="font-medium">Стиль:</span>{" "}
                          {product.style}
                        </p>
                      )}
                      {product.color && (
                        <p>
                          <span className="font-medium">Цвет:</span>{" "}
                          {product.color}
                        </p>
                      )}
                      {product.lampCount && (
                        <p>
                          <span className="font-medium">Лампы:</span>{" "}
                          {product.lampCount} шт × {product.lampPower}W
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Рейтинг:</span>{" "}
                        {product.rating} ⭐
                      </p>
                      <p>
                        <span className="font-medium">Наличие:</span>{" "}
                        {product.inStock ? "✅ В наличии" : "❌ Нет"}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEdit(product)}
                      >
                        <Icon name="Pencil" className="mr-2 h-4 w-4" />
                        Изменить
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDelete(product.id)}
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
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <Icon name="ChevronLeft" className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Страница {currentPage} из {Math.ceil(totalProducts / itemsPerPage)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({totalProducts} товаров)
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalProducts / itemsPerPage), p + 1))}
                  disabled={currentPage >= Math.ceil(totalProducts / itemsPerPage)}
                >
                  <Icon name="ChevronRight" className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Список заказов</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">
                    <Icon
                      name="Loader2"
                      className="h-8 w-8 animate-spin mx-auto"
                    />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Заказов пока нет
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                Заказ №{order.id}
                              </span>
                              <Badge
                                variant={
                                  order.status === "completed"
                                    ? "default"
                                    : order.status === "pending"
                                      ? "secondary"
                                      : order.status === "processing"
                                        ? "outline"
                                        : "destructive"
                                }
                              >
                                {order.status === "pending"
                                  ? "Ожидает"
                                  : order.status === "processing"
                                    ? "В обработке"
                                    : order.status === "completed"
                                      ? "Выполнен"
                                      : "Отменён"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>
                                <Icon
                                  name="User"
                                  className="inline h-3 w-3 mr-1"
                                />
                                {order.customer_name}
                              </div>
                              <div>
                                <Icon
                                  name="Mail"
                                  className="inline h-3 w-3 mr-1"
                                />
                                {order.customer_email}
                              </div>
                              <div>
                                <Icon
                                  name="Phone"
                                  className="inline h-3 w-3 mr-1"
                                />
                                {order.customer_phone}
                              </div>
                              <div>
                                <Icon
                                  name="MapPin"
                                  className="inline h-3 w-3 mr-1"
                                />
                                {order.customer_address}
                              </div>
                              <div>
                                <Icon
                                  name="Calendar"
                                  className="inline h-3 w-3 mr-1"
                                />
                                {new Date(order.created_at).toLocaleString(
                                  "ru-RU",
                                )}
                              </div>
                            </div>
                            <div className="text-lg font-bold text-primary">
                              {order.total_amount.toLocaleString("ru-RU")} ₽
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <div className="space-y-1">
                              <Label htmlFor={`tracking-${order.id}`} className="text-xs">
                                Трек-номер
                              </Label>
                              <div className="flex gap-1">
                                <Input
                                  id={`tracking-${order.id}`}
                                  placeholder="Введите трек-номер"
                                  defaultValue={order.tracking_number || ""}
                                  className="h-8 text-sm"
                                  onBlur={(e) => {
                                    const value = e.target.value.trim();
                                    if (value !== (order.tracking_number || "")) {
                                      updateOrderTracking(order.id, value);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      const value = (e.target as HTMLInputElement).value.trim();
                                      if (value !== (order.tracking_number || "")) {
                                        updateOrderTracking(order.id, value);
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewOrderDetails(order.id)}
                            >
                              <Icon name="Eye" className="h-4 w-4 mr-1" />
                              Детали
                            </Button>
                            <Select
                              value={order.status}
                              onValueChange={(status) =>
                                updateOrderStatus(order.id, status)
                              }
                            >
                              <SelectTrigger className="w-full h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Ожидает</SelectItem>
                                <SelectItem value="processing">
                                  В обработке
                                </SelectItem>
                                <SelectItem value="completed">
                                  Выполнен
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  Отменён
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partners">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Заявки партнёров</CardTitle>
                  <div className="w-48">
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Все категории" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все категории</SelectItem>
                        <SelectItem value="designer">Дизайнеры</SelectItem>
                        <SelectItem value="builder">Строители</SelectItem>
                        <SelectItem value="ceiling">Потолочники</SelectItem>
                        <SelectItem value="wholesale">Оптовики</SelectItem>
                        <SelectItem value="supplier">Поставщики</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {partnersLoading ? (
                  <div className="text-center py-8">
                    <Icon name="Loader2" className="h-8 w-8 animate-spin mx-auto" />
                  </div>
                ) : partnerApplications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Заявок от партнёров пока нет
                  </div>
                ) : (
                  <div className="space-y-4">
                    {partnerApplications
                      .filter(app => filterCategory === 'all' || app.category === filterCategory)
                      .map((app) => (
                      <Card key={app.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">{app.name}</span>
                              <Badge variant="outline">
                                {app.category === 'designer' ? 'Дизайнер' :
                                 app.category === 'builder' ? 'Строитель' :
                                 app.category === 'ceiling' ? 'Потолочник' :
                                 app.category === 'wholesale' ? 'Оптовик' :
                                 'Поставщик'}
                              </Badge>
                              <Badge variant={app.status === 'new' ? 'secondary' : 'default'}>
                                {app.status === 'new' ? 'Новая' : app.status}
                              </Badge>
                            </div>
                            
                            {app.organization && (
                              <div className="text-sm">
                                <Icon name="Building2" className="inline h-3 w-3 mr-1 text-muted-foreground" />
                                <span className="font-medium">{app.organization}</span>
                              </div>
                            )}
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>
                                <Icon name="Phone" className="inline h-3 w-3 mr-1" />
                                <a href={`tel:${app.phone}`} className="hover:text-primary">
                                  {app.phone}
                                </a>
                              </div>
                              <div>
                                <Icon name="Mail" className="inline h-3 w-3 mr-1" />
                                <a href={`mailto:${app.email}`} className="hover:text-primary">
                                  {app.email}
                                </a>
                              </div>
                              <div>
                                <Icon name="Calendar" className="inline h-3 w-3 mr-1" />
                                {new Date(app.created_at).toLocaleString('ru-RU')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <ChatTab />
          </TabsContent>
        </Tabs>

        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Детали заказа №{selectedOrder?.id}</DialogTitle>
              <DialogDescription>Информация о заказе и товарах</DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Клиент</Label>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">
                      {selectedOrder.customer_email}
                    </p>
                  </div>
                  <div>
                    <Label>Телефон</Label>
                    <p className="font-medium">
                      {selectedOrder.customer_phone}
                    </p>
                  </div>
                  <div>
                    <Label>Статус</Label>
                    <Badge>{selectedOrder.status}</Badge>
                  </div>
                  <div className="col-span-2">
                    <Label>Адрес доставки</Label>
                    <p className="font-medium">
                      {selectedOrder.customer_address}
                    </p>
                  </div>
                  <div>
                    <Label>Дата заказа</Label>
                    <p className="font-medium">
                      {new Date(selectedOrder.created_at).toLocaleString(
                        "ru-RU",
                      )}
                    </p>
                  </div>
                  <div>
                    <Label>Способ оплаты</Label>
                    <p className="font-medium">
                      {selectedOrder.payment_method === "card"
                        ? "Карта"
                        : "Наличные"}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Товары
                  </Label>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 p-3 border rounded-lg"
                      >
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Количество: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-primary">
                            {item.price.toLocaleString("ru-RU")} ₽
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Итого:</span>
                    <span className="text-primary">
                      {selectedOrder.total_amount.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                </div>

                <DialogFooter className="mt-6 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowOrderDialog(false)}
                  >
                    Закрыть
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteOrder(selectedOrder.id)}
                  >
                    <Icon name="Trash2" className="h-4 w-4 mr-2" />
                    Удалить заказ
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewProduct ? "Добавить товар" : "Редактировать товар"}
            </DialogTitle>
            <DialogDescription>Заполните информацию о товаре</DialogDescription>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="text-red-500">*</span> — обязательные поля
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2">
                Название
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Название товара"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="flex items-center gap-2">
                  Цена (₽)
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    updateFormData({ price: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="brand" className="flex items-center gap-2">
                  Бренд
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) =>
                    updateFormData({ brand: e.target.value })
                  }
                  placeholder="Бренд"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="image">Изображение товара</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) =>
                      updateFormData({ image: e.target.value })
                    }
                    placeholder="https://... или загрузите файл"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingImage}
                    onClick={() =>
                      document.getElementById("image-upload")?.click()
                    }
                  >
                    {uploadingImage ? (
                      <Icon name="Loader2" className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon name="Upload" className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (!file.type.startsWith("image/")) {
                        toast({
                          title: "Ошибка",
                          description: "Выберите изображение",
                          variant: "destructive",
                        });
                        return;
                      }

                      setUploadingImage(true);

                      try {
                        const formDataUpload = new FormData();
                        formDataUpload.append("file", file);

                        const response = await fetch(
                          "https://api.poehali.dev/upload",
                          {
                            method: "POST",
                            body: formDataUpload,
                          },
                        );

                        if (!response.ok) throw new Error("Upload failed");

                        const data = await response.json();
                        setFormData((prev) => ({ ...prev, image: data.url }));

                        toast({
                          title: "Успешно",
                          description: "Изображение загружено",
                        });
                      } catch (error) {
                        toast({
                          title: "Ошибка",
                          description: "Не удалось загрузить изображение",
                          variant: "destructive",
                        });
                      } finally {
                        setUploadingImage(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </div>
                {formData.image && (
                  <img
                    src={formData.image}
                    alt="Предпросмотр"
                    className="w-full max-w-xs h-48 object-cover rounded-lg"
                  />
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="additional-images">
                Дополнительные изображения
              </Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="additional-images"
                    placeholder="https://... URL изображения"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        e.preventDefault();
                        setFormData((prev) => ({
                          ...prev,
                          images: [...prev.images, e.currentTarget.value],
                        }));
                        e.currentTarget.value = "";
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("additional-upload")?.click()
                    }
                  >
                    <Icon name="Upload" className="h-4 w-4" />
                  </Button>
                  <input
                    id="additional-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;

                      for (const file of files) {
                        if (!file.type.startsWith("image/")) continue;

                        try {
                          const formDataUpload = new FormData();
                          formDataUpload.append("file", file);

                          const response = await fetch(
                            "https://api.poehali.dev/upload",
                            {
                              method: "POST",
                              body: formDataUpload,
                            },
                          );

                          if (!response.ok) throw new Error("Upload failed");

                          const data = await response.json();
                          setFormData((prev) => ({
                            ...prev,
                            images: [...prev.images, data.url],
                          }));
                        } catch (error) {
                          console.error("Upload error:", error);
                        }
                      }

                      toast({
                        title: "Успешно",
                        description: `Загружено изображений: ${files.length}`,
                      });
                      e.target.value = "";
                    }}
                  />
                </div>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Доп ${idx + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              images: formData.images.filter(
                                (_, i) => i !== idx,
                              ),
                            });
                          }}
                        >
                          <Icon name="X" className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="type" className="flex items-center gap-2">
                Тип товара
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                placeholder="люстра, бра, торшер и т.д."
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Примеры: люстра, бра, торшер, светильник, лампа
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rating">Рейтинг</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({ ...formData, rating: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="reviews">Отзывы</Label>
                <Input
                  id="reviews"
                  type="number"
                  value={formData.reviews}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reviews: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex items-end">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.inStock}
                    onChange={(e) =>
                      setFormData({ ...formData, inStock: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  В наличии
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Подробное описание товара"
                rows={4}
              />
            </div>

            <div>
              <Label className="mb-3 block">Дополнительные возможности</Label>
              <div className="space-y-3">
                <Label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasRemote}
                    onChange={(e) =>
                      setFormData({ ...formData, hasRemote: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <Icon name="Radio" className="h-4 w-4 text-primary" />
                  <span>Пульт управления</span>
                </Label>
                <Label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDimmable}
                    onChange={(e) =>
                      setFormData({ ...formData, isDimmable: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <Icon name="Sun" className="h-4 w-4 text-orange-500" />
                  <span>Регулировка яркости (диммер)</span>
                </Label>
                <Label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasColorChange}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hasColorChange: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <Icon name="Palette" className="h-4 w-4 text-purple-500" />
                  <span>Смена цвета освещения</span>
                </Label>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="font-semibold text-lg mb-4">
                Технические характеристики
              </h3>

              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Основные
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="article">Артикул</Label>
                      <Input
                        id="article"
                        value={formData.article}
                        onChange={(e) =>
                          setFormData({ ...formData, article: e.target.value })
                        }
                        placeholder="85858"
                      />
                    </div>
                    <div>
                      <Label htmlFor="brandCountry">Страна бренда</Label>
                      <Input
                        id="brandCountry"
                        value={formData.brandCountry}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            brandCountry: e.target.value,
                          })
                        }
                        placeholder="Австрия"
                      />
                    </div>
                    <div>
                      <Label htmlFor="manufacturerCountry">
                        Страна производства
                      </Label>
                      <Input
                        id="manufacturerCountry"
                        value={formData.manufacturerCountry}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            manufacturerCountry: e.target.value,
                          })
                        }
                        placeholder="Китай"
                      />
                    </div>
                    <div>
                      <Label htmlFor="collection">Коллекция</Label>
                      <Input
                        id="collection"
                        value={formData.collection}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            collection: e.target.value,
                          })
                        }
                        placeholder="Marbella"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="style">Стиль</Label>
                      <Input
                        id="style"
                        value={formData.style}
                        onChange={(e) =>
                          setFormData({ ...formData, style: e.target.value })
                        }
                        placeholder="Классика"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Лампы
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="socketType">Тип цоколя</Label>
                      <Input
                        id="socketType"
                        value={formData.socketType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            socketType: e.target.value,
                          })
                        }
                        placeholder="E14"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bulbType">Тип лампочки (основной)</Label>
                      <Input
                        id="bulbType"
                        value={formData.bulbType}
                        onChange={(e) =>
                          setFormData({ ...formData, bulbType: e.target.value })
                        }
                        placeholder="Накаливания"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lampCount">Количество ламп</Label>
                      <Input
                        id="lampCount"
                        type="number"
                        value={formData.lampCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            lampCount: Number(e.target.value),
                          })
                        }
                        placeholder="3"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lampPower">Мощность лампы, W</Label>
                      <Input
                        id="lampPower"
                        type="number"
                        value={formData.lampPower}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            lampPower: Number(e.target.value),
                          })
                        }
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalPower">Общая мощность, W</Label>
                      <Input
                        id="totalPower"
                        type="number"
                        value={formData.totalPower}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            totalPower: Number(e.target.value),
                          })
                        }
                        placeholder="540"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lightingArea">
                        Площадь освещения, м²
                      </Label>
                      <Input
                        id="lightingArea"
                        type="number"
                        value={formData.lightingArea}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            lightingArea: Number(e.target.value),
                          })
                        }
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="voltage">Напряжение, V</Label>
                      <Input
                        id="voltage"
                        type="number"
                        value={formData.voltage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            voltage: Number(e.target.value),
                          })
                        }
                        placeholder="220"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Цвет и материал
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="materials">Вид материала</Label>
                      <Input
                        id="materials"
                        value={formData.materials}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            materials: e.target.value,
                          })
                        }
                        placeholder="Металл, стекло"
                      />
                    </div>
                    <div>
                      <Label htmlFor="frameMaterial">Материал арматуры</Label>
                      <Input
                        id="frameMaterial"
                        value={formData.frameMaterial}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            frameMaterial: e.target.value,
                          })
                        }
                        placeholder="Металл"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shadeMaterial">Материал плафонов</Label>
                      <Input
                        id="shadeMaterial"
                        value={formData.shadeMaterial}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shadeMaterial: e.target.value,
                          })
                        }
                        placeholder="Стекло"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shadeDirection">
                        Направление плафонов
                      </Label>
                      <Input
                        id="shadeDirection"
                        value={formData.shadeDirection}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shadeDirection: e.target.value,
                          })
                        }
                        placeholder="Ниже"
                      />
                    </div>
                    <div>
                      <Label htmlFor="diffuserType">Вид рассеивателя</Label>
                      <Input
                        id="diffuserType"
                        value={formData.diffuserType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            diffuserType: e.target.value,
                          })
                        }
                        placeholder="Плоский"
                      />
                    </div>
                    <div>
                      <Label htmlFor="diffuserShape">Форма рассеивателя</Label>
                      <Input
                        id="diffuserShape"
                        value={formData.diffuserShape}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            diffuserShape: e.target.value,
                          })
                        }
                        placeholder="Круглый"
                      />
                    </div>
                    <div>
                      <Label htmlFor="color">Цвет</Label>
                      <Input
                        id="color"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        placeholder="Бронза"
                      />
                    </div>
                    <div>
                      <Label htmlFor="frameColor">Цвет арматуры</Label>
                      <Input
                        id="frameColor"
                        value={formData.frameColor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            frameColor: e.target.value,
                          })
                        }
                        placeholder="Черный"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shadeColor">Цвет плафонов</Label>
                      <Input
                        id="shadeColor"
                        value={formData.shadeColor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shadeColor: e.target.value,
                          })
                        }
                        placeholder="Прозрачный"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Защита и размещение
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ipRating">Степень защиты (IP)</Label>
                      <Input
                        id="ipRating"
                        value={formData.ipRating}
                        onChange={(e) =>
                          setFormData({ ...formData, ipRating: e.target.value })
                        }
                        placeholder="IP20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="interior">Интерьер</Label>
                      <Input
                        id="interior"
                        value={formData.interior}
                        onChange={(e) =>
                          setFormData({ ...formData, interior: e.target.value })
                        }
                        placeholder="Гостиная, Спальня"
                      />
                    </div>
                    <div>
                      <Label htmlFor="place">Место установки</Label>
                      <Input
                        id="place"
                        value={formData.place}
                        onChange={(e) =>
                          setFormData({ ...formData, place: e.target.value })
                        }
                        placeholder="На потолке"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mountType">Тип крепления</Label>
                      <Input
                        id="mountType"
                        value={formData.mountType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mountType: e.target.value,
                          })
                        }
                        placeholder="Подвесной"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-8">
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.suspendedCeiling}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              suspendedCeiling: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        Натяжной потолок
                      </Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Гарантия
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="officialWarranty">
                        Официальная гарантия
                      </Label>
                      <Input
                        id="officialWarranty"
                        value={formData.officialWarranty}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            officialWarranty: e.target.value,
                          })
                        }
                        placeholder="2 года"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shopWarranty">Гарантия магазина</Label>
                      <Input
                        id="shopWarranty"
                        value={formData.shopWarranty}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shopWarranty: e.target.value,
                          })
                        }
                        placeholder="1 год"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Категоризация
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="section">Раздел</Label>
                      <Input
                        id="section"
                        value={formData.section}
                        onChange={(e) =>
                          setFormData({ ...formData, section: e.target.value })
                        }
                        placeholder="Люстры"
                      />
                    </div>
                    <div>
                      <Label htmlFor="catalog">Каталог</Label>
                      <Input
                        id="catalog"
                        value={formData.catalog}
                        onChange={(e) =>
                          setFormData({ ...formData, catalog: e.target.value })
                        }
                        placeholder="Освещение"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subcategory">Подкатегория</Label>
                      <Input
                        id="subcategory"
                        value={formData.subcategory}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            subcategory: e.target.value,
                          })
                        }
                        placeholder="Подвесные люстры"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Размеры (мм)
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="height">Высота</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.height}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            height: Number(e.target.value),
                          })
                        }
                        placeholder="1100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="diameter">Диаметр</Label>
                      <Input
                        id="diameter"
                        type="number"
                        value={formData.diameter}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            diameter: Number(e.target.value),
                          })
                        }
                        placeholder="740"
                      />
                    </div>
                    <div>
                      <Label htmlFor="length">Длина</Label>
                      <Input
                        id="length"
                        type="number"
                        value={formData.length}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            length: Number(e.target.value),
                          })
                        }
                        placeholder="800"
                      />
                    </div>
                    <div>
                      <Label htmlFor="width">Ширина</Label>
                      <Input
                        id="width"
                        type="number"
                        value={formData.width}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            width: Number(e.target.value),
                          })
                        }
                        placeholder="600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="depth">Глубина</Label>
                      <Input
                        id="depth"
                        type="number"
                        value={formData.depth}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            depth: Number(e.target.value),
                          })
                        }
                        placeholder="400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="chainLength">Длина цепи</Label>
                      <Input
                        id="chainLength"
                        type="number"
                        value={formData.chainLength}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            chainLength: Number(e.target.value),
                          })
                        }
                        placeholder="1000"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Инструкция по сборке
                  </Label>
                  <div>
                    <Label htmlFor="assemblyInstructionUrl">
                      Ссылка на PDF инструкцию
                    </Label>
                    <Input
                      id="assemblyInstructionUrl"
                      value={formData.assemblyInstructionUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          assemblyInstructionUrl: e.target.value,
                        })
                      }
                      placeholder="https://example.com/instruction.pdf"
                    />
                    {formData.assemblyInstructionUrl && (
                      <a
                        href={formData.assemblyInstructionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
                      >
                        <Icon name="ExternalLink" className="h-3 w-3" />
                        Открыть PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              <Icon name="Save" className="mr-2 h-4 w-4" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Импорт товаров с сайтов</DialogTitle>
            <DialogDescription>Введите URL-адреса товаров для массового импорта</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Ссылки на товары (по одной на строку)</Label>
              <Textarea
                value={importUrls}
                onChange={(e) => setImportUrls(e.target.value)}
                placeholder="https://example.com/product1&#10;https://example.com/product2&#10;https://example.com/product3"
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Вставьте ссылки на страницы товаров. Система автоматически
                извлечёт название, цену, бренд, описание и другие
                характеристики.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setImportUrls("");
              }}
              disabled={importingProducts}
            >
              Отмена
            </Button>
            <Button
              onClick={handleImportFromUrls}
              disabled={importingProducts || !importUrls.trim()}
            >
              {importingProducts ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Импортирую...
                </>
              ) : (
                <>
                  <Icon name="Download" className="mr-2 h-4 w-4" />
                  Импортировать
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Admin;