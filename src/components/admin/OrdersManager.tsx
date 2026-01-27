import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { Order } from "@/lib/api";

interface OrdersManagerProps {
  orders: Order[];
  ordersLoading: boolean;
  selectedOrder: Order | null;
  showOrderDialog: boolean;
  setShowOrderDialog: (show: boolean) => void;
  onUpdateStatus: (orderId: number, status: string) => Promise<void>;
  onUpdateTracking: (orderId: number, trackingNumber: string) => Promise<void>;
  onViewDetails: (orderId: number) => Promise<void>;
  onDelete: (orderId: number) => Promise<void>;
}

const OrdersManager = ({
  orders,
  ordersLoading,
  selectedOrder,
  showOrderDialog,
  setShowOrderDialog,
  onUpdateStatus,
  onUpdateTracking,
  onViewDetails,
  onDelete,
}: OrdersManagerProps) => {
  const [editingTracking, setEditingTracking] = useState<number | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleTrackingEdit = (order: Order) => {
    setEditingTracking(order.id);
    setTrackingNumber(order.tracking_number || "");
  };

  const handleTrackingSave = async (orderId: number) => {
    await onUpdateTracking(orderId, trackingNumber);
    setEditingTracking(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "awaiting_payment":
        return "bg-orange-500";
      case "processing":
        return "bg-blue-500";
      case "shipped":
        return "bg-purple-500";
      case "delivered":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Ожидает";
      case "awaiting_payment":
        return "Ожидает оплаты";
      case "processing":
        return "Обрабатывается";
      case "shipped":
        return "Отправлен";
      case "delivered":
        return "Доставлен";
      case "cancelled":
        return "Отменён";
      default:
        return status;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Заказы ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Заказов пока нет
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">№</th>
                    <th className="p-2 text-left">Дата</th>
                    <th className="p-2 text-left">Клиент</th>
                    <th className="p-2 text-left">Телефон</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Сумма</th>
                    <th className="p-2 text-left">Статус</th>
                    <th className="p-2 text-left">Трек-номер</th>
                    <th className="p-2 text-left">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{order.id}</td>
                      <td className="p-2">
                        {new Date(order.created_at).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="p-2">{order.customer_name}</td>
                      <td className="p-2">{order.customer_phone}</td>
                      <td className="p-2">{order.customer_email}</td>
                      <td className="p-2">
                        {order.total_amount.toLocaleString()} ₽
                      </td>
                      <td className="p-2">
                        <Select
                          value={order.status}
                          onValueChange={(value) => onUpdateStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue>
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusText(order.status)}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Ожидает</SelectItem>
                            <SelectItem value="awaiting_payment">Ожидает оплаты</SelectItem>
                            <SelectItem value="processing">Обрабатывается</SelectItem>
                            <SelectItem value="shipped">Отправлен</SelectItem>
                            <SelectItem value="delivered">Доставлен</SelectItem>
                            <SelectItem value="cancelled">Отменён</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        {editingTracking === order.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              placeholder="Трек-номер"
                              className="w-32"
                            />
                            <Button
                              onClick={() => handleTrackingSave(order.id)}
                              size="sm"
                              variant="outline"
                            >
                              <Icon name="Check" className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => setEditingTracking(null)}
                              size="sm"
                              variant="ghost"
                            >
                              <Icon name="X" className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {order.tracking_number || "—"}
                            </span>
                            <Button
                              onClick={() => handleTrackingEdit(order)}
                              size="sm"
                              variant="ghost"
                            >
                              <Icon name="Pencil" className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => onViewDetails(order.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Icon name="Eye" className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => onDelete(order.id)}
                            variant="destructive"
                            size="sm"
                          >
                            <Icon name="Trash2" className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showOrderDialog && selectedOrder && (
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Заказ #{selectedOrder.id}</DialogTitle>
              <DialogDescription>
                Создан: {new Date(selectedOrder.created_at).toLocaleString("ru-RU")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="mb-2 font-semibold">Информация о клиенте</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Имя:</span>{" "}
                      {selectedOrder.customer_name}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      {selectedOrder.customer_email}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Телефон:</span>{" "}
                      {selectedOrder.customer_phone}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Адрес:</span>{" "}
                      {selectedOrder.customer_address}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold">Информация о заказе</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Статус:</span>{" "}
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {getStatusText(selectedOrder.status)}
                      </Badge>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Способ оплаты:</span>{" "}
                      {selectedOrder.payment_method === "card"
                        ? "Банковская карта"
                        : "Наличные"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Трек-номер:</span>{" "}
                      {selectedOrder.tracking_number || "—"}
                    </p>
                    <p className="text-lg font-semibold">
                      Итого: {selectedOrder.total_amount.toLocaleString()} ₽
                    </p>
                  </div>
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Товары</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded border p-2"
                      >
                        <div className="flex items-center gap-3">
                          {item.product_image && (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="h-12 w-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.price.toLocaleString()} ₽ × {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold">
                          {(item.price * item.quantity).toLocaleString()} ₽
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={() => setShowOrderDialog(false)}
                variant="outline"
              >
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default OrdersManager;