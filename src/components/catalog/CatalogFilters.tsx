import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { Product } from '@/lib/api';

interface CatalogFiltersProps {
  selectedBrands: string[];
  setSelectedBrands: (brands: string[]) => void;
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
  hasRemote: boolean;
  setHasRemote: (value: boolean) => void;
  isDimmable: boolean;
  setIsDimmable: (value: boolean) => void;
  hasColorChange: boolean;
  setHasColorChange: (value: boolean) => void;
  isSale: boolean;
  setIsSale: (value: boolean) => void;
  isNew: boolean;
  setIsNew: (value: boolean) => void;
  isPickup: boolean;
  setIsPickup: (value: boolean) => void;
  selectedStyles: string[];
  setSelectedStyles: (styles: string[]) => void;
  styleSearch: string;
  setStyleSearch: (value: string) => void;
  selectedColors: string[];
  setSelectedColors: (colors: string[]) => void;
  colorSearch: string;
  setColorSearch: (value: string) => void;
  sizeRange: {
    height: number[];
    length: number[];
    depth: number[];
    width: number[];
    diameter: number[];
    chainLength: number[];
  };
  setSizeRange: (range: any) => void;
  brandSearch: string;
  setBrandSearch: (value: string) => void;
  onResetFilters: () => void;
}

