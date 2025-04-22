/**
 * Razorpay configuration
 */
export const RAZORPAY_CONFIG = {
  // API key ID from the backend - used as fallback if API call fails
  KEY_ID: "rzp_test_hZlsBrrU5YCptn",

  // Currency settings
  DEFAULT_CURRENCY: "INR",

  // Theme
  THEME_COLOR: "#000",

  // Merchant details
  MERCHANT_NAME: "Ticket Booking System",

  // Script
  SCRIPT_URL: "https://checkout.razorpay.com/v1/checkout.js",

  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // ms
};
