import type { PaymentStatus, ServiceType } from "@/types/wellness";

export const BOOKING_OPEN_TIME = "10:00";
export const BOOKING_LAST_START_TIME = "18:00";
export const BOOKING_TIME_STEP_SECONDS = 5 * 60;
export const BOOKING_AVAILABILITY_SUMMARY = "Tuesday to Saturday, 10:00 AM to 7:00 PM";
export const BOOKING_AVAILABILITY_DETAIL =
  "Sessions begin from 10:00 AM, finish by 7:00 PM, and the last available start time is 6:00 PM. Start times can be chosen in 5-minute increments.";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export const formatDisplayDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
};

export const formatDisplayTime = (value: string) => {
  const [hours = "0", minutes = "0"] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export const getTodayDateInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatServiceType = (value: ServiceType) => {
  switch (value) {
    case "family":
      return "Family Therapy";
    case "corporate":
      return "Corporate Wellness";
    default:
      return "Individual Therapy";
  }
};

export const formatCurrencyAmount = (amount: number, currency = "KES") => {
  if (!Number.isFinite(amount)) {
    return `${currency} 0`;
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
};

export const formatPaymentStatus = (status: PaymentStatus) => {
  switch (status) {
    case "stk_push_sent":
      return "STK push sent";
    case "timed_out":
      return "Timed out";
    case "insufficient_funds":
      return "Insufficient funds";
    default:
      return status
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const stripHtml = (value: string) =>
  value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const estimateReadTime = (html: string) => {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
};

export const markdownToHtml = (markdown: string) => {
  const lines = markdown.split("\n");
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) {
      return;
    }

    const content = paragraph.join(" ");
    blocks.push(`<p>${inlineMarkdown(content)}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) {
      return;
    }

    blocks.push(`<ul>${listItems.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push(`<h3>${inlineMarkdown(trimmed.replace("### ", ""))}</h3>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(`<h2>${inlineMarkdown(trimmed.replace("## ", ""))}</h2>`);
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph();
      listItems.push(trimmed.replace("- ", ""));
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks.join("");
};

const inlineMarkdown = (value: string) =>
  value
    .replace(/!\[(.*?)\]\((.*?)\)/g, "<img src='$2' alt='$1' />")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
