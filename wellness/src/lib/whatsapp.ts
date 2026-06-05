const DEFAULT_WHATSAPP_MESSAGE =
  "Hello, thank you for reaching out to book an appointment with us.\nWhen would you like to schedule your appointment?";

export const getWhatsAppHref = (phoneNumber: string, message = DEFAULT_WHATSAPP_MESSAGE) => {
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");

  if (!cleanPhoneNumber) {
    return "";
  }

  return `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(message)}`;
};
