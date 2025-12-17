import { useRef } from 'react';
import Icon from '@/components/ui/icon';

interface TypeItem {
  value: string;
  label: string;
  icon: string;
  color: string;
}

interface Category {
  value: string;
  label: string;
  highlight?: boolean;
}

interface CategoryNavigationProps {
  categories: Category[];
  types: TypeItem[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  hoverCategory: string;
  setHoverCategory: (category: string) => void;
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
}

const CategoryNavigation = ({
  categories,
  types,
  selectedCategory,
  setSelectedCategory,
  hoverCategory,
  setHoverCategory,
  selectedTypes,
  setSelectedTypes,
}: CategoryNavigationProps) => {
  const categoryRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  return (
    <div className="mb-8 border-b relative">
      <div className="flex gap-1 overflow-x-auto pb-px scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.value}
            ref={(el) => categoryRefs.current[category.value] = el}
            onMouseEnter={() => category.value && setHoverCategory(category.value)}
            onMouseLeave={() => setHoverCategory('')}
            onClick={() => {
              setSelectedCategory(selectedCategory === category.value ? '' : category.value);
              setHoverCategory('');
            }}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all relative ${
              selectedCategory === category.value
                ? 'text-foreground'
                : category.highlight
                ? 'text-secondary hover:text-secondary/80'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {category.label}
            {selectedCategory === category.value && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
        ))}
      </div>
      
      {hoverCategory && hoverCategory !== '' && (
        <div 
          className="absolute top-full left-0 mt-2 z-40 bg-background border rounded-lg shadow-xl p-4 animate-in fade-in slide-in-from-top-2 min-w-[320px] max-w-[600px]"
          style={{
            left: categoryRefs.current[hoverCategory]?.offsetLeft || 0
          }}
          onMouseEnter={() => setHoverCategory(hoverCategory)}
          onMouseLeave={() => setHoverCategory('')}
        >
          <h3 className="font-semibold text-sm mb-3 text-foreground">Виды</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[400px] overflow-y-auto scrollbar-thin pr-2">
            {types
              .filter((type) => {
                if (hoverCategory === 'chandelier') return type.value.includes('chandelier') || type.value === 'chandelier' || type.value === 'cascade' || type.value === 'rod' || type.value === 'large' || type.value === 'fan_chandelier';
                if (hoverCategory === 'lights') return type.value.startsWith('light_') || type.value.startsWith('decorative_');
                if (hoverCategory === 'lamps') return type.value.startsWith('lamp_') || type.value === 'floor_lamp';
                if (hoverCategory === 'sconce') return type.value === 'sconce';
                if (hoverCategory === 'spots') return type.value.startsWith('spot_');
                if (hoverCategory === 'outdoor') return type.value.startsWith('outdoor_');
                if (hoverCategory === 'track') return type.value.startsWith('track_');
                if (hoverCategory === 'electric') return type.value.startsWith('electric_');
                return false;
              })
              .map((type) => {
                const isSelected = selectedTypes.includes(type.value);
                return (
                  <button
                    key={type.value}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTypes(selectedTypes.filter((t) => t !== type.value));
                      } else {
                        setSelectedTypes([...selectedTypes, type.value]);
                      }
                      setSelectedCategory(hoverCategory);
                      setHoverCategory('');
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'hover:bg-accent border border-transparent hover:border-border'
                    }`}
                  >
                    <Icon name={type.icon as any} className={`h-4 w-4 ${isSelected ? '' : type.color}`} />
                    {type.label}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryNavigation;