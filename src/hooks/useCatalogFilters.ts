import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Product } from "@/lib/api";

export const useCatalogFilters = (products: Product[]) => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [hoverCategory, setHoverCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState<number[]>([0, 150000]);
  const [hasRemote, setHasRemote] = useState(false);
  const [isDimmable, setIsDimmable] = useState(false);
  const [hasColorChange, setHasColorChange] = useState(false);
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");

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

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.style?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(product.brand);

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
  }, [
    products,
    searchQuery,
    selectedBrands,
    selectedTypes,
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

  return {
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
  };
};
