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
  MERCHANT_NAME: "Kunal Kamra App",
  MERCHANT_EMAIL: "kunal@kunalkamra.in",
  MERCHANT_PHONE: "+919826000000",
  MERCHANT_ADDRESS: "123, Main St, Anytown, India",
  MERCHANT_WEBSITE: "https://kunalkamra.in",
  MERCHANT_LOGO: "/logo.png",
  MERCHANT_DESCRIPTION: "Kunal Kamra App",
  MERCHANT_TERMS_AND_CONDITIONS: "https://kunalkamra.in/terms-and-conditions",
  MERCHANT_PRIVACY_POLICY: "https://kunalkamra.in/privacy-policy",
  MERCHANT_REFUND_POLICY: "https://kunalkamra.in/refund-policy",
  

  // Script
  SCRIPT_URL: "https://checkout.razorpay.com/v1/checkout.js",

  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // ms
};
