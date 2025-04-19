import { apiClient } from "./api-client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Client-side Razorpay integration
 */
export class RazorpayClient {
  /**
   * Load the Razorpay script
   */
  static loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof window !== "undefined" && window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load Razorpay script"));
      document.body.appendChild(script);
    });
  }

  /**
   * Initialize payment for a booking
   */
  static async initializePayment(
    bookingId: string,
    options: {
      name: string;
      description: string;
      prefill?: {
        name?: string;
        email?: string;
        contact?: string;
      };
      theme?: {
        color?: string;
      };
      onSuccess: (data: any) => void;
      onError: (error: any) => void;
    }
  ): Promise<void> {
    try {
      // 1. Load Razorpay script if not already loaded
      await this.loadScript();

      // 2. Create Razorpay order
      const orderData = await apiClient.createRazorpayOrder(bookingId);

      // 3. Configure Razorpay options
      const razorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: options.name,
        description: options.description,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // 4. Verify payment with backend
            const verificationData = {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            };

            const result = await apiClient.verifyRazorpayPayment(
              bookingId,
              verificationData
            );

            // 5. Call success callback
            options.onSuccess(result);
          } catch (error) {
            options.onError(error);
          }
        },
        prefill: options.prefill || {},
        theme: options.theme || { color: "#3399cc" },
        modal: {
          ondismiss: function () {
            options.onError(new Error("Payment canceled by user"));
          },
        },
      };

      // 6. Initialize Razorpay checkout
      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    } catch (error) {
      options.onError(error);
    }
  }

  /**
   * Check if Razorpay is configured on the server
   */
  static async isConfigured(): Promise<boolean> {
    try {
      const status = await apiClient.getRazorpayStatus();
      return status.status === "configured";
    } catch {
      return false;
    }
  }
}
