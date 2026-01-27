import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";

interface ImportDialogProps {
  showImportDialog: boolean;
  setShowImportDialog: (show: boolean) => void;
  onImportProducts: (urls: string) => Promise<void>;
}

const ImportDialog = ({
  showImportDialog,
  setShowImportDialog,
  onImportProducts,
}: ImportDialogProps) => {
  const { toast } = useToast();
  const [importingProducts, setImportingProducts] = useState(false);
  const [importUrls, setImportUrls] = useState("");

  const handleImport = async () => {
    if (!importUrls.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите URL товаров",
        variant: "destructive",
      });
      return;
    }

    setImportingProducts(true);
    try {
      await onImportProducts(importUrls);
      setShowImportDialog(false);
      setImportUrls("");
    } finally {
      setImportingProducts(false);
    }
  };

  if (!showImportDialog) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Импорт товаров по URL</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={importUrls}
            onChange={(e) => setImportUrls(e.target.value)}
            placeholder="Введите URL товаров (по одному на строку)"
            className="min-h-[200px] w-full rounded border p-2"
          />
          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleImport}
              disabled={importingProducts}
              className="flex-1"
            >
              {importingProducts ? (
                <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icon name="Download" className="mr-2 h-4 w-4" />
              )}
              Импортировать
            </Button>
            <Button
              onClick={() => setShowImportDialog(false)}
              variant="outline"
              disabled={importingProducts}
            >
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportDialog;
