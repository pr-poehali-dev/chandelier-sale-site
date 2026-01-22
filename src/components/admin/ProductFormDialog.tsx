import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import { LogEntry } from "./DebugPanel";

interface FormData {
  name: string;
  price: number;
  image: string;
  brand: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  type: string;
  description: string;
  hasRemote: boolean;
  isDimmable: boolean;
  hasColorChange: boolean;
  article: string;
  brandCountry: string;
  manufacturerCountry: string;
  collection: string;
  style: string;
  lampType: string;
  socketType: string;
  bulbType: string;
  lampCount: number;
  lampPower: number;
  totalPower: number;
  lightingArea: number;
  voltage: number;
  color: string;
  height: number;
  diameter: number;
  length: number;
  width: number;
  depth: number;
  chainLength: number;
  images: string[];
  assemblyInstructionUrl: string;
  materials: string;
  frameMaterial: string;
  shadeMaterial: string;
  frameColor: string;
  shadeColor: string;
  shadeDirection: string;
  diffuserType: string;
  diffuserShape: string;
  ipRating: string;
  interior: string;
  place: string;
  suspendedCeiling: boolean;
  mountType: string;
  officialWarranty: string;
  shopWarranty: string;
  section: string;
  catalog: string;
  subcategory: string;
}

interface ProductFormDialogProps {
  isOpen: boolean;
  isNewProduct: boolean;
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  uploadingImage: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  addLog: (level: LogEntry["level"], category: string, message: string, details?: any) => void;
}