const CatalogFilters = ({
  selectedBrands,
  setSelectedBrands,
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
  brandSearch,
  setBrandSearch,
  onResetFilters,
}: CatalogFiltersProps) => {
  // Популярные бренды (статический список для быстрой фильтрации)
  const brands = [
    'Favourite', 'Eurosvet', 'ST Luce', 'Maytoni', 'Arte Lamp',
    'Odeon Light', 'Lightstar', 'Lumion', 'Citilux', 'MW-Light',
    'Chiaro', 'Mantra', 'Ideal Lux', 'Eglo', 'Toplight',
    'F-promo', 'Escada', 'Crystal Lux', 'Lucia Tucci', 'Stilfort',
    'Globo', 'Paulmann', 'Massive', 'Donolux', 'Brilliant'
  ].sort();
  
  // Популярные цвета
  const colors = [
    'Белый', 'Черный', 'Золотой', 'Серебристый', 'Хром',
    'Бронза', 'Медь', 'Коричневый', 'Серый', 'Прозрачный',
    'Бежевый', 'Слоновая кость', 'Никель', 'Матовый черный', 'Матовое золото'
  ].sort();
  
  // Популярные стили
  const styles = [
    'Современный', 'Классический', 'Лофт', 'Минимализм', 'Хай-тек',
    'Скандинавский', 'Прованс', 'Барокко', 'Модерн', 'Ар-деко',
    'Кантри', 'Этнический', 'Эко', 'Индустриальный', 'Ретро'
  ].sort();

  const filteredBrands = brandSearch
    ? brands.filter(brand => brand.toLowerCase().includes(brandSearch.toLowerCase()))
    : brands;

  const filteredStyles = styleSearch
    ? styles.filter(style => style && style.toLowerCase().includes(styleSearch.toLowerCase()))
    : styles;

  const filteredColors = colorSearch
    ? colors.filter(color => color && color.toLowerCase().includes(colorSearch.toLowerCase()))
    : colors;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Цена</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={150000}
          step={1000}
          className="mb-3"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{priceRange[0].toLocaleString()} ₽</span>
          <span>{priceRange[1].toLocaleString()} ₽</span>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Управление</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-remote"
              checked={hasRemote}
              onCheckedChange={(checked) => setHasRemote(!!checked)}
            />
            <Label htmlFor="has-remote" className="cursor-pointer flex items-center gap-2">
              <Icon name="Radio" className="h-4 w-4 text-blue-500" />
              С пультом управления
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-dimmable"
              checked={isDimmable}
              onCheckedChange={(checked) => setIsDimmable(!!checked)}
            />
            <Label htmlFor="is-dimmable" className="cursor-pointer flex items-center gap-2">
              <Icon name="Sun" className="h-4 w-4 text-yellow-500" />
              С диммером
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-color-change"
              checked={hasColorChange}
              onCheckedChange={(checked) => setHasColorChange(!!checked)}
            />
            <Label htmlFor="has-color-change" className="cursor-pointer flex items-center gap-2">
              <Icon name="Palette" className="h-4 w-4 text-purple-500" />
              Смена цвета (RGB)
            </Label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Специальные предложения</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-sale"
              checked={isSale}
              onCheckedChange={(checked) => setIsSale(!!checked)}
            />
            <Label htmlFor="is-sale" className="cursor-pointer flex items-center gap-2">
              <Icon name="Percent" className="h-4 w-4 text-red-500" />
              Распродажа
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-new"
              checked={isNew}
              onCheckedChange={(checked) => setIsNew(!!checked)}
            />
            <Label htmlFor="is-new" className="cursor-pointer flex items-center gap-2">
              <Icon name="Sparkles" className="h-4 w-4 text-yellow-500" />
              Новинка
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-pickup"
              checked={isPickup}
              onCheckedChange={(checked) => setIsPickup(!!checked)}
            />
            <Label htmlFor="is-pickup" className="cursor-pointer flex items-center gap-2">
              <Icon name="Store" className="h-4 w-4 text-blue-500" />
              Забрать из магазина
            </Label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Размеры (мм)</h3>
        <div className="space-y-3 text-sm">
          {[
            { key: 'height', label: 'Высота', icon: 'ArrowUp' },
            { key: 'length', label: 'Длина', icon: 'ArrowRight' },
            { key: 'width', label: 'Ширина', icon: 'ArrowLeftRight' },
            { key: 'depth', label: 'Глубина', icon: 'BoxSelect' },
            { key: 'diameter', label: 'Диаметр', icon: 'Circle' },
            { key: 'chainLength', label: 'Длина цепи', icon: 'Link' },
          ].map(({ key, label, icon }) => (
            <div key={key}>
              <Label className="text-xs flex items-center gap-1 mb-1">
                <Icon name={icon as any} className="h-3 w-3" />
                {label}
              </Label>
              <Slider
                value={sizeRange[key as keyof typeof sizeRange]}
                onValueChange={(value) => setSizeRange({ ...sizeRange, [key]: value })}
                max={3000}
                step={50}
                className="mb-1"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{sizeRange[key as keyof typeof sizeRange][0]}</span>
                <span>{sizeRange[key as keyof typeof sizeRange][1]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Стиль</h3>
        <Input
          type="text"
          placeholder="Поиск стиля..."
          value={styleSearch}
          onChange={(e) => setStyleSearch(e.target.value)}
          className="mb-3"
        />
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredStyles.map((style) => (
            <div key={style} className="flex items-center space-x-2">
              <Checkbox
                id={`style-${style}`}
                checked={selectedStyles.includes(style)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedStyles([...selectedStyles, style]);
                  } else {
                    setSelectedStyles(selectedStyles.filter((s) => s !== style));
                  }
                }}
              />
              <Label htmlFor={`style-${style}`} className="cursor-pointer text-sm">
                {style}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Цвет</h3>
        <Input
          type="text"
          placeholder="Поиск цвета..."
          value={colorSearch}
          onChange={(e) => setColorSearch(e.target.value)}
          className="mb-3"
        />
        <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
          {filteredColors.map((color) => (
            <div key={color} className="flex items-center space-x-2">
              <Checkbox
                id={`color-${color}`}
                checked={selectedColors.includes(color)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedColors([...selectedColors, color]);
                  } else {
                    setSelectedColors(selectedColors.filter((c) => c !== color));
                  }
                }}
              />
              <Label htmlFor={`color-${color}`} className="cursor-pointer text-sm capitalize">
                {color}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Бренд</h3>
        <Input
          type="text"
          placeholder="Поиск бренда..."
          value={brandSearch}
          onChange={(e) => setBrandSearch(e.target.value)}
          className="mb-3"
        />
        <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
          {filteredBrands.map((brand) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`sidebar-brand-${brand}`}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedBrands([...selectedBrands, brand]);
                  } else {
                    setSelectedBrands(selectedBrands.filter((b) => b !== brand));
                  }
                }}
              />
              <Label htmlFor={`sidebar-brand-${brand}`} className="cursor-pointer text-sm">
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={onResetFilters}
      >
        Сбросить фильтры
      </Button>
    </div>
  );
};

export default CatalogFilters;