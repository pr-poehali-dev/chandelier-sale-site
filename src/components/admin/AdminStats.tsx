import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { Product } from "@/lib/api";

interface AdminStatsProps {
  products: Product[];
  totalProducts: number;
  brands: string[];
  productTypes: string[];
}

const AdminStats = ({ products, totalProducts, brands, productTypes }: AdminStatsProps) => {
  const stats = {
    total: totalProducts,
    inStock: products.filter((p) => p.inStock).length,
    outOfStock: products.filter((p) => !p.inStock).length,
    avgPrice: products.length
      ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length)
      : 0,
    totalValue: products.reduce((sum, p) => sum + p.price, 0),
    avgRating:
      products.reduce((sum, p) => sum + p.rating, 0) / products.length || 0,
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Всего товаров</CardTitle>
          <Icon name="Package" className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground mt-1">
            В наличии: {stats.inStock}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Средняя цена
          </CardTitle>
          <Icon name="DollarSign" className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.avgPrice.toLocaleString()} ₽
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Общая стоимость: {(stats.totalValue / 1000000).toFixed(1)}M ₽
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Средний рейтинг
          </CardTitle>
          <Icon name="Star" className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.avgRating.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Всего отзывов: {stats.totalReviews}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Брендов</CardTitle>
          <Icon name="Tag" className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{brands.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Категорий: {typeStats.length}
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Топ товаров по рейтингу</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topProducts.map((product, idx) => (
              <div
                key={product.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium line-clamp-1">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.brand}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Icon name="Star" className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {product.rating}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {product.reviews} отзывов
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Топ брендов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
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
  );
};

export default AdminStats;
