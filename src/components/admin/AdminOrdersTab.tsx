import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { Order } from "@/lib/api";

interface AdminOrdersTabProps {
  orders: Order[];
  ordersLoading: boolean;
  onUpdateStatus: (orderId: number, status: string) => void;
  onUpdateTracking: (orderId: number, trackingNumber: string) => void;
  onViewDetails: (order: Order) => void;
}

const AdminOrdersTab = ({
  orders,
  ordersLoading,
  onUpdateStatus,
  onUpdateTracking,
  onViewDetails,
}: AdminOrdersTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Список заказов</CardTitle>
      </CardHeader>
      <CardContent>
        {ordersLoading ? (
          <div className="text-center py-8">
            <Icon name="Loader2" className="h-8 w-8 animate-spin mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Заказов пока нет
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Заказ №{order.id}</span>
                      <Badge
                        variant={
                          order.status === "completed"
                            ? "default"
                            : order.status === "pending"
                              ? "secondary"
                              : order.status === "processing"
                                ? "outline"
                                : "destructive"
                        }
                      >
                        {order.status === "pending"
                          ? "Ожидает"
                          : order.status === "processing"
                            ? "В обработке"
                            : order.status === "completed"
                              ? "Выполнен"
                              : "Отменён"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        <Icon name="User" className="inline h-3 w-3 mr-1" />
                        {order.customer_name}
                      </div>
                      <div>
                        <Icon name="Mail" className="inline h-3 w-3 mr-1" />
                        {order.customer_email}
                      </div>
                      <div>
                        <Icon name="Phone" className="inline h-3 w-3 mr-1" />
                        {order.customer_phone}
                      </div>
                      <div>
                        <Icon name="MapPin" className="inline h-3 w-3 mr-1" />
                        {order.customer_address}
                      </div>
                      <div>
                        <Icon name="Calendar" className="inline h-3 w-3 mr-1" />
                        {new Date(order.created_at).toLocaleString("ru-RU")}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {order.total_amount.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <div className="space-y-1">
                      <Label
                        htmlFor={`tracking-${order.id}`}
                        className="text-xs"
                      >
                        Трек-номер
                      </Label>
                      <div className="flex gap-1">
                        <Input
                          id={`tracking-${order.id}`}
                          placeholder="Введите трек-номер"
                          defaultValue={order.tracking_number || ""}
                          className="h-8 text-sm"
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value !== (order.tracking_number || "")) {
                              onUpdateTracking(order.id, value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const value = (
                                e.target as HTMLInputElement
                              ).value.trim();
                              if (value !== (order.tracking_number || "")) {
                                onUpdateTracking(order.id, value);
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`status-${order.id}`}
                        className="text-xs"
                      >
                        Статус
                      </Label>
                      <Select
                        value={order.status}
                        onValueChange={(value) =>
                          onUpdateStatus(order.id, value)
                        }
                      >
                        <SelectTrigger
                          id={`status-${order.id}`}
                          className="h-8"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Ожидает</SelectItem>
                          <SelectItem value="processing">
                            В обработке
                          </SelectItem>
                          <SelectItem value="completed">Выполнен</SelectItem>
                          <SelectItem value="cancelled">Отменён</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(order)}
                      className="mt-1"
                    >
                      <Icon name="Eye" className="mr-2 h-4 w-4" />
                      Детали
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminOrdersTab;
