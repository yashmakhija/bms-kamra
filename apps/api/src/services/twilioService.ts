import twilio from "twilio";
import { config } from "../config";

const twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);

export const sendOtpSms = async (
  phone: string,
  code: string
): Promise<boolean> => {
  try {
    const formattedPhone = formatPhoneNumber(phone);

    await twilioClient.messages.create({
      body: `Your BMS verification code is: ${code}`,
      from: config.twilio.phoneNumber,
      to: formattedPhone,
    });

    return true;
  } catch (error) {
    console.error("Failed to send OTP SMS:", error);
    return false;
  }
};

/**
 * Format phone number to E.164 format for Twilio
 */
const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");

  // Add + prefix if not present
  if (!digitsOnly.startsWith("+")) {
    return `+${digitsOnly}`;
  }

  return phone;
};
