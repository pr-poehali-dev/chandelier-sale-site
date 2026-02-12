/**
 * Robokassa Payment Button Component
 *
 * Кнопка для инициации оплаты через Robokassa.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  useRobokassa,
  openPaymentPage,
  type CartItem,
  type PaymentPayload,
} from "./useRobokassa";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

// ============================================================================
// ТИПЫ
// ============================================================================

interface PaymentButtonProps {
  /** URL API бекенда */
  apiUrl: string;
  /** Сумма к оплате */
  amount: number;
  /** Данные покупателя */
  userName: string;
  userEmail: string;
  userPhone: string;
  userAddress?: string;
  orderComment?: string;
  /** Товары в корзине */
  cartItems: CartItem[];
  /** URL редиректа после успешной оплаты */
  successUrl?: string;
  /** URL редиректа при отмене оплаты */
  failUrl?: string;
  /** Callback при успешной оплате */
  onSuccess?: (orderNumber: string) => void;
  /** Callback при ошибке */
  onError?: (error: Error) => void;
  /** Текст кнопки */
  buttonText?: string;
  /** CSS класс */
  className?: string;
  /** Отключена */
  disabled?: boolean;
  /** Показывать живые логи */
  showLogs?: boolean;
}

// ============================================================================
// КОМПОНЕНТ
// ============================================================================

export function PaymentButton({
  apiUrl,
  amount,
  userName,
  userEmail,
  userPhone,
  userAddress,
  orderComment,
  cartItems,
  successUrl,
  failUrl,
  onSuccess,
  onError,
  buttonText = "Оплатить",
  className = "",
  disabled = false,
  showLogs = false,
}: PaymentButtonProps): React.ReactElement {
  const [isPending, setIsPending] = useState(false);
  const [logs, setLogs] = useState<Array<{ time: string; message: string; type: 'info' | 'success' | 'error' }>>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    setLogs(prev => [...prev, { time, message, type }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const { createPayment, isLoading, error } = useRobokassa({
    apiUrl,
    onSuccess,
    onError,
  });

  const handleClick = async () => {
    if (disabled || isLoading || isPending) return;

    setIsPending(true);
    setLogs([]);

    try {
      addLog('🚀 Начало создания заказа', 'info');
      addLog(`💰 Сумма: ${amount} ₽`, 'info');
      addLog(`👤 Покупатель: ${userName} (${userEmail})`, 'info');
      addLog(`📱 Телефон: ${userPhone}`, 'info');
      addLog(`📦 Товаров в корзине: ${cartItems.length}`, 'info');

      const payload: PaymentPayload = {
        amount,
        userName,
        userEmail,
        userPhone,
        userAddress,
        orderComment,
        cartItems,
        successUrl,
        failUrl,
      };

      addLog(`📤 Отправка запроса на ${apiUrl}`, 'info');
      addLog(`📋 Payload: ${JSON.stringify(payload, null, 2)}`, 'info');

      const startTime = performance.now();
      const result = await createPayment(payload);
      const endTime = performance.now();

      addLog(`⏱️ Время выполнения: ${(endTime - startTime).toFixed(0)}ms`, 'info');
      addLog(`✅ Заказ создан! Order ID: ${result.order_id}`, 'success');
      addLog(`📝 Номер заказа: ${result.order_number}`, 'success');
      addLog(`🔢 Robokassa InvId: ${result.robokassa_inv_id}`, 'success');
      addLog(`🔗 Payment URL: ${result.payment_url}`, 'success');
      addLog(`🌐 Переход на страницу оплаты...`, 'info');

      // Открываем страницу оплаты
      openPaymentPage(result.payment_url);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      addLog(`❌ ОШИБКА: ${error.message}`, 'error');
      addLog(`🔍 Stack: ${error.stack || 'N/A'}`, 'error');
      console.error("Payment error:", err);
    } finally {
      setIsPending(false);
    }
  };

  const isDisabled = disabled || isLoading || isPending;
  const buttonLabel = isLoading || isPending ? "Загрузка..." : buttonText;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={className}
        style={{
          opacity: isDisabled ? 0.6 : 1,
          cursor: isDisabled ? "not-allowed" : "pointer",
        }}
      >
        {buttonLabel}
      </button>

      {showLogs && logs.length > 0 && (
        <Card className="p-4 bg-gray-900 text-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">📊 Живые логи</h3>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Очистить
            </button>
          </div>
          <ScrollArea className="h-64">
            <div className="space-y-1 font-mono text-xs">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${
                    log.type === 'error'
                      ? 'text-red-400'
                      : log.type === 'success'
                      ? 'text-green-400'
                      : 'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500">{log.time}</span>
                  <span className="whitespace-pre-wrap break-all">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// ПРИМЕР ИСПОЛЬЗОВАНИЯ
// ============================================================================

/*
import { PaymentButton } from "./PaymentButton";

function CheckoutPage() {
  const cartItems = [
    { id: "1", name: "Товар 1", price: 1000, quantity: 2 },
    { id: "2", name: "Товар 2", price: 500, quantity: 1 },
  ];

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <PaymentButton
      apiUrl={func2url.robokassa}
      amount={total}
      userName="Иван Иванов"
      userEmail="ivan@example.com"
      userPhone="+79991234567"
      userAddress="Москва, ул. Примерная, д. 1"
      cartItems={cartItems}
      successUrl="https://your-site.com/success"
      failUrl="https://your-site.com/failed"
      onSuccess={(orderNumber) => {
        console.log("Оплачен заказ:", orderNumber);
      }}
      onError={(error) => {
        console.error("Ошибка оплаты:", error);
      }}
      buttonText="Оплатить заказ"
      className="btn btn-primary"
    />
  );
}
*/