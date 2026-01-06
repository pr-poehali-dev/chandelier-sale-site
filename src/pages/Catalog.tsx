import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthDialog from "@/components/AuthDialog";
import CategoryNavigation from "@/components/catalog/CategoryNavigation";
import CatalogHeader from "@/components/catalog/CatalogHeader";
import CatalogSearch from "@/components/catalog/CatalogSearch";
import CatalogSidebar from "@/components/catalog/CatalogSidebar";
import CatalogContent from "@/components/catalog/CatalogContent";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { api, Product, User } from "@/lib/api";
import SEO from "@/components/SEO";

const Catalog = () => {
  const { toast } = useToast();
  const { addToCart, totalItems } = useCart();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState<number[]>([0, 150000]);
  const [hasRemote, setHasRemote] = useState(false);
  const [isDimmable, setIsDimmable] = useState(false);
  const [hasColorChange, setHasColorChange] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isSale, setIsSale] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [isPickup, setIsPickup] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [styleSearch, setStyleSearch] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colorSearch, setColorSearch] = useState("");
  const [sizeRange, setSizeRange] = useState({
    height: [0, 3000],
    length: [0, 3000],
    depth: [0, 3000],
    width: [0, 3000],
    diameter: [0, 3000],
    chainLength: [0, 3000],
  });
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = 20;

  const categories = [
    { value: "", label: "Все товары" },
    { value: "Люстры", label: "Люстры" },
    { value: "Светильники", label: "Светильники" },
    { value: "Бра", label: "Бра" },
    { value: "Настольные лампы", label: "Настольные лампы" },
    { value: "Торшеры", label: "Торшеры" },
    { value: "Декоративное освещение", label: "Декоративное освещение" },
    { value: "Электротовары", label: "Электротовары" },
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const savedFavorites = localStorage.getItem("favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setSelectedCategory(category);
    }

    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedBrands,
    selectedCategory,
    priceRange,
    hasRemote,
    isDimmable,
    hasColorChange,
    isSale,
    isNew,
    isPickup,
    selectedStyles,
    selectedColors,
  ]);

  useEffect(() => {
    loadProducts();
  }, [currentPage, searchQuery, selectedBrands, selectedCategory, priceRange, hasRemote, isDimmable, hasColorChange, isSale, isNew, isPickup, selectedStyles, selectedColors]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      const filters: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };

      if (searchQuery) filters.search = searchQuery;
      if (selectedBrands.length > 0) filters.brands = selectedBrands.join(',');
      if (selectedCategory) filters.category = selectedCategory;
      if (priceRange[0] > 0) filters.min_price = priceRange[0];
      if (priceRange[1] < 150000) filters.max_price = priceRange[1];
      if (hasRemote) filters.has_remote = 'true';
      if (isDimmable) filters.is_dimmable = 'true';
      if (hasColorChange) filters.has_color_change = 'true';
      if (isSale) filters.is_sale = 'true';
      if (isNew) filters.is_new = 'true';
      if (isPickup) filters.pickup_available = 'true';
      if (selectedStyles.length > 0) filters.styles = selectedStyles.join(',');
      if (selectedColors.length > 0) filters.colors = selectedColors.join(',');

      const data = await api.getProducts(filters);
      setProducts(data.products);
      setTotalProducts(data.total || 0);
    } catch (error) {
      console.error("Failed to load products:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить товары",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageSearchLoading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(",")[1];

        try {
          const response = await fetch(
            "https://functions.poehali.dev/17e374a7-17b7-4c8c-b4a0-995daf6c4467",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ image: base64Data }),
            }
          );

          if (!response.ok) {
            throw new Error("Search failed");
          }

          const data = await response.json();
          if (data.products && data.products.length > 0) {
            setProducts(data.products);
            setTotalProducts(data.products.length);
            toast({
              title: "Поиск выполнен",
              description: `Найдено ${data.products.length} похожих товаров`,
            });
          } else {
            toast({
              title: "Ничего не найдено",
              description: "Попробуйте другое изображение",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Image search failed:", error);
          toast({
            title: "Ошибка поиска",
            description: "Не удалось выполнить поиск по изображению",
            variant: "destructive",
          });
        } finally {
          setImageSearchLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to read file:", error);
      setImageSearchLoading(false);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображение",
        variant: "destructive",
      });
    }
  };

  const addToCartHandler = (product: Product) => {
    addToCart(product);
    toast({
      title: "Товар добавлен в корзину",
      duration: 2000,
    });
  };

  const toggleFavorite = (productId: number) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];

    setFavorites(newFavorites);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));

    toast({
      title: favorites.includes(productId)
        ? "Удалено из избранного"
        : "Добавлено в избранное",
      duration: 2000,
    });
  };

  const handleAuthSuccess = (user: User) => {
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
    setShowAuth(false);
    toast({
      title: "Вы вошли в систему",
      duration: 2000,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEO
        title="Каталог светильников — купить люстры, бра, торшеры | Светит всем"
        description="Большой выбор люстр, светильников, бра и торшеров. Более 300 000 товаров с доставкой по всей России. Гарантия качества."
        canonicalPath="/catalog"
      />
      <Header
        cartItemsCount={totalItems}
        onCartClick={() => (window.location.href = "/cart")}
        onAuthClick={() => setShowAuth(true)}
      />

      <main className="flex-1">
        <div className="bg-primary py-4">
          <div className="container mx-auto px-4">
            <CategoryNavigation
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <CatalogHeader
            totalProducts={totalProducts}
            onImageSearch={() => fileInputRef.current?.click()}
            imageSearchLoading={imageSearchLoading}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />

          <CatalogSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <div className="flex flex-col lg:flex-row gap-8 mt-8">
            <CatalogSidebar
              selectedBrands={selectedBrands}
              setSelectedBrands={setSelectedBrands}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              hasRemote={hasRemote}
              setHasRemote={setHasRemote}
              isDimmable={isDimmable}
              setIsDimmable={setIsDimmable}
              hasColorChange={hasColorChange}
              setHasColorChange={setHasColorChange}
              isSale={isSale}
              setIsSale={setIsSale}
              isNew={isNew}
              setIsNew={setIsNew}
              isPickup={isPickup}
              setIsPickup={setIsPickup}
              selectedStyles={selectedStyles}
              setSelectedStyles={setSelectedStyles}
              styleSearch={styleSearch}
              setStyleSearch={setStyleSearch}
              selectedColors={selectedColors}
              setSelectedColors={setSelectedColors}
              colorSearch={colorSearch}
              setColorSearch={setColorSearch}
              sizeRange={sizeRange}
              setSizeRange={setSizeRange}
              showMobileFilters={showMobileFilters}
              setShowMobileFilters={setShowMobileFilters}
              brandSearch={brandSearch}
              setBrandSearch={setBrandSearch}
              onResetFilters={() => {
                setSelectedBrands([]);
                setPriceRange([0, 150000]);
                setHasRemote(false);
                setIsDimmable(false);
                setHasColorChange(false);
                setIsSale(false);
                setIsNew(false);
                setIsPickup(false);
                setSelectedStyles([]);
                setSelectedColors([]);
                setSizeRange({
                  height: [0, 3000],
                  length: [0, 3000],
                  depth: [0, 3000],
                  width: [0, 3000],
                  diameter: [0, 3000],
                  chainLength: [0, 3000],
                });
              }}
            />

            <CatalogContent
              products={products}
              favorites={favorites}
              loading={loading}
              onToggleFavorite={toggleFavorite}
              onAddToCart={addToCartHandler}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onShowFilters={() => setShowMobileFilters(true)}
            />
          </div>
        </div>
      </main>

      <Footer />

      {showAuth && (
        <AuthDialog
          open={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};

export default Catalog;