const ProductFormDialog = ({
  isOpen,
  isNewProduct,
  formData,
  updateFormData,
  onClose,
  onSave,
  uploadingImage,
  onImageUpload,
  addLog,
}: ProductFormDialogProps) => {
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [additionalImageUrl, setAdditionalImageUrl] = useState("");

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.brand) {
      toast({
        title: "Ошибка валидации",
        description: "Заполните обязательные поля: Название, Цена, Бренд",
        variant: "destructive",
      });
      return;
    }
    await onSave();
  };

  const handleAddImage = () => {
    if (additionalImageUrl.trim()) {
      updateFormData({
        images: [...formData.images, additionalImageUrl.trim()],
      });
      setAdditionalImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    updateFormData({
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddImage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNewProduct ? "Добавить товар" : "Редактировать товар"}
          </DialogTitle>
          <DialogDescription>
            Заполните информацию о товаре. Поля, отмеченные <span className="text-red-500">*</span>, обязательны для заполнения.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">
              Название <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              placeholder="Люстра Crystal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">
                Цена (₽) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => updateFormData({ price: parseFloat(e.target.value) || 0 })}
                placeholder="15000"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="brand">
                Бренд <span className="text-red-500">*</span>
              </Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => updateFormData({ brand: e.target.value })}
                placeholder="Suncharm"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image">Основное изображение</Label>
            <div className="flex gap-2">
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => updateFormData({ image: e.target.value })}
                placeholder="URL изображения"
              />
              <Button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                variant="outline"
              >
                {uploadingImage ? (
                  <Icon name="Loader2" className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon name="Upload" className="h-4 w-4" />
                )}
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageUpload}
              />
            </div>
            {formData.image && (
              <img
                src={formData.image}
                alt="Preview"
                className="mt-2 h-32 w-32 rounded object-cover"
              />
            )}
          </div>

          <div className="grid gap-2">
            <Label>Дополнительные изображения</Label>
            <div className="flex gap-2">
              <Input
                value={additionalImageUrl}
                onChange={(e) => setAdditionalImageUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="URL изображения (Enter для добавления)"
              />
              <Button type="button" onClick={handleAddImage} variant="outline">
                <Icon name="Plus" className="h-4 w-4" />
              </Button>
            </div>
            {formData.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img}
                      alt={`Additional ${idx + 1}`}
                      className="h-20 w-20 rounded object-cover"
                    />
                    <Button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      variant="destructive"
                      size="sm"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0"
                    >
                      <Icon name="X" className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type">
                Тип <span className="text-red-500">*</span>
              </Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => updateFormData({ type: e.target.value })}
                placeholder="Люстра"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rating">Рейтинг</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={formData.rating}
                onChange={(e) => updateFormData({ rating: parseFloat(e.target.value) || 5 })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reviews">Отзывы</Label>
              <Input
                id="reviews"
                type="number"
                value={formData.reviews}
                onChange={(e) => updateFormData({ reviews: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="inStock"
              checked={formData.inStock}
              onChange={(e) => updateFormData({ inStock: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            <Label htmlFor="inStock" className="cursor-pointer">
              В наличии
            </Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="Подробное описание товара"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Дополнительные функции</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasRemote"
                  checked={formData.hasRemote}
                  onChange={(e) => updateFormData({ hasRemote: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor="hasRemote" className="cursor-pointer flex items-center gap-1">
                  <Icon name="Radio" className="h-4 w-4" />
                  Пульт управления
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDimmable"
                  checked={formData.isDimmable}
                  onChange={(e) => updateFormData({ isDimmable: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor="isDimmable" className="cursor-pointer flex items-center gap-1">
                  <Icon name="Sun" className="h-4 w-4" />
                  Диммер
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasColorChange"
                  checked={formData.hasColorChange}
                  onChange={(e) => updateFormData({ hasColorChange: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor="hasColorChange" className="cursor-pointer flex items-center gap-1">
                  <Icon name="Palette" className="h-4 w-4" />
                  Смена цвета
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">Технические характеристики</h3>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Основные</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="article">Артикул</Label>
                  <Input
                    id="article"
                    value={formData.article}
                    onChange={(e) => updateFormData({ article: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="brandCountry">Страна бренда</Label>
                  <Input
                    id="brandCountry"
                    value={formData.brandCountry}
                    onChange={(e) => updateFormData({ brandCountry: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="manufacturerCountry">Страна производства</Label>
                  <Input
                    id="manufacturerCountry"
                    value={formData.manufacturerCountry}
                    onChange={(e) => updateFormData({ manufacturerCountry: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="collection">Коллекция</Label>
                  <Input
                    id="collection"
                    value={formData.collection}
                    onChange={(e) => updateFormData({ collection: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="style">Стиль</Label>
                  <Input
                    id="style"
                    value={formData.style}
                    onChange={(e) => updateFormData({ style: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Лампы</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="socketType">Цоколь</Label>
                  <Input
                    id="socketType"
                    value={formData.socketType}
                    onChange={(e) => updateFormData({ socketType: e.target.value })}
                    placeholder="E14, E27"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bulbType">Тип лампы</Label>
                  <Input
                    id="bulbType"
                    value={formData.bulbType}
                    onChange={(e) => updateFormData({ bulbType: e.target.value })}
                    placeholder="LED, накаливания"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lampCount">Количество ламп</Label>
                  <Input
                    id="lampCount"
                    type="number"
                    value={formData.lampCount}
                    onChange={(e) => updateFormData({ lampCount: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lampPower">Мощность лампы (Вт)</Label>
                  <Input
                    id="lampPower"
                    type="number"
                    value={formData.lampPower}
                    onChange={(e) => updateFormData({ lampPower: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="totalPower">Общая мощность (Вт)</Label>
                  <Input
                    id="totalPower"
                    type="number"
                    value={formData.totalPower}
                    onChange={(e) => updateFormData({ totalPower: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lightingArea">Площадь освещения (м²)</Label>
                  <Input
                    id="lightingArea"
                    type="number"
                    value={formData.lightingArea}
                    onChange={(e) => updateFormData({ lightingArea: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="voltage">Напряжение (В)</Label>
                  <Input
                    id="voltage"
                    type="number"
                    value={formData.voltage}
                    onChange={(e) => updateFormData({ voltage: parseInt(e.target.value) || 220 })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Цвет и материал</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="materials">Материалы</Label>
                  <Input
                    id="materials"
                    value={formData.materials}
                    onChange={(e) => updateFormData({ materials: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="frameMaterial">Материал арматуры</Label>
                  <Input
                    id="frameMaterial"
                    value={formData.frameMaterial}
                    onChange={(e) => updateFormData({ frameMaterial: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="shadeMaterial">Материал плафона</Label>
                  <Input
                    id="shadeMaterial"
                    value={formData.shadeMaterial}
                    onChange={(e) => updateFormData({ shadeMaterial: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="shadeDirection">Направление плафона</Label>
                  <Input
                    id="shadeDirection"
                    value={formData.shadeDirection}
                    onChange={(e) => updateFormData({ shadeDirection: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="diffuserType">Тип рассеивателя</Label>
                  <Input
                    id="diffuserType"
                    value={formData.diffuserType}
                    onChange={(e) => updateFormData({ diffuserType: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="diffuserShape">Форма рассеивателя</Label>
                  <Input
                    id="diffuserShape"
                    value={formData.diffuserShape}
                    onChange={(e) => updateFormData({ diffuserShape: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="color">Цвет</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => updateFormData({ color: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="frameColor">Цвет арматуры</Label>
                  <Input
                    id="frameColor"
                    value={formData.frameColor}
                    onChange={(e) => updateFormData({ frameColor: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="shadeColor">Цвет плафона</Label>
                  <Input
                    id="shadeColor"
                    value={formData.shadeColor}
                    onChange={(e) => updateFormData({ shadeColor: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Защита и размещение</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ipRating">Степень защиты (IP)</Label>
                  <Input
                    id="ipRating"
                    value={formData.ipRating}
                    onChange={(e) => updateFormData({ ipRating: e.target.value })}
                    placeholder="IP20, IP44"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="interior">Интерьер</Label>
                  <Input
                    id="interior"
                    value={formData.interior}
                    onChange={(e) => updateFormData({ interior: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="place">Место установки</Label>
                  <Input
                    id="place"
                    value={formData.place}
                    onChange={(e) => updateFormData({ place: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="mountType">Тип крепления</Label>
                  <Input
                    id="mountType"
                    value={formData.mountType}
                    onChange={(e) => updateFormData({ mountType: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="suspendedCeiling"
                    checked={formData.suspendedCeiling}
                    onChange={(e) => updateFormData({ suspendedCeiling: e.target.checked })}
                    className="h-4 w-4 rounded"
                  />
                  <Label htmlFor="suspendedCeiling" className="cursor-pointer">
                    Натяжной потолок
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Гарантия</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="officialWarranty">Гарантия производителя</Label>
                  <Input
                    id="officialWarranty"
                    value={formData.officialWarranty}
                    onChange={(e) => updateFormData({ officialWarranty: e.target.value })}
                    placeholder="12 месяцев"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="shopWarranty">Гарантия магазина</Label>
                  <Input
                    id="shopWarranty"
                    value={formData.shopWarranty}
                    onChange={(e) => updateFormData({ shopWarranty: e.target.value })}
                    placeholder="24 месяца"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Категоризация</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="section">Раздел</Label>
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) => updateFormData({ section: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="catalog">Каталог</Label>
                  <Input
                    id="catalog"
                    value={formData.catalog}
                    onChange={(e) => updateFormData({ catalog: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="subcategory">Подкатегория</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => updateFormData({ subcategory: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Размеры (мм)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="height">Высота</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => updateFormData({ height: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="diameter">Диаметр</Label>
                  <Input
                    id="diameter"
                    type="number"
                    value={formData.diameter}
                    onChange={(e) => updateFormData({ diameter: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="length">Длина</Label>
                  <Input
                    id="length"
                    type="number"
                    value={formData.length}
                    onChange={(e) => updateFormData({ length: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="width">Ширина</Label>
                  <Input
                    id="width"
                    type="number"
                    value={formData.width}
                    onChange={(e) => updateFormData({ width: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="depth">Глубина</Label>
                  <Input
                    id="depth"
                    type="number"
                    value={formData.depth}
                    onChange={(e) => updateFormData({ depth: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="chainLength">Длина цепи</Label>
                  <Input
                    id="chainLength"
                    type="number"
                    value={formData.chainLength}
                    onChange={(e) => updateFormData({ chainLength: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Инструкция по сборке</h4>
              <div className="grid gap-2">
                <Label htmlFor="assemblyInstructionUrl">URL инструкции (PDF)</Label>
                <div className="flex gap-2">
                  <Input
                    id="assemblyInstructionUrl"
                    value={formData.assemblyInstructionUrl}
                    onChange={(e) => updateFormData({ assemblyInstructionUrl: e.target.value })}
                    placeholder="https://example.com/instruction.pdf"
                  />
                  {formData.assemblyInstructionUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open(formData.assemblyInstructionUrl, "_blank")}
                    >
                      <Icon name="ExternalLink" className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Отмена
          </Button>
          <Button onClick={handleSave}>
            <Icon name="Save" className="mr-2 h-4 w-4" />
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
