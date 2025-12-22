interface Category {
  value: string;
  label: string;
  highlight?: boolean;
}

interface CategoryNavigationProps {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const CategoryNavigation = ({
  categories,
  selectedCategory,
  setSelectedCategory,
}: CategoryNavigationProps) => {
  return (
    <div className="mb-8 border-b relative">
      <div className="flex gap-1 overflow-x-auto pb-px scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => {
              setSelectedCategory(selectedCategory === category.value ? '' : category.value);
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
    </div>
  );
};

export default CategoryNavigation;