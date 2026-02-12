/**
 * Robokassa Payment Hook
 *
 * Хук для интеграции с Robokassa в React приложении.
 */
import { useState, useCallback } from "react";

// ============================================================================
// ТИПЫ
// ============================================================================

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PaymentPayload {
  amount: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  userAddress?: string;
  orderComment?: string;
  cartItems: CartItem[];
  successUrl?: string;
  failUrl?: string;
}

export interface PaymentResponse {
  payment_url: string;
  order_id: number;
  order_number: string;
  robokassa_inv_id: number;
  amount: string;
}

interface UseRobokassaOptions {
  apiUrl: string;
  onSuccess?: (orderNumber: string) => void;
  onError?: (error: Error) => void;
}

interface UseRobokassaReturn {
  createPayment: (payload: PaymentPayload) => Promise<PaymentResponse>;
  isLoading: boolean;
  error: Error | null;
  paymentUrl: string | null;
  orderNumber: string | null;
}

// ============================================================================
// ХУК
// ============================================================================

export function useRobokassa(options: UseRobokassaOptions): UseRobokassaReturn {
  const { apiUrl, onError } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  /**
   * Создаёт платёж и возвращает ссылку на оплату
   */
  const createPayment = useCallback(
    async (payload: PaymentPayload): Promise<PaymentResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('🚀 useRobokassa: Начало создания платежа');
        console.log('📋 useRobokassa: Payload', payload);
        console.log('🌐 useRobokassa: API URL', apiUrl);

        const requestBody = {
          amount: payload.amount,
          user_name: payload.userName,
          user_email: payload.userEmail,
          user_phone: payload.userPhone,
          user_address: payload.userAddress,
          order_comment: payload.orderComment,
          cart_items: payload.cartItems,
          success_url: payload.successUrl,
          fail_url: payload.failUrl,
        };

        console.log('📤 useRobokassa: Request body', JSON.stringify(requestBody, null, 2));

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        console.log(`📥 useRobokassa: Response status ${response.status} ${response.statusText}`);
        console.log('🗂️ useRobokassa: Response headers', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('📝 useRobokassa: Raw response', responseText);

        if (!response.ok) {
          let errorData: Record<string, unknown> = {};
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            console.error('❌ useRobokassa: Failed to parse error response as JSON');
          }
          const errorMsg = (errorData.detail as string) || (errorData.error as string) || `HTTP ${response.status}: ${response.statusText}`;
          console.error('❌ useRobokassa: Request failed', errorMsg);
          throw new Error(errorMsg);
        }

        let data: PaymentResponse;
        try {
          data = JSON.parse(responseText);
          console.log('✅ useRobokassa: Parsed response', data);
        } catch (e) {
          console.error('❌ useRobokassa: Failed to parse success response as JSON');
          throw new Error('Invalid JSON response from payment API');
        }

        setPaymentUrl(data.payment_url);
        setOrderNumber(data.order_number);

        console.log('💾 useRobokassa: Saving to localStorage', data.order_number);
        localStorage.setItem("pending_order", data.order_number);

        console.log('🎉 useRobokassa: Payment created successfully');
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        console.error('🔥 useRobokassa: Fatal error', error);
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, onError]
  );

  return {
    createPayment,
    isLoading,
    error,
    paymentUrl,
    orderNumber,
  };
}

// ============================================================================
// УТИЛИТЫ
// ============================================================================

/**
 * Открывает страницу оплаты
 * На мобильных устройствах открывает в новом окне
 */
export function openPaymentPage(paymentUrl: string): void {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    window.open(paymentUrl, "_blank");
  } else {
    window.location.href = paymentUrl;
  }
}

/**
 * Форматирует телефон в формат +7 (XXX) XXX-XX-XX
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 0) return "";
  if (digits.length <= 1) return `+${digits}`;
  if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)}`;
  if (digits.length <= 7)
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  if (digits.length <= 9)
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;

  return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Валидирует email
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Валидирует телефон (11 цифр)
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 11;
}