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
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [hoverCategory, setHoverCategory] = useState<string>("");
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
  const itemsPerPage = 30;

  const brands = Array.from(new Set(products.map((p) => p.brand))).sort();

  const types = [
    {
      value: "chandelier",
      label: "Люстры",
      icon: "Lightbulb",
      color: "text-yellow-500",
    },
    {
      value: "ceiling_chandelier",
      label: "Потолочные люстры",
      icon: "Circle",
      color: "text-amber-500",
    },
    {
      value: "pendant_chandelier",
      label: "Подвесные люстры",
      icon: "Droplet",
      color: "text-cyan-500",
    },
    {
      value: "cascade",
      label: "Каскадные",
      icon: "Layers",
      color: "text-indigo-500",
    },
    {
      value: "rod",
      label: "На штанге",
      icon: "Minus",
      color: "text-slate-500",
    },
    {
      value: "large",
      label: "Большие люстры",
      icon: "Maximize2",
      color: "text-rose-500",
    },
    {
      value: "fan_chandelier",
      label: "Люстры-вентиляторы",
      icon: "Fan",
      color: "text-teal-500",
    },
    {
      value: "elite_chandelier",
      label: "Элитные люстры",
      icon: "Crown",
      color: "text-yellow-600",
    },

    {
      value: "light_pendant",
      label: "Подвесные светильники",
      icon: "Droplet",
      color: "text-blue-400",
    },
    {
      value: "light_ceiling",
      label: "Потолочные светильники",
      icon: "Circle",
      color: "text-slate-400",
    },
    {
      value: "light_wall",
      label: "Настенные светильники",
      icon: "Square",
      color: "text-purple-400",
    },
    {
      value: "light_wall_ceiling",
      label: "Настенно-потолочные",
      icon: "LayoutGrid",
      color: "text-indigo-400",
    },
    {
      value: "light_surface",
      label: "Накладные светильники",
      icon: "Box",
      color: "text-emerald-400",
    },
    {
      value: "light_recessed",
      label: "Встраиваемые светильники",
      icon: "CircleDot",
      color: "text-teal-400",
    },
    {
      value: "light_spot",
      label: "Точечные светильники",
      icon: "Dot",
      color: "text-cyan-400",
    },
    {
      value: "light_night",
      label: "Ночники",
      icon: "Moon",
      color: "text-violet-400",
    },
    {
      value: "light_furniture",
      label: "Мебельные",
      icon: "Sofa",
      color: "text-amber-400",
    },
    {
      value: "light_plant",
      label: "Для растений",
      icon: "Leaf",
      color: "text-green-500",
    },
    {
      value: "light_bactericidal",
      label: "Бактерицидные",
      icon: "ShieldPlus",
      color: "text-red-400",
    },
    {
      value: "light_kit",
      label: "Комплекты светильников",
      icon: "Package",
      color: "text-orange-400",
    },
    {
      value: "light_elite",
      label: "Элитные светильники",
      icon: "Crown",
      color: "text-yellow-500",
    },

    {
      value: "lamp_decorative",
      label: "Декоративные лампы",
      icon: "Sparkles",
      color: "text-pink-500",
    },
    {
      value: "lamp_office",
      label: "Офисные лампы",
      icon: "Briefcase",
      color: "text-gray-500",
    },
    {
      value: "lamp_kids",
      label: "Детские лампы",
      icon: "Baby",
      color: "text-pink-400",
    },
    {
      value: "lamp_clip",
      label: "На прищепке",
      icon: "Paperclip",
      color: "text-blue-500",
    },
    {
      value: "lamp_clamp",
      label: "На струбцине",
      icon: "Grip",
      color: "text-slate-500",
    },

    {
      value: "sconce",
      label: "Бра",
      icon: "WallLamp",
      color: "text-purple-500",
    },

    {
      value: "spot_one",
      label: "Спот с 1 плафоном",
      icon: "Circle",
      color: "text-orange-500",
    },
    {
      value: "spot_two",
      label: "Спот с 2 плафонами",
      icon: "CircleDot",
      color: "text-orange-600",
    },
    {
      value: "spot_three_plus",
      label: "Спот с 3+ плафонами",
      icon: "CircleEllipsis",
      color: "text-orange-700",
    },
    {
      value: "spot_recessed",
      label: "Встраиваемые споты",
      icon: "Disc",
      color: "text-amber-600",
    },
    {
      value: "spot_surface",
      label: "Накладные споты",
      icon: "Box",
      color: "text-yellow-600",
    },

    {
      value: "outdoor_street",
      label: "Уличные светильники",
      icon: "Lamp",
      color: "text-slate-600",
    },
    {
      value: "outdoor_landscape",
      label: "Ландшафтные",
      icon: "Trees",
      color: "text-green-600",
    },
    {
      value: "outdoor_architectural",
      label: "Архитектурные",
      icon: "Building",
      color: "text-stone-600",
    },
    {
      value: "outdoor_park",
      label: "Парковые",
      icon: "TreePine",
      color: "text-emerald-600",
    },
    {
      value: "outdoor_wall",
      label: "Уличные настенные",
      icon: "Square",
      color: "text-zinc-600",
    },
    {
      value: "outdoor_console",
      label: "Консольные",
      icon: "Minus",
      color: "text-neutral-600",
    },
    {
      value: "outdoor_ground",
      label: "Грунтовые",
      icon: "Mountain",
      color: "text-brown-600",
    },
    {
      value: "outdoor_underwater",
      label: "Подводные",
      icon: "Waves",
      color: "text-blue-600",
    },
    {
      value: "outdoor_recessed_ground",
      label: "Встраиваемые грунтовые",
      icon: "CircleDot",
      color: "text-teal-600",
    },
    {
      value: "outdoor_ceiling",
      label: "Уличные потолочные",
      icon: "Circle",
      color: "text-gray-600",
    },
    {
      value: "outdoor_bollard",
      label: "Столбики",
      icon: "Cylinder",
      color: "text-stone-500",
    },

    {
      value: "led_strip",
      label: "Светодиодные ленты",
      icon: "Minus",
      color: "text-blue-500",
    },
    {
      value: "led_profile",
      label: "Профили для LED лент",
      icon: "RectangleHorizontal",
      color: "text-slate-500",
    },
    {
      value: "led_neon",
      label: "LED-неон",
      icon: "Zap",
      color: "text-pink-500",
    },

    {
      value: "lamp_table",
      label: "Настольные лампы",
      icon: "Lamp",
      color: "text-orange-500",
    },
    {
      value: "lamp_floor",
      label: "Напольные торшеры",
      icon: "LampFloor",
      color: "text-amber-500",
    },
    {
      value: "floor_lamp",
      label: "Торшеры",
      icon: "LampFloor",
      color: "text-indigo-500",
    },

    {
      value: "track_light",
      label: "Трековые светильники",
      icon: "RailSymbol",
      color: "text-blue-600",
    },
    {
      value: "track_rail",
      label: "Шинопроводы",
      icon: "Minus",
      color: "text-slate-600",
    },

    {
      value: "electric_switch",
      label: "Выключатели",
      icon: "ToggleLeft",
      color: "text-gray-500",
    },
    {
      value: "electric_frame",
      label: "Рамки",
      icon: "Square",
      color: "text-zinc-500",
    },
    {
      value: "electric_power",
      label: "Блоки питания",
      icon: "Battery",
      color: "text-green-500",
    },
    {
      value: "electric_other",
      label: "Прочие электротовары",
      icon: "Zap",
      color: "text-yellow-500",
    },

    {
      value: "decorative_garland",
      label: "Гирлянды",
      icon: "Sparkles",
      color: "text-red-500",
    },
    {
      value: "decorative_tree",
      label: "Светодиодные деревья",
      icon: "TreePine",
      color: "text-green-500",
    },
    {
      value: "decorative_candle",
      label: "Подсвечники",
      icon: "Flame",
      color: "text-orange-400",
    },

    {
      value: "light_mirror",
      label: "Подсветка для зеркал",
      icon: "Mirror",
      color: "text-blue-300",
    },
    {
      value: "light_picture",
      label: "Подсветка для картин",
      icon: "Frame",
      color: "text-amber-400",
    },
    {
      value: "light_projector",
      label: "Светильники-проекторы",
      icon: "Projector",
      color: "text-purple-400",
    },
    {
      value: "outdoor_lantern",
      label: "Уличные фонари",
      icon: "Lamp",
      color: "text-slate-500",
    },
  ];

  const categories = [
    { value: "", label: "Все товары" },
    { value: "sale", label: "🔥 Акции", highlight: true },
    { value: "chandelier", label: "Люстры" },
    { value: "lights", label: "Светильники" },
    { value: "sconce", label: "Бра" },
    { value: "lamps", label: "Настольные лампы" },
    { value: "spots", label: "Споты" },
    { value: "track", label: "Трековые светильники" },
    { value: "electric", label: "Электротовары" },
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

    loadProducts();
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
    selectedTypes,
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
    sizeRange,
  ]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let allProducts: Product[] = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        try {
          const data = await api.getProducts({ limit, offset });
          
          if (data.products.length === 0) {
            hasMore = false;
            break;
          }
          
          allProducts = [...allProducts, ...data.products];
          offset += limit;
          
          if (data.products.length < limit) {
            hasMore = false;
          }
        } catch (err) {
          console.error("Error loading batch:", err);
          hasMore = false;
        }
      }

      setProducts(allProducts);
      setTotalProducts(allProducts.length);
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

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.style?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBrand =
      selectedBrands.length === 0 || selectedBrands.includes(product.brand);

    // Category filter logic
    const matchesCategory = (() => {
      if (!selectedCategory || selectedCategory === '' || selectedCategory === 'sale') return true;
      
      if (selectedCategory === 'chandelier') {
        return product.type.includes('chandelier') || product.type === 'cascade' || product.type === 'rod' || product.type === 'large' || product.type === 'fan_chandelier';
      }
      if (selectedCategory === 'lights') {
        return product.type.startsWith('light_') || product.type.startsWith('decorative_');
      }
      if (selectedCategory === 'sconce') {
        return product.type === 'sconce';
      }
      if (selectedCategory === 'lamps') {
        return product.type.startsWith('lamp_') || product.type === 'floor_lamp';
      }
      if (selectedCategory === 'spots') {
        return product.type.startsWith('spot_');
      }
      if (selectedCategory === 'track') {
        return product.type.startsWith('track_');
      }
      if (selectedCategory === 'electric') {
        return product.type.startsWith('electric_');
      }
      
      return true;
    })();

    const matchesType =
      selectedTypes.length === 0 || selectedTypes.includes(product.type);

    const matchesPrice =
      product.price >= priceRange[0] && product.price <= priceRange[1];

    const matchesRemote = !hasRemote || product.has_remote;
    const matchesDimmable = !isDimmable || product.is_dimmable;
    const matchesColorChange = !hasColorChange || product.has_color_change;
    const matchesSale = !isSale || product.is_sale;
    const matchesNew = !isNew || product.is_new;
    const matchesPickup = !isPickup || product.pickup_available;

    const matchesStyle =
      selectedStyles.length === 0 ||
      (product.style && selectedStyles.includes(product.style));

    const matchesColor =
      selectedColors.length === 0 ||
      (product.color && selectedColors.includes(product.color));

    const matchesSize =
      (!product.height ||
        (product.height >= sizeRange.height[0] &&
          product.height <= sizeRange.height[1])) &&
      (!product.length ||
        (product.length >= sizeRange.length[0] &&
          product.length <= sizeRange.length[1])) &&
      (!product.depth ||
        (product.depth >= sizeRange.depth[0] &&
          product.depth <= sizeRange.depth[1])) &&
      (!product.width ||
        (product.width >= sizeRange.width[0] &&
          product.width <= sizeRange.width[1])) &&
      (!product.diameter ||
        (product.diameter >= sizeRange.diameter[0] &&
          product.diameter <= sizeRange.diameter[1])) &&
      (!product.chain_length ||
        (product.chain_length >= sizeRange.chainLength[0] &&
          product.chain_length <= sizeRange.chainLength[1]));

    return (
      matchesSearch &&
      matchesBrand &&
      matchesCategory &&
      matchesType &&
      matchesPrice &&
      matchesRemote &&
      matchesDimmable &&
      matchesColorChange &&
      matchesSale &&
      matchesNew &&
      matchesPickup &&
      matchesStyle &&
      matchesColor &&
      matchesSize
    );
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageSearchLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const base64Data = base64.split(",")[1];

        try {
          const result = await api.searchByImage(base64Data);
          setProducts(result.products);
          setSearchQuery("");
          setSelectedBrands([]);
          setSelectedTypes([]);

          toast({
            title: "Поиск завершён",
            description:
              result.description || `Найдено ${result.products.length} товаров`,
          });
        } catch (error) {
          toast({
            title: "Ошибка поиска",
            description:
              error instanceof Error ? error.message : "Попробуйте другое фото",
            variant: "destructive",
          });
        } finally {
          setImageSearchLoading(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обработать изображение",
        variant: "destructive",
      });
      setImageSearchLoading(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleFavorite = (id: number) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter((fav) => fav !== id)
      : [...favorites, id];

    setFavorites(newFavorites);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));

    toast({
      title: favorites.includes(id)
        ? "Удалено из избранного"
        : "Добавлено в избранное",
      description: favorites.includes(id) ? "" : "Товар добавлен в избранное",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    toast({
      title: "Выход выполнен",
      description: "Вы успешно вышли из аккаунта",
    });
  };

  const handleResetFilters = () => {
    setSelectedBrands([]);
    setSelectedTypes([]);
    setPriceRange([0, 150000]);
    setHasRemote(false);
    setIsDimmable(false);
    setHasColorChange(false);
    setIsSale(false);
    setIsNew(false);
    setIsPickup(false);
    setSelectedStyles([]);
    setSelectedColors([]);
    setBrandSearch("");
    setStyleSearch("");
    setColorSearch("");
    setSizeRange({
      height: [0, 3000],
      length: [0, 3000],
      depth: [0, 3000],
      width: [0, 3000],
      diameter: [0, 3000],
      chainLength: [0, 3000],
    });
  };

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedCategory("");
    handleResetFilters();
    setCurrentPage(1);
  };

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartItemsCount={totalItems}
        onCartClick={() => (window.location.href = "/cart")}
        onAuthClick={() => setShowAuth(true)}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        <CatalogHeader user={user} onLogout={handleLogout} />

        <CategoryNavigation
          categories={categories}
          types={types}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          hoverCategory={hoverCategory}
          setHoverCategory={setHoverCategory}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
        />

        <CatalogSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          imageSearchLoading={imageSearchLoading}
          onImageUploadClick={() => fileInputRef.current?.click()}
          fileInputRef={fileInputRef}
          onImageUpload={handleImageUpload}
        />

        <div className="flex flex-col lg:flex-row gap-8">
          <CatalogSidebar
            products={products}
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
            brandSearch={brandSearch}
            setBrandSearch={setBrandSearch}
            onResetFilters={handleResetFilters}
            showMobileFilters={showMobileFilters}
            setShowMobileFilters={setShowMobileFilters}
          />

          <CatalogContent
            filteredProducts={paginatedProducts}
            loading={loading}
            favorites={favorites}
            types={types}
            onToggleFavorite={toggleFavorite}
            onAddToCart={addToCart}
            onResetAll={handleResetAll}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalCount={filteredProducts.length}
          />
        </div>
      </main>

      <AuthDialog
        open={showAuth}
        onOpenChange={setShowAuth}
        onAuthSuccess={(user) => setUser(user)}
      />

      <Footer />
    </div>
  );
};

export default Catalog;