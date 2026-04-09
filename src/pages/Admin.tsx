import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { api, Product, Order } from "@/lib/api";
import ChatTab from "@/components/admin/ChatTab";
import BestDealsManager from "@/components/admin/BestDealsManager";
import DebugPanel, { LogEntry } from "@/components/admin/DebugPanel";
import ProductsManager from "@/components/admin/ProductsManager";
import OrdersManager from "@/components/admin/OrdersManager";
import PartnersManager from "@/components/admin/PartnersManager";
import ProductFormDialog from "@/components/admin/ProductFormDialog";
import { useCart } from "@/contexts/CartContext";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { totalItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
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
  const [debugLogs, setDebugLogs] = useState<LogEntry[]>([]);

  const addLog = (level: LogEntry["level"], category: string, message: string, details?: any) => {
    const log: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      level,
      category,
      message,
      details,
    };
    setDebugLogs((prev) => [...prev, log]);
    console.log(`[${level.toUpperCase()}] ${category}: ${message}`, details || "");
  };

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

      addLog("info", "Загрузка товаров", "Отправка запроса к API", filters);
      console.log('📡 API запрос админки с фильтрами:', filters);
      const data = await api.getProducts(filters);
      
      const loadTime = Date.now() - startTime;
      addLog("success", "Загрузка товаров", `Товары загружены: ${data.products.length} шт. за ${loadTime}мс`, {
        count: data.products.length,
        total: data.total,
        loadTime,
      });
      console.log(`✅ Товары админки загружены: ${data.products.length} шт. за ${loadTime}мс (всего: ${data.total})`);
      
      setProducts(data.products);
      setTotalProducts(data.total || 0);
    } catch (error) {
      console.error("Load products error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      addLog("error", "Загрузка товаров", errorMessage, {
        error: error instanceof Error ? error.stack : String(error),
      });
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
      const response = await fetch('https://functions.poehali.dev/38a8a7ad-125d-46b7-a060-acc1588fc679');
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
        `https://functions.poehali.dev/3ada9bb3-60ff-495f-a5f2-ddf20782173d?id=${orderId}`,
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
      await fetch(`https://functions.poehali.dev/3ada9bb3-60ff-495f-a5f2-ddf20782173d?id=${orderId}`, {
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
    setIsNewProduct(true);
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      addLog("warning", "Загрузка изображения", "Файл не выбран");
      return;
    }

    addLog("info", "Загрузка изображения", `Начало загрузки: ${file.name}`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileExtension: file.name.split('.').pop(),
    });

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (!file.type.startsWith("image/") || !allowedTypes.includes(file.type)) {
      addLog("error", "Загрузка изображения", "Неверный формат файла", {
        fileType: file.type,
        fileName: file.name,
        allowedTypes,
      });
      toast({
        title: "Ошибка формата",
        description: `Файл "${file.name}" имеет неподдерживаемый формат. Используйте JPG, PNG, GIF или WEBP`,
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (fileExtension && !allowedExtensions.includes(fileExtension)) {
      addLog("error", "Загрузка изображения", "Неверное расширение файла", {
        fileExtension,
        fileName: file.name,
        allowedExtensions,
      });
      toast({
        title: "Ошибка расширения",
        description: `Расширение "${fileExtension}" не поддерживается. Используйте .jpg, .png, .gif или .webp`,
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addLog("error", "Загрузка изображения", "Файл слишком большой", {
        fileSize: file.size,
        maxSize: 10 * 1024 * 1024,
      });
      toast({
        title: "Файл слишком большой",
        description: "Максимальный размер изображения: 10 МБ",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);

    try {
      addLog("info", "Загрузка изображения", "Конвертация в base64");

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      const base64String = base64Data.split(',')[1];

      addLog("info", "Загрузка изображения", "Отправка на сервер хранилища", {
        fileName: file.name,
        fileSize: file.size,
      });

      const uploadResponse = await fetch('https://functions.poehali.dev/379c3586-f78f-4670-a239-15957ea26d39', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          file: base64String,
          contentType: file.type,
        }),
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Ошибка загрузки: ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.cdnUrl || uploadResult.url;

      if (!imageUrl) {
        throw new Error('URL изображения не получен от сервера');
      }

      addLog("success", "Загрузка изображения", "Изображение успешно загружено", {
        url: imageUrl,
      });

      updateFormData({ image: imageUrl });

      toast({
        title: "Изображение загружено",
        description: "Изображение успешно загружено и добавлено к товару",
      });
    } catch (error) {
      console.error("Image upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      addLog("error", "Загрузка изображения", errorMessage, {
        error: error instanceof Error ? error.stack : String(error),
      });
      toast({
        title: "Ошибка загрузки изображения",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    try {
      const productData: any = {
        name: formData.name,
        price: formData.price,
        image: formData.image,
        brand: formData.brand,
        rating: formData.rating,
        reviews: formData.reviews,
        inStock: formData.inStock,
        type: formData.type,
        description: formData.description,
        hasRemote: formData.hasRemote,
        isDimmable: formData.isDimmable,
        hasColorChange: formData.hasColorChange,
        article: formData.article,
        brandCountry: formData.brandCountry,
        manufacturerCountry: formData.manufacturerCountry,
        collection: formData.collection,
        style: formData.style,
        lampType: formData.lampType,
        socketType: formData.socketType,
        bulbType: formData.bulbType,
        lampCount: formData.lampCount,
        lampPower: formData.lampPower,
        totalPower: formData.totalPower,
        lightingArea: formData.lightingArea,
        voltage: formData.voltage,
        color: formData.color,
        height: formData.height,
        diameter: formData.diameter,
        length: formData.length,
        width: formData.width,
        depth: formData.depth,
        chainLength: formData.chainLength,
        images: formData.images,
        assemblyInstructionUrl: formData.assemblyInstructionUrl,
        materials: formData.materials,
        frameMaterial: formData.frameMaterial,
        shadeMaterial: formData.shadeMaterial,
        frameColor: formData.frameColor,
        shadeColor: formData.shadeColor,
        shadeDirection: formData.shadeDirection,
        diffuserType: formData.diffuserType,
        diffuserShape: formData.diffuserShape,
        ipRating: formData.ipRating,
        interior: formData.interior,
        place: formData.place,
        suspendedCeiling: formData.suspendedCeiling,
        mountType: formData.mountType,
        officialWarranty: formData.officialWarranty,
        shopWarranty: formData.shopWarranty,
        section: formData.section,
        catalog: formData.catalog,
        subcategory: formData.subcategory,
      };

      if (isNewProduct) {
        await api.createProduct(productData);
        toast({
          title: "Товар создан",
        });
      } else if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData);
        toast({
          title: "Товар обновлён",
        });
      }

      setIsDialogOpen(false);
      await loadProducts();
    } catch (error) {
      console.error("Save product error:", error);
      toast({
        title: "Ошибка сохранения",
        description: error instanceof Error ? error.message : "Не удалось сохранить товар",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (ids: number[]) => {
    if (!confirm(`Удалить ${ids.length} товар(ов)?`)) return;

    setDeletingProducts(ids);
    try {
      await api.deleteProducts(ids);
      toast({
        title: "Товары удалены",
        description: `Удалено товаров: ${ids.length}`,
      });
      setSelectedProducts([]);
      await loadProducts();
    } catch (error) {
      toast({
        title: "Ошибка удаления",
        variant: "destructive",
      });
    } finally {
      setDeletingProducts([]);
    }
  };

  const handleUpdateStock = async (productId: number, inStock: boolean) => {
    try {
      await api.updateProduct(productId, { inStock });
      toast({
        title: "Наличие обновлено",
      });
      await loadProducts();
    } catch (error) {
      toast({
        title: "Ошибка обновления",
        variant: "destructive",
      });
    }
  };

  const handleImportProducts = async (urls: string) => {
    try {
      const urlList = urls
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      const response = await api.importProducts(urlList);

      toast({
        title: "Импорт завершён",
        description: `Успешно: ${response.imported}, Ошибки: ${response.errors}`,
      });

      await loadProducts();
    } catch (error) {
      toast({
        title: "Ошибка импорта",
        description: error instanceof Error ? error.message : "Не удалось импортировать товары",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartItemsCount={totalItems}
        onCartClick={() => navigate("/cart")}
        onAuthClick={() => {}}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Админ-панель</h1>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Товары</TabsTrigger>
            <TabsTrigger value="orders">Заказы</TabsTrigger>
            <TabsTrigger value="partners">Партнёры</TabsTrigger>
            <TabsTrigger value="best-deals">Best Deals</TabsTrigger>
            <TabsTrigger value="chat">Чат</TabsTrigger>
            <TabsTrigger value="debug">Отладка</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductsManager
              products={products}
              loading={loading}
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
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalProducts={totalProducts}
              itemsPerPage={itemsPerPage}
              onEdit={handleEdit}
              onCreate={handleCreate}
              onDelete={handleDelete}
              onUpdateStock={handleUpdateStock}
              onImportProducts={handleImportProducts}
              addLog={addLog}
              loadProducts={loadProducts}
            />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersManager
              orders={orders}
              ordersLoading={ordersLoading}
              selectedOrder={selectedOrder}
              showOrderDialog={showOrderDialog}
              setShowOrderDialog={setShowOrderDialog}
              onUpdateStatus={updateOrderStatus}
              onUpdateTracking={updateOrderTracking}
              onViewDetails={viewOrderDetails}
              onDelete={deleteOrder}
            />
          </TabsContent>

          <TabsContent value="partners">
            <PartnersManager
              partnerApplications={partnerApplications}
              partnersLoading={partnersLoading}
            />
          </TabsContent>

          <TabsContent value="best-deals">
            <BestDealsManager />
          </TabsContent>

          <TabsContent value="chat">
            <ChatTab />
          </TabsContent>

          <TabsContent value="debug">
            <DebugPanel logs={debugLogs} onClearLogs={() => setDebugLogs([])} />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      <ProductFormDialog
        isOpen={isDialogOpen}
        isNewProduct={isNewProduct}
        formData={formData}
        updateFormData={updateFormData}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        uploadingImage={uploadingImage}
        onImageUpload={handleImageUpload}
        addLog={addLog}
      />
    </div>
  );
};

export default Admin;