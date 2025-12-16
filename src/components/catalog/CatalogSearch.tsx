import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";

interface CatalogSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  imageSearchLoading: boolean;
  onImageUploadClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CatalogSearch = ({
  searchQuery,
  setSearchQuery,
  imageSearchLoading,
  onImageUploadClick,
  fileInputRef,
  onImageUpload,
}: CatalogSearchProps) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon
            name="Search"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Поиск по названию, бренду..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onImageUpload}
          className="hidden"
        />
        <Button
          onClick={onImageUploadClick}
          disabled={imageSearchLoading}
          className="whitespace-nowrap"
        >
          {imageSearchLoading ? (
            <>
              <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
              Поиск...
            </>
          ) : (
            <>
              <Icon name="Image" className="mr-2 h-4 w-4" />
              Поиск по фото
            </>
          )}
        </Button>
      </div>

      {searchQuery && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Поиск: {searchQuery}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
          >
            <Icon name="X" className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CatalogSearch;
