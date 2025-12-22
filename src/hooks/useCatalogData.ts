import { useState, useEffect } from "react";
import { api, Product, User } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const useCatalogData = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);

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

  return {
    user,
    setUser,
    products,
    setProducts,
    loading,
    favorites,
    toggleFavorite,
    handleLogout,
    loadProducts,
  };
};