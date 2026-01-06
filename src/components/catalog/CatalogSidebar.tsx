import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Icon from "@/components/ui/icon";
import CatalogFilters from "./CatalogFilters";
import { Product } from "@/lib/api";

interface CatalogSidebarProps {
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
  setStyleSearch: (search: string) => void;
  selectedColors: string[];
  setSelectedColors: (colors: string[]) => void;
  colorSearch: string;
  setColorSearch: (search: string) => void;
  sizeRange: {
    height: [number, number];
    length: [number, number];
    depth: [number, number];
    width: [number, number];
    diameter: [number, number];
    chainLength: [number, number];
  };
  setSizeRange: (range: any) => void;
  brandSearch: string;
  setBrandSearch: (search: string) => void;
  onResetFilters: () => void;
  showMobileFilters: boolean;
  setShowMobileFilters: (show: boolean) => void;
}

const CatalogSidebar = ({
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
  showMobileFilters,
  setShowMobileFilters,
}: CatalogSidebarProps) => {
  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0">
        <CatalogFilters
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
          onResetFilters={onResetFilters}
        />
      </aside>

      <Button
        variant="outline"
        className="lg:hidden mb-4 w-full"
        onClick={() => setShowMobileFilters(true)}
      >
        <Icon name="SlidersHorizontal" className="mr-2 h-4 w-4" />
        Фильтры
      </Button>

      <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Фильтры</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <CatalogFilters
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
              onResetFilters={onResetFilters}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default CatalogSidebar;