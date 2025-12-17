import { useState, useRef } from "react";
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
import { api } from "@/lib/api";
import { useCatalogData } from "@/hooks/useCatalogData";
import { useCatalogFilters } from "@/hooks/useCatalogFilters";
import { types, categories } from "@/lib/catalogConfig";

const Catalog = () => {
  const { toast } = useToast();
  const { addToCart, totalItems } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);

  const {
    user,
    setUser,
    products,
    setProducts,
    loading,
    favorites,
    toggleFavorite,
    handleLogout,
    loadProducts,
  } = useCatalogData();

  const {
    searchQuery,
    setSearchQuery,
    selectedBrands,
    setSelectedBrands,
    selectedTypes,
    setSelectedTypes,
    selectedCategory,
    setSelectedCategory,
    hoverCategory,
    setHoverCategory,
    priceRange,
    setPriceRange,
    hasRemote,
    setHasRemote,
    isDimmable,
    setIsDimmable,
    hasColorChange,
    setHasColorChange,
    isSale,
    setIsSale,
    isNew,
    setIsNew,
    isPickup,
    setIsPickup,
    selectedStyles,
    setSelectedStyles,
    styleSearch,
    setStyleSearch,
    selectedColors,
    setSelectedColors,
    colorSearch,
    setColorSearch,
    sizeRange,
    setSizeRange,
    showMobileFilters,
    setShowMobileFilters,
    brandSearch,
    setBrandSearch,
    filteredProducts,
    handleResetFilters,
  } = useCatalogFilters(products);

  const brands = Array.from(new Set(products.map((p) => p.brand))).sort();

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

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedCategory("");
    handleResetFilters();
    loadProducts();
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
            filteredProducts={filteredProducts}
            loading={loading}
            favorites={favorites}
            types={types}
            onToggleFavorite={toggleFavorite}
            onAddToCart={addToCart}
            onResetAll={handleResetAll}
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