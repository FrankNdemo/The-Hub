import { Fragment, type ReactNode, type SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  X,
  Briefcase,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Copy,
  Home,
  LoaderCircle,
  Mail,
  MapPin,
  Landmark,
  ShieldCheck,
  Smartphone,
  User,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { useFormDrafts, type BookingDraft, type BookingDraftForm, type BookingStep } from "@/context/FormDraftContext";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { rememberBookingAccess } from "@/lib/bookingAccess";
import {
  ApiError,
  fetchAvailableBookingTherapists,
  fetchBookingPaymentStatus,
  getApiErrorMessage,
  getSuggestedBookingSlot,
  precheckBooking,
  retryBookingCheckout,
  startBookingCheckout,
  submitManualBookingPayment,
} from "@/lib/api";
import {
  BOOKING_AVAILABILITY_DETAIL,
  BOOKING_AVAILABILITY_SUMMARY,
  BOOKING_LAST_START_TIME,
  BOOKING_OPEN_TIME,
  BOOKING_TIME_STEP_SECONDS,
  formatCurrencyAmount,
  formatDisplayDate,
  formatDisplayTime,
  formatServiceType,
  getTodayDateInputValue,
} from "@/lib/wellness";
import type {
  BookingCheckoutResponse,
  BookingPaymentRecord,
  ServiceType,
  SessionType,
  TherapistProfile,
} from "@/types/wellness";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LeafBannerHeading from "@/components/LeafBannerHeading";
import ScrollReveal from "@/components/ScrollReveal";
import WellnessLogo from "@/components/WellnessLogo";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import leafDecor from "@/assets/leaf-decoration.png";

const REVIEW_GARDEN_IMAGE_URL =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";

const resolveStateUpdate = <T,>(value: SetStateAction<T>, current: T) =>
  typeof value === "function" ? (value as (current: T) => T)(current) : value;

const STK_SENT_PROMOTE_DELAY_MS = 900;
const PAYMENT_STATUS_FAST_POLL_INTERVAL_MS = 1000;
const PAYMENT_STATUS_SLOW_POLL_INTERVAL_MS = 2500;
const PAYMENT_STATUS_FAST_POLL_WINDOW_MS = 18000;
const DEFAULT_BOOKING_FEE_AMOUNT = 200;
const MANUAL_PAYMENT_PAYBILL = "714777";
const MANUAL_PAYMENT_ACCOUNT = "0726759850";
const MANUAL_PAYMENT_SEND_MONEY_NUMBER = "0726759850";
const BOOKING_OPEN_MINUTES = 10 * 60;
const BOOKING_LAST_START_MINUTES = 18 * 60;
const BOOKING_DATE_ERROR = "Adjust the date - we operate Tuesday to Saturday.";
const BOOKING_TIME_ERROR = "Choose a time from 10:00 AM to 6:00 PM. Sessions end by 7:00 PM.";

const FINAL_PAYMENT_STATUSES: BookingPaymentRecord["status"][] = [
  "success",
  "failed",
  "cancelled",
  "timed_out",
  "insufficient_funds",
];

const serviceCards: {
  type: ServiceType;
  title: string;
  description: string;
  icon: typeof Video;
}[] = [
  {
    type: "individual",
    title: "Individual",
    description: "One-on-one sessions",
    icon: User,
  },
  {
    type: "family",
    title: "Family",
    description: "Family & couples support",
    icon: Users,
  },
  {
    type: "corporate",
    title: "Corporate",
    description: "Team & workplace programs",
    icon: Briefcase,
  },
];

const sessionCards: {
  type: SessionType;
  title: string;
  description: string;
  icon: typeof Video;
}[] = [
  {
    type: "virtual",
    title: "Virtual",
    description: "Online with a calendar-ready session link",
    icon: Video,
  },
  {
    type: "physical",
    title: "Physical",
    description: "In-person at our centre",
    icon: MapPin,
  },
];

const CHECKOUT_STAGE_COPY = [{ label: "Review" }, { label: "Pay" }, { label: "Confirm" }];

const parseDateInput = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isOperatingDate = (value: string) => {
  const date = parseDateInput(value);

  if (!date) {
    return false;
  }

  const day = date.getDay();
  return day >= 2 && day <= 6;
};

const timeInputToMinutes = (value: string) => {
  const [hours, minutes = "0"] = value.split(":");
  const numericHours = Number(hours);
  const numericMinutes = Number(minutes);

  if (!Number.isInteger(numericHours) || !Number.isInteger(numericMinutes)) {
    return null;
  }

  return numericHours * 60 + numericMinutes;
};

const isOperatingTime = (value: string) => {
  const minutes = timeInputToMinutes(value);
  return minutes !== null && minutes >= BOOKING_OPEN_MINUTES && minutes <= BOOKING_LAST_START_MINUTES;
};

const STK_PROMPT_STEPS = [
  "Open the Safaricom prompt on your phone.",
  "Enter your M-Pesa PIN to approve the booking fee.",
  "Return here while we confirm the payment automatically.",
];

const normalizeBookingFeeAmount = (value: unknown, fallback = DEFAULT_BOOKING_FEE_AMOUNT) => {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value) : Number.NaN;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const shouldShowProcessingFeedback = (message: string) =>
  Boolean(message) &&
  !/stk push sent|still being processed|awaiting customer action|transaction is being processed/i.test(message);

const getCheckoutStageIndex = (step: BookingStep) => {
  if (step === "summary") {
    return 0;
  }

  if (step === "payment" || step === "mpesa_payment" || step === "send_money" || step === "send_money_confirmation") {
    return 1;
  }

  return 2;
};

const isBookingConfirmed = (booking?: BookingCheckoutResponse["booking"] | null) =>
  Boolean(booking?.confirmedAt) || booking?.status === "upcoming" || booking?.status === "rescheduled";

const MpesaWordmark = ({ className }: { className?: string }) => (
  <div className={cn("inline-flex items-end gap-1 text-[#2b9a48]", className)} aria-label="M-Pesa">
    <span className="font-black leading-none tracking-[-0.08em] text-[2.05rem]">m</span>
    <span className="relative mb-[0.08rem] flex h-9 w-6 items-center justify-center rounded-[0.5rem] border-[2.5px] border-[#7dc242] bg-white shadow-[0_10px_20px_-14px_rgba(26,74,45,0.55)]">
      <span className="absolute left-1 right-1 top-1 h-1 rounded-full bg-[#d9efcb]" />
      <span className="absolute h-2.5 w-9 -rotate-[16deg] rounded-full bg-[#df4d55]" />
      <span className="absolute h-[3px] w-4 translate-x-[0.42rem] -rotate-[16deg] rounded-full bg-white" />
      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#d9efcb]" />
    </span>
    <span className="font-black leading-none tracking-[-0.05em] text-[1.7rem]">pesa</span>
  </div>
);

const copyPaymentDetail = async (label: string, value: string) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = value;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    toast.success(`${label} copied.`);
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}.`);
  }
};

const CopyDetailButton = ({ label, value }: { label: string; value: string }) => (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    className="h-8 w-8 rounded-full border border-primary/15 bg-white/80 text-primary hover:bg-white"
    onClick={() => void copyPaymentDetail(label, value)}
    aria-label={`Copy ${label}`}
  >
    <Copy className="h-3.5 w-3.5" />
  </Button>
);

const CheckoutStageRail = ({ step }: { step: BookingStep }) => {
  const currentIndex = getCheckoutStageIndex(step);

  return (
    <div className="absolute left-1/2 top-0 z-20 flex w-[min(26rem,calc(100%-3rem))] -translate-x-1/2 -translate-y-1/2 items-center rounded-full border border-primary/10 bg-background/95 px-3 py-1.5 shadow-[0_14px_36px_-30px_rgba(33,49,40,0.5)] backdrop-blur">
      <div className="mx-auto flex w-full items-center gap-2">
        {CHECKOUT_STAGE_COPY.map((stage, index) => {
          const isComplete = currentIndex > index || step === "success";
          const isActive = currentIndex === index && step !== "success";

          return (
            <Fragment key={stage.label}>
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                  isComplete
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/80 bg-background/90 text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="h-3 w-3" /> : index + 1}
              </div>
              {index < CHECKOUT_STAGE_COPY.length - 1 ? (
                <div className={cn("h-px flex-1 rounded-full", currentIndex > index || step === "success" ? "bg-primary/45" : "bg-border/70")} />
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

const MobileStageDots = ({ step }: { step: BookingStep }) => {
  const currentIndex = getCheckoutStageIndex(step);

  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {CHECKOUT_STAGE_COPY.map((stage, index) => {
        const isComplete = currentIndex > index || step === "success";
        const isActive = currentIndex === index && step !== "success";

        return (
          <Fragment key={stage.label}>
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                isComplete
                  ? "border-primary bg-primary text-primary-foreground"
                  : isActive
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/80 bg-background/90 text-muted-foreground",
              )}
            >
              {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </div>
            {index < CHECKOUT_STAGE_COPY.length - 1 ? (
              <div className={cn("h-px flex-1 rounded-full", currentIndex > index || step === "success" ? "bg-primary/45" : "bg-border/70")} />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
};

const MobileSheetLeaves = ({ inverted = false }: { inverted?: boolean }) => (
  <>
    <img
      src={leafDecor}
      alt=""
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -right-8 top-3 w-28 opacity-[0.16] mix-blend-multiply saturate-150 animate-float",
        inverted ? "rotate-[210deg] opacity-[0.18]" : "rotate-[24deg]",
      )}
    />
    <img
      src={leafDecor}
      alt=""
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -left-8 bottom-2 w-24 opacity-[0.14] mix-blend-multiply saturate-150 animate-float animation-delay-200",
        inverted ? "rotate-[24deg]" : "rotate-[198deg]",
      )}
    />
  </>
);

const ProcessingRing = () => (
  <div className="relative mx-auto h-20 w-20 sm:h-24 sm:w-24">
    <div className="absolute inset-0 rounded-full border border-white/12" />
    <div className="absolute inset-[7px] rounded-full border-[3px] border-white/18 border-t-white animate-spin sm:inset-[8px]" />
    <div className="absolute inset-[20px] rounded-full bg-white/6 backdrop-blur-sm sm:inset-[24px]" />
  </div>
);

const MobileStatusSheet = ({
  step,
  eyebrow,
  title,
  description,
  tone = "light",
  indicator,
  bareIndicator = false,
  onClose,
  children,
}: {
  step: BookingStep;
  eyebrow: string;
  title: string;
  description: string;
  tone?: "light" | "dark" | "destructive" | "success";
  indicator: ReactNode;
  bareIndicator?: boolean;
  onClose?: () => void;
  children?: ReactNode;
}) => {
  const isDark = tone === "dark";
  const isSuccess = tone === "success";
  const isDestructive = tone === "destructive";

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (typeof document === "undefined" || !document.body) {
    return null;
  }

  const modal = (
    <div className="sm:hidden">
      <div className="fixed inset-0 z-[140] bg-foreground/24 backdrop-blur-[3px]" aria-hidden="true" />
      <div className="fixed inset-0 z-[141] flex items-center justify-center overflow-y-auto px-4 pb-6 pt-[5.25rem]">
        <div
          className={cn(
            "relative my-auto max-h-[calc(100vh-6.75rem)] w-full max-w-[21.75rem] overflow-y-auto overflow-x-hidden rounded-[1.85rem] border px-4 pb-4 pt-3 shadow-[0_36px_80px_-34px_rgba(17,24,39,0.42)]",
            isDark
              ? "border-white/10 bg-[linear-gradient(180deg,hsl(150_18%_16%),hsl(150_19%_12%))] text-white"
              : isSuccess
                ? "border-primary/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,248,243,0.98))] text-foreground"
                : isDestructive
                  ? "border-destructive/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,244,244,0.98))] text-foreground"
                  : "border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,245,0.98))] text-foreground",
          )}
        >
          <MobileSheetLeaves inverted={isDark} />
          {onClose ? (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute right-3 top-3 z-20 h-7 w-7 rounded-full border",
                isDark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-border/60 bg-white/80 text-muted-foreground hover:bg-white",
              )}
              onClick={onClose}
              aria-label="Close payment message"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div
              className={cn(
                "-mx-4 mb-2.5 w-[calc(100%+2rem)] px-4 pb-1 pt-1",
                isDark ? "bg-[linear-gradient(180deg,rgba(31,49,41,0.96),rgba(31,49,41,0.72),transparent)]" : "bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.72),transparent)]",
              )}
            >
              <div className="flex justify-center">
                <div className="origin-center scale-[0.78]">
                  <WellnessLogo variant="navbar" tone={isDark ? "inverse" : "default"} />
                </div>
              </div>
            </div>
            <p className={cn("text-[10px] font-semibold uppercase tracking-[0.2em]", isDark ? "text-white/68" : "text-primary/72")}>
              Step 3 of 3
            </p>
            <div className="mt-2 w-full">
              <MobileStageDots step={step} />
            </div>
            <div className="mt-3.5">
              {bareIndicator ? indicator : <StatusHalo tone={isSuccess ? "success" : isDestructive ? "destructive" : "primary"}>{indicator}</StatusHalo>}
            </div>
            <p className={cn("mt-3.5 text-[11px] font-semibold uppercase tracking-[0.18em]", isDark ? "text-white/68" : "text-primary/72")}>
              {eyebrow}
            </p>
            <h3 className={cn("mt-2 font-heading text-[1.56rem] font-semibold leading-tight", isDark ? "text-white" : "text-foreground")}>
              {title}
            </h3>
            <p className={cn("mt-2.5 text-sm leading-6", isDark ? "text-white/78" : "text-muted-foreground")}>{description}</p>
            {children ? <div className="mt-3.5 w-full">{children}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

const DesktopStatusDialog = ({ children }: { children: ReactNode }) => {
  if (typeof document === "undefined" || !document.body) {
    return null;
  }

  const modal = (
    <div className="hidden sm:block">
      <div className="fixed inset-0 z-[130] bg-foreground/18 backdrop-blur-[2px]" aria-hidden="true" />
      <div className="fixed inset-0 z-[131] flex items-center justify-center overflow-hidden px-5 py-4">
        <div className="w-full max-w-xl">{children}</div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

const StatusHalo = ({
  tone = "primary",
  children,
}: {
  tone?: "primary" | "success" | "destructive";
  children: ReactNode;
}) => {
  const toneClassName =
    tone === "success"
      ? "border-[hsl(136_38%_42%_/_0.3)] bg-[hsl(136_45%_48%_/_0.15)] text-[hsl(136_58%_72%)]"
      : tone === "destructive"
        ? "border-destructive/25 bg-destructive/10 text-destructive"
        : "border-white/12 bg-white/5 text-[hsl(136_52%_74%)]";

  return (
    <div className="relative mx-auto h-24 w-24 sm:h-28 sm:w-28">
      <div className={cn("absolute inset-0 rounded-full border border-dashed", toneClassName)} />
      <div className="absolute inset-[8px] rounded-full bg-black/10 sm:inset-[10px]" />
      <div className={cn("absolute inset-[14px] flex items-center justify-center rounded-full border sm:inset-[18px]", toneClassName)}>
        {children}
      </div>
    </div>
  );
};

const SummaryCard = ({
  serviceType,
  sessionType,
  date,
  time,
  therapistName,
  bookingAmount,
}: {
  serviceType: ServiceType;
  sessionType: SessionType;
  date: string;
  time: string;
  therapistName: string;
  bookingAmount: number;
}) => (
  <div className="rounded-[1.6rem] border border-border/60 bg-card/95 p-6 shadow-card">
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/75">Session Summary</p>
    <div className="mt-5 space-y-4">
      {[
        {
          icon: Users,
          label: "Session",
          value: `${formatServiceType(serviceType)} ${sessionType === "virtual" ? "Virtual Session" : "In-Person Session"}`,
        },
        {
          icon: CalendarDays,
          label: "Date",
          value: date ? formatDisplayDate(date) : "Select a date",
        },
        {
          icon: Clock3,
          label: "Time",
          value: time ? formatDisplayTime(time) : "Select a time",
        },
        {
          icon: User,
          label: "Therapist",
          value: therapistName,
        },
        {
          icon: Wallet,
          label: "Booking Fee",
          value: formatCurrencyAmount(bookingAmount, "KES"),
        },
      ].map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-3 rounded-[1.3rem] border border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,246,0.88))] px-4 py-3 shadow-[0_14px_30px_-28px_rgba(33,49,40,0.45)]"
        >
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <item.icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/65">{item.label}</p>
            <p className="mt-1 text-base font-medium leading-7 text-foreground">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-5 rounded-[1.2rem] border border-primary/15 bg-primary/8 px-4 py-4 text-sm leading-7 text-muted-foreground">
      To confirm your session, a refundable booking fee is required.
    </div>
  </div>
);

const WhyPayCard = () => (
  <div className="rounded-[1.6rem] border border-primary/15 bg-[linear-gradient(160deg,hsl(136_24%_94%),hsl(42_31%_98%))] p-6 shadow-soft">
    <p className="text-lg font-semibold text-foreground">Why pay a booking fee?</p>
    <div className="mt-5 space-y-3">
      {[
        "Confirms your commitment",
        "Helps reduce no-shows",
        "Ensures quality service",
      ].map((reason) => (
        <div key={reason} className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Check className="h-3.5 w-3.5" />
          </div>
          <p className="text-sm leading-7 text-foreground/85">{reason}</p>
        </div>
      ))}
    </div>
    <div className="mt-6 flex items-start gap-3 rounded-[1.1rem] border border-primary/15 bg-background/80 px-4 py-3 text-sm leading-7 text-muted-foreground">
      <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
      <p>Refundable if cancelled at least 24 hours before the session.</p>
    </div>
  </div>
);

const getFailureCopy = (payment?: BookingPaymentRecord | null) => {
  const safeResultDescription = getSafePaymentFeedback(payment?.resultDescription ?? "");
  const resultDescription = safeResultDescription.toLowerCase();

  switch (payment?.status) {
    case "cancelled":
      return {
        title: "Payment cancelled",
        description: "You cancelled the M-Pesa prompt before approving the booking fee. Your session has not been booked yet.",
      };
    case "timed_out":
      return {
        title: "Payment timed out",
        description: "M-Pesa did not send a final confirmation in time. Your session has not been booked yet, so please try again.",
      };
    case "insufficient_funds":
      return {
        title: "Insufficient funds",
        description: "Your M-Pesa balance is not enough for the booking fee. Top up or use another Safaricom number to continue.",
      };
    default:
      if (resultDescription.includes("pin") || resultDescription.includes("credential") || resultDescription.includes("initiator")) {
        return {
          title: "Incorrect M-Pesa PIN",
          description: safeResultDescription || "The M-Pesa PIN entered on your phone was not accepted. Your session is not booked yet.",
        };
      }

      return {
        title: "Payment not confirmed",
        description:
          safeResultDescription || "We could not confirm the booking fee with M-Pesa. Your session has not been booked yet.",
      };
  }
};

function getSafePaymentFeedback(message: string) {
  const trimmed = message.trim();

  if (!trimmed) {
    return "";
  }

  if (/could not authorize this request|forbidden|permission denied|not authorized|unauthorized/i.test(trimmed)) {
    return "M-Pesa could not verify the checkout request right now. Please try again in a moment.";
  }

  return trimmed;
}

const getApiErrorCode = (error: unknown) => {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== "object") {
    return "";
  }

  const code = (error.data as { code?: unknown }).code;
  return typeof code === "string" ? code : "";
};

const BookingSection = () => {
  const { therapist, therapists } = useWellnessHub();
  const { bookingDraft, setBookingDraft } = useFormDrafts();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTherapistId = searchParams.get("therapist");
  const availableTherapists = useMemo(() => (therapists.length ? therapists : [therapist]), [therapist, therapists]);
  const initialTherapistId =
    (requestedTherapistId && availableTherapists.some((item) => item.id === requestedTherapistId)
      ? requestedTherapistId
      : availableTherapists[0]?.id) ?? therapist.id;
  const sectionRef = useRef<HTMLElement | null>(null);
  const lastScheduleNoticeRef = useRef(0);
  const {
    serviceType,
    sessionType,
    step,
    checkout,
    bookingGuidance,
    paymentFeedback,
    sendMoneyNumber,
    mpesaConfirmationCode,
    paidMobileName,
    currentBookingFeeAmount,
    retryStartOverRequired,
    form,
    paymentPhone,
  } = bookingDraft;
  const setBookingDraftField = <K extends keyof BookingDraft>(field: K, value: SetStateAction<BookingDraft[K]>) => {
    setBookingDraft((current) => ({
      ...current,
      [field]: resolveStateUpdate(value, current[field]),
    }));
  };
  const setServiceType = (value: SetStateAction<ServiceType>) => setBookingDraftField("serviceType", value);
  const setSessionType = (value: SetStateAction<SessionType>) => setBookingDraftField("sessionType", value);
  const setStep = (value: SetStateAction<BookingStep>) => setBookingDraftField("step", value);
  const setCheckout = (value: SetStateAction<BookingCheckoutResponse | null>) => setBookingDraftField("checkout", value);
  const setBookingGuidance = (value: SetStateAction<string>) => setBookingDraftField("bookingGuidance", value);
  const setPaymentFeedback = (value: SetStateAction<string>) => setBookingDraftField("paymentFeedback", value);
  const setSendMoneyNumber = (value: SetStateAction<string>) => setBookingDraftField("sendMoneyNumber", value);
  const setMpesaConfirmationCode = (value: SetStateAction<string>) => setBookingDraftField("mpesaConfirmationCode", value);
  const setPaidMobileName = (value: SetStateAction<string>) => setBookingDraftField("paidMobileName", value);
  const setCurrentBookingFeeAmount = (value: SetStateAction<number>) => setBookingDraftField("currentBookingFeeAmount", value);
  const setRetryStartOverRequired = (value: SetStateAction<boolean>) => setBookingDraftField("retryStartOverRequired", value);
  const setForm = (value: SetStateAction<BookingDraftForm>) => setBookingDraftField("form", value);
  const setPaymentPhone = (value: SetStateAction<string>) => setBookingDraftField("paymentPhone", value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTherapists, setIsLoadingTherapists] = useState(false);
  const [preparedPrecheck, setPreparedPrecheck] = useState<{ key: string; amount: number } | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState("Choose a date and time to check live availability first.");
  const [slotTherapists, setSlotTherapists] = useState<TherapistProfile[] | null>(null);
  const [serviceDescriptionText, setServiceDescriptionText] = useState("");
  const [isDeletingServiceDescription, setIsDeletingServiceDescription] = useState(false);
  const activeServiceCard = serviceCards.find((item) => item.type === serviceType) ?? serviceCards[0];
  const selectableTherapists = slotTherapists ?? availableTherapists;
  const selectedTherapist =
    selectableTherapists.find((item) => item.id === form.therapistId) ?? selectableTherapists[0] ?? therapist;
  const availableTherapistIds = useMemo(() => availableTherapists.map((item) => item.id).join("|"), [availableTherapists]);
  const todayDate = getTodayDateInputValue();
  const bookingDateError = form.date && !isOperatingDate(form.date) ? BOOKING_DATE_ERROR : "";
  const bookingTimeError = form.time && !isOperatingTime(form.time) ? BOOKING_TIME_ERROR : "";
  const hasScheduleValidationError = Boolean(bookingDateError || bookingTimeError);

  const activePayment = checkout?.payment ?? null;
  const retryLimitReached = Boolean(
    activePayment &&
      FINAL_PAYMENT_STATUSES.includes(activePayment.status) &&
      !activePayment.canRetry &&
      !isBookingConfirmed(checkout?.booking ?? null),
  );
  const retryAttemptsRemaining = activePayment?.retryAttemptsRemaining ?? 3;
  const retryButtonLabel =
    retryStartOverRequired || retryLimitReached
      ? "Start Fresh Booking"
      : isSubmitting
        ? "Sending STK Push..."
        : retryAttemptsRemaining > 0
          ? `Try Again (${retryAttemptsRemaining} left)`
          : "Try Again";
  const failureCopy = retryStartOverRequired || retryLimitReached
    ? {
        title: "Start a fresh booking",
        description:
          "You have used the 3 M-Pesa retry attempts for this booking. Please start a fresh booking to continue.",
      }
    : getFailureCopy(activePayment);

  const bookingAmount = useMemo(
    () => normalizeBookingFeeAmount(checkout?.booking.bookingFeeAmount, currentBookingFeeAmount),
    [checkout?.booking.bookingFeeAmount, currentBookingFeeAmount],
  );
  const precheckKey = useMemo(() => {
    const participantCount = serviceType === "corporate" ? form.participantCount.trim() : "";
    const requiredValues = [
      form.clientName.trim(),
      form.clientEmail.trim(),
      form.clientPhone.trim(),
      form.therapistId,
      form.date,
      form.time,
      serviceType,
      sessionType,
      participantCount,
    ];

    return requiredValues.every(Boolean) ? requiredValues.join("|") : "";
  }, [
    form.clientEmail,
    form.clientName,
    form.clientPhone,
    form.date,
    form.participantCount,
    form.therapistId,
    form.time,
    serviceType,
    sessionType,
  ]);
  const hasNoAvailableTherapists = Boolean(form.date && form.time && slotTherapists && slotTherapists.length === 0);
  const canSubmitDetails = !isLoadingTherapists && !hasNoAvailableTherapists && !hasScheduleValidationError;

  const updateField = (field: keyof typeof form, value: string) => {
    setBookingGuidance("");
    setCheckout(null);
    setPaymentFeedback("");
    setRetryStartOverRequired(false);
    setPreparedPrecheck(null);
    if (field === "date" || field === "time") {
      setAvailabilityMessage("Checking live availability first...");
      setSlotTherapists(null);
    }
    setForm((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    setForm((current) => {
      const requestedId =
        requestedTherapistId && availableTherapists.some((item) => item.id === requestedTherapistId)
          ? requestedTherapistId
          : "";
      const fallbackId = availableTherapists[0]?.id ?? therapist.id;
      const nextTherapistId =
        requestedId || (availableTherapists.some((item) => item.id === current.therapistId) ? current.therapistId : fallbackId);

      return current.therapistId === nextTherapistId ? current : { ...current, therapistId: nextTherapistId };
    });
  }, [availableTherapistIds, availableTherapists, requestedTherapistId, therapist.id]);

  useEffect(() => {
    setServiceDescriptionText("");
    setIsDeletingServiceDescription(false);
  }, [serviceType]);

  useEffect(() => {
    if (step !== "details") {
      return;
    }

    if (!form.date || !form.time) {
      setSlotTherapists(null);
      setAvailabilityMessage("Choose a date and time to check live availability first.");
      setIsLoadingTherapists(false);
      return;
    }

    if (hasScheduleValidationError) {
      setSlotTherapists(null);
      setAvailabilityMessage("Adjust the date or time to check live availability.");
      setIsLoadingTherapists(false);
      return;
    }

    let isActive = true;
    const timeoutId = window.setTimeout(() => {
      setIsLoadingTherapists(true);
      setAvailabilityMessage("Checking live availability first...");

      fetchAvailableBookingTherapists(form.date, form.time)
        .then((response) => {
          if (!isActive) {
            return;
          }

          const available = response.therapists.length ? response.therapists : [];
          setSlotTherapists(available);
          setForm((current) => {
            if (available.some((item) => item.id === current.therapistId)) {
              return current;
            }

            return { ...current, therapistId: available[0]?.id ?? "" };
          });

          setAvailabilityMessage(
            available.length
              ? `${available.length} therapist${available.length === 1 ? "" : "s"} available for this slot.`
              : "No therapist is available for this exact time. Please choose another slot.",
          );
        })
        .catch(() => {
          if (!isActive) {
            return;
          }

          setSlotTherapists(null);
          setAvailabilityMessage("We could not refresh live availability. You can still submit, and we will confirm before payment.");
        })
        .finally(() => {
          if (isActive) {
            setIsLoadingTherapists(false);
          }
        });
    }, 300);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [form.date, form.time, hasScheduleValidationError, step]);

  useEffect(() => {
    if (step !== "details" || !precheckKey || isLoadingTherapists || hasNoAvailableTherapists) {
      return;
    }

    let isActive = true;
    const timeoutId = window.setTimeout(() => {
      const participantCount =
        serviceType === "corporate" && form.participantCount
          ? Number.parseInt(form.participantCount, 10)
          : undefined;

      precheckBooking({
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        clientPhone: form.clientPhone,
        therapistId: form.therapistId,
        date: form.date,
        time: form.time,
        serviceType,
        participantCount,
        sessionType,
        notes: form.notes,
      })
        .then((precheck) => {
          if (!isActive) {
            return;
          }

          setCurrentBookingFeeAmount(normalizeBookingFeeAmount(precheck.bookingFeeAmount, currentBookingFeeAmount));
          setPreparedPrecheck({ key: precheckKey, amount: normalizeBookingFeeAmount(precheck.bookingFeeAmount, currentBookingFeeAmount) });
        })
        .catch(() => {
          if (isActive) {
            setPreparedPrecheck(null);
          }
        });
    }, 450);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [
    currentBookingFeeAmount,
    form.clientEmail,
    form.clientName,
    form.clientPhone,
    form.date,
    form.notes,
    form.participantCount,
    form.therapistId,
    form.time,
    hasNoAvailableTherapists,
    isLoadingTherapists,
    precheckKey,
    serviceType,
    sessionType,
    step,
  ]);

  useEffect(() => {
    const target = activeServiceCard.description;
    const delay =
      !isDeletingServiceDescription && serviceDescriptionText === target
        ? 3000
        : isDeletingServiceDescription
          ? 35
          : 55;

    const timeout = window.setTimeout(() => {
      if (!isDeletingServiceDescription && serviceDescriptionText === target) {
        setIsDeletingServiceDescription(true);
        return;
      }

      if (isDeletingServiceDescription && serviceDescriptionText === "") {
        setIsDeletingServiceDescription(false);
        return;
      }

      setServiceDescriptionText((current) =>
        isDeletingServiceDescription
          ? target.slice(0, Math.max(0, current.length - 1))
          : target.slice(0, current.length + 1),
      );
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [activeServiceCard.description, isDeletingServiceDescription, serviceDescriptionText]);

  useEffect(() => {
    if (step !== "stk_sent" && step !== "processing") {
      return;
    }

    if (!checkout?.booking.token || !checkout.payment.id) {
      return;
    }

    let isActive = true;
    let nextPollTimer: number | undefined;
    const pollingStartedAt = Date.now();
    const promoteTimer = window.setTimeout(() => {
      if (isActive) {
        setStep((current) => (current === "stk_sent" ? "processing" : current));
      }
    }, STK_SENT_PROMOTE_DELAY_MS);

    const scheduleNextPoll = () => {
      if (!isActive) {
        return;
      }

      const elapsed = Date.now() - pollingStartedAt;
      const delay =
        elapsed < PAYMENT_STATUS_FAST_POLL_WINDOW_MS
          ? PAYMENT_STATUS_FAST_POLL_INTERVAL_MS
          : PAYMENT_STATUS_SLOW_POLL_INTERVAL_MS;

      nextPollTimer = window.setTimeout(() => {
        void pollPayment();
      }, delay);
    };

    const pollPayment = async () => {
      try {
        const latest = await fetchBookingPaymentStatus(checkout.booking.token, checkout.payment.id);
        if (!isActive) {
          return;
        }

        setCheckout(latest);
        const latestStatus = latest.payment.status;
        const latestFeedback = getSafePaymentFeedback(latest.payment.resultDescription ?? "");
        setPaymentFeedback(latestStatus === "processing" && shouldShowProcessingFeedback(latestFeedback) ? latestFeedback : "");

        if (isBookingConfirmed(latest.booking)) {
          rememberBookingAccess(latest.booking.token, form.clientEmail.trim());
          setStep("success");
          return;
        }

        if (latestStatus === "success") {
          rememberBookingAccess(latest.booking.token, form.clientEmail.trim());
          setStep("success");
          return;
        }

        if (FINAL_PAYMENT_STATUSES.includes(latestStatus)) {
          setStep("failed");
          return;
        }

        setStep((current) => (current === "stk_sent" ? "stk_sent" : "processing"));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setPaymentFeedback(getSafePaymentFeedback(getApiErrorMessage(error, "We could not refresh the payment status just now.")));
      }

      scheduleNextPoll();
    };

    void pollPayment();

    return () => {
      isActive = false;
      window.clearTimeout(promoteTimer);
      if (nextPollTimer !== undefined) {
        window.clearTimeout(nextPollTimer);
      }
    };
  }, [checkout?.booking.token, checkout?.payment.id, form.clientEmail, step]);

  useEffect(() => {
    if (step !== "success" || !checkout?.booking.token) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigate(`/manage/${checkout.booking.token}?booking=success`);
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [checkout?.booking.token, navigate, step]);

  useEffect(() => {
    if (step !== "manual_review" || !checkout?.booking.token) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigate(`/manage/${checkout.booking.token}?booking=success`);
    }, 3600);

    return () => window.clearTimeout(timeoutId);
  }, [checkout?.booking.token, navigate, step]);

  useEffect(() => {
    if (step === "details") {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [step]);

  const handleServiceTypeSelect = (value: ServiceType) => {
    setServiceType(value);
    setForm((current) => ({
      ...current,
      participantCount: value === "corporate" ? current.participantCount : "",
    }));
  };

  const showScheduleWindowNotice = () => {
    const now = Date.now();

    if (now - lastScheduleNoticeRef.current < 4500) {
      return;
    }

    lastScheduleNoticeRef.current = now;
    toast.info("Sessions begin from 10:00 AM, finish by 7:00 PM, and the last available start time is 6:00 PM. Start times can be chosen in 5-minute increments.");
  };

  const handleDetailsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoadingTherapists) {
      toast.error("Please wait a moment while we finish checking this slot.");
      return;
    }

    if (hasScheduleValidationError) {
      toast.error("Please adjust the preferred date or time before continuing.");
      return;
    }

    if (hasNoAvailableTherapists) {
      toast.error("No therapist is available for this exact time. Please choose another date or time.");
      return;
    }

    setBookingGuidance("");
    setPaymentFeedback("");
    setRetryStartOverRequired(false);
    setCheckout(null);
    setPaymentPhone(form.clientPhone);
    setSendMoneyNumber(MANUAL_PAYMENT_SEND_MONEY_NUMBER);
    setMpesaConfirmationCode("");
    setPaidMobileName("");

    if (preparedPrecheck?.key === precheckKey) {
      setCurrentBookingFeeAmount(preparedPrecheck.amount);
    }

    setStep("summary");
  };

  const handleStartPayment = async () => {
    if (retryStartOverRequired || retryLimitReached) {
      startFreshBooking();
      return;
    }

    const participantCount =
      serviceType === "corporate" && form.participantCount
        ? Number.parseInt(form.participantCount, 10)
        : undefined;

    setIsSubmitting(true);
    setPaymentFeedback("");
    const isRetryAttempt = Boolean(checkout?.payment.canRetry && checkout.booking.token);

    try {
      const nextCheckout =
        isRetryAttempt
          ? await retryBookingCheckout(checkout.booking.token, paymentPhone)
          : await startBookingCheckout({
              clientName: form.clientName,
              clientEmail: form.clientEmail,
              clientPhone: form.clientPhone,
              therapistId: form.therapistId,
              date: form.date,
              time: form.time,
              serviceType,
              participantCount,
              sessionType,
              notes: form.notes,
              mpesaPhoneNumber: paymentPhone,
            });

      setCheckout(nextCheckout);
      setCurrentBookingFeeAmount(normalizeBookingFeeAmount(nextCheckout.booking.bookingFeeAmount, bookingAmount));
      setRetryStartOverRequired(false);
      setStep("stk_sent");
      toast.success("STK push sent. Check your phone to complete the payment.");
    } catch (error) {
      const message = getSafePaymentFeedback(getApiErrorMessage(error, "We could not start the M-Pesa payment right now."));
      const suggestion = getSuggestedBookingSlot(error);

      if (isRetryAttempt && getApiErrorCode(error) === "mpesa_retry_limit_reached") {
        setRetryStartOverRequired(true);
        setPaymentFeedback(message);
        setStep("failed");
        toast.error(message);
        return;
      }

      if (suggestion) {
        setForm((current) => ({
          ...current,
          date: suggestion.date,
          time: suggestion.time,
        }));
        setBookingGuidance(`${message} We prefilled the next available option so you can continue quickly.`);
        setStep("details");
        toast.error(`${message} We prefilled ${formatDisplayDate(suggestion.date)} at ${formatDisplayTime(suggestion.time)}.`);
      } else {
        setPaymentFeedback(message);
        setStep("mpesa_payment");
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitManualPayment = async () => {
    const confirmationCode = mpesaConfirmationCode.trim();
    const payerName = paidMobileName.trim();
    const recipient = sendMoneyNumber.trim() || MANUAL_PAYMENT_SEND_MONEY_NUMBER;

    if (!confirmationCode || !payerName) {
      toast.error("Enter the M-PESA transaction code and the paid mobile name before finalizing payment.");
      return;
    }

    const participantCount =
      serviceType === "corporate" && form.participantCount
        ? Number.parseInt(form.participantCount, 10)
        : undefined;

    setIsSubmitting(true);
    setPaymentFeedback("");

    try {
      const nextCheckout = await submitManualBookingPayment({
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        clientPhone: form.clientPhone,
        therapistId: form.therapistId,
        date: form.date,
        time: form.time,
        serviceType,
        participantCount,
        sessionType,
        notes: form.notes,
        mpesaConfirmationCode: confirmationCode,
        paidMobileName: payerName,
        sendMoneyNumber: recipient,
      });

      setCheckout(nextCheckout);
      setCurrentBookingFeeAmount(normalizeBookingFeeAmount(nextCheckout.booking.bookingFeeAmount, bookingAmount));
      rememberBookingAccess(nextCheckout.booking.token, form.clientEmail.trim());
      setStep("success");
      toast.success("Your session is booked. Check your email for the session link.");
    } catch (error) {
      const message = getSafePaymentFeedback(getApiErrorMessage(error, "We could not submit this payment confirmation right now."));
      const suggestion = getSuggestedBookingSlot(error);

      if (suggestion) {
        setForm((current) => ({
          ...current,
          date: suggestion.date,
          time: suggestion.time,
        }));
        setBookingGuidance(`${message} We prefilled the next available option so you can continue quickly.`);
        setStep("details");
        toast.error(`${message} We prefilled ${formatDisplayDate(suggestion.date)} at ${formatDisplayTime(suggestion.time)}.`);
      } else {
        setPaymentFeedback(message);
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToPaymentStep = () => {
    setPaymentFeedback("");
    setRetryStartOverRequired(false);
    setStep("mpesa_payment");
  };

  const startFreshBooking = () => {
    setCheckout(null);
    setPaymentFeedback("");
    toast.info("Please review your session details, then continue to payment again.");
    setRetryStartOverRequired(false);
    setStep("details");
  };

  const renderStatusStep = () => {
    if (step === "stk_sent") {
      return (
        <>
          <MobileStatusSheet
            step={step}
            tone="dark"
            eyebrow="STK Push Sent"
            title="Check your phone"
            description="Enter your M-Pesa PIN on the Safaricom prompt. We will keep checking the payment and only confirm the booking after M-Pesa confirms success."
            indicator={<CheckCircle2 className="h-10 w-10" />}
          >
            <div className="space-y-3 text-left">
              {STK_PROMPT_STEPS.map((instruction, index) => (
                <div key={instruction} className="flex items-start gap-3 rounded-[1.15rem] border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-[hsl(136_60%_72%)]">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-white/78">{instruction}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-4 text-left">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/58">Payment details</p>
              <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                <span className="text-white/68">Phone</span>
                <span className="font-medium text-white">{paymentPhone || "Pending"}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                <span className="text-white/68">Amount</span>
                <span className="font-semibold text-[hsl(136_60%_72%)]">{formatCurrencyAmount(bookingAmount, "KES")}</span>
              </div>
            </div>
          </MobileStatusSheet>

          <DesktopStatusDialog>
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto rounded-[2rem] border border-border/60 bg-[linear-gradient(180deg,hsl(150_18%_16%),hsl(150_19%_12%))] px-6 py-8 text-center text-white shadow-card sm:px-8">
            <StatusHalo>
              <CheckCircle2 className="h-10 w-10" />
            </StatusHalo>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-white/65">STK Push Sent</p>
            <h3 className="mt-3 font-heading text-3xl font-semibold">STK Push Sent!</h3>
            <p className="mt-4 text-sm leading-8 text-white/78 sm:text-base">
              Enter your M-Pesa PIN on the prompt to finish the booking fee payment.
            </p>
            <div className="mt-6 grid gap-3 text-left">
              {STK_PROMPT_STEPS.map((instruction, index) => (
                <div key={instruction} className="flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-[hsl(136_60%_72%)]">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-white/78">{instruction}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-white/5 px-5 py-4 text-left">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">Payment details</p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-white/72">To</span>
                <span className="font-medium text-white">THE HUB</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-white/72">Phone</span>
                <span className="font-medium text-white">{paymentPhone || "Pending"}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-white/72">Amount</span>
                <span className="font-semibold text-[hsl(136_60%_72%)]">{formatCurrencyAmount(bookingAmount, "KES")}</span>
              </div>
            </div>
          </div>
          </DesktopStatusDialog>
        </>
      );
    }

    if (step === "manual_review") {
      return (
        <>
          <MobileStatusSheet
            step={step}
            tone="success"
            eyebrow="Session Booked"
            title="Your session is booked"
            description="Your payment details were received. Check your email for the session link and calendar invite."
            indicator={<CheckCircle2 className="h-10 w-10" />}
          >
            <div className="rounded-[1.2rem] border border-primary/12 bg-primary/8 px-4 py-4 text-left text-sm leading-6 text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Code:</span>{" "}
                {checkout?.payment.transactionId || mpesaConfirmationCode || "Submitted"}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-foreground">Paid mobile name:</span>{" "}
                {checkout?.payment.payerName || paidMobileName || "Submitted"}
              </p>
            </div>
            <Button
              variant="hero"
              className="mt-5 w-full rounded-xl"
              onClick={() => checkout && navigate(`/manage/${checkout.booking.token}?booking=success`)}
            >
              View Booking Details
            </Button>
          </MobileStatusSheet>

          <DesktopStatusDialog>
            <div className="rounded-[2rem] border border-border/60 bg-card px-6 py-8 text-center shadow-card sm:px-8">
              <StatusHalo tone="success">
                <CheckCircle2 className="h-10 w-10" />
              </StatusHalo>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-primary/75">
                Session Booked
              </p>
              <h3 className="mt-3 font-heading text-3xl font-semibold text-foreground">Your session is booked</h3>
              <p className="mx-auto mt-4 max-w-md text-sm leading-8 text-muted-foreground sm:text-base">
                Your payment details were received. We have sent your confirmation email with the session link and calendar invite.
              </p>
              <div className="mx-auto mt-6 max-w-md rounded-[1.4rem] border border-primary/12 bg-primary/8 px-5 py-4 text-left text-sm leading-7 text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">Confirmation code:</span>{" "}
                  {checkout?.payment.transactionId || mpesaConfirmationCode || "Submitted"}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Paid mobile name:</span>{" "}
                  {checkout?.payment.payerName || paidMobileName || "Submitted"}
                </p>
              </div>
              <Button
                variant="hero"
                className="mt-6 rounded-full"
                onClick={() => checkout && navigate(`/manage/${checkout.booking.token}?booking=success`)}
              >
                View Booking Details
              </Button>
            </div>
          </DesktopStatusDialog>
        </>
      );
    }

    if (step === "processing") {
      return (
        <>
          <MobileStatusSheet
            step={step}
            tone="dark"
            eyebrow="Processing Payment"
            title="Confirming your payment"
            description="Please wait while we confirm your payment."
            indicator={<ProcessingRing />}
            bareIndicator
          >
            <div className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-4 text-center text-sm leading-6 text-white/78">
              <p>This usually takes a few seconds.</p>
            </div>
          </MobileStatusSheet>

          <DesktopStatusDialog>
          <div className="no-scrollbar max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.65rem] border border-border/60 bg-[linear-gradient(180deg,hsl(150_18%_16%),hsl(150_19%_12%))] px-6 py-6 text-center text-white shadow-card sm:px-7">
            <div className="scale-90">
              <StatusHalo>
                <LoaderCircle className="h-10 w-10 animate-spin" />
              </StatusHalo>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/65">Processing Payment</p>
            <h3 className="mt-2 font-heading text-3xl font-semibold leading-tight">Confirming your payment</h3>
            <p className="mt-3 text-sm leading-7 text-white/78 sm:text-[0.95rem]">
              Please wait while we confirm your booking fee with M-Pesa.
            </p>
            <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/5 px-5 py-4 text-left text-sm leading-6 text-white/75">
              <p className="font-medium text-white">What happens next</p>
              <p className="mt-2">We are checking the Safaricom response, updating your booking, and preparing the confirmation details.</p>
              <p className="mt-2 text-white/58">This usually takes a few seconds.</p>
            </div>
          </div>
          </DesktopStatusDialog>
        </>
      );
    }

    if (step === "success") {
      return (
        <>
          <MobileStatusSheet
            step={step}
            tone="success"
            eyebrow="Payment Successful"
            title="Payment Successful!"
            description="Your deposit has been received. You booked your session successfully."
            indicator={<CheckCircle2 className="h-10 w-10" />}
          >
            <div className="rounded-[1.1rem] bg-primary/8 px-4 py-4 text-center">
              <p className="text-sm text-muted-foreground">You paid</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-primary">{formatCurrencyAmount(bookingAmount, "KES")}</p>
              <p className="mt-3 text-sm text-muted-foreground">for your booked session.</p>
            </div>
            <div className="mt-4 grid gap-3">
              <Button
                variant="hero"
                className="w-full rounded-xl"
                onClick={() => checkout && navigate(`/manage/${checkout.booking.token}?booking=success`)}
              >
                View Booking
              </Button>
              <Button variant="heroBorder" className="w-full rounded-xl" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </div>
          </MobileStatusSheet>

          <DesktopStatusDialog>
          <div className="no-scrollbar max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[2rem] border border-border/60 bg-card px-6 py-8 text-center shadow-hover sm:px-8">
            <StatusHalo tone="success">
              <CheckCircle2 className="h-10 w-10" />
            </StatusHalo>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-primary/75">Payment Successful</p>
            <h3 className="mt-3 font-heading text-3xl font-semibold text-foreground">You booked your session</h3>
            <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">
              You paid a deposit of {formatCurrencyAmount(bookingAmount, "KES")}. We have sent your confirmation email
              with more session details, so please check your mail.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-border/60 bg-secondary/35 px-4 py-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/65">Payment method</p>
                <p className="mt-2 text-base font-semibold text-foreground">{activePayment?.paymentMethod ?? "M-Pesa STK Push"}</p>
              </div>
              <div className="rounded-[1.2rem] border border-border/60 bg-secondary/35 px-4 py-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/65">Transaction ID</p>
                <p className="mt-2 text-base font-semibold text-foreground">{activePayment?.transactionId ?? "Awaiting receipt"}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="hero" className="rounded-full" onClick={() => checkout && navigate(`/manage/${checkout.booking.token}?booking=success`)}>
                View Booking
              </Button>
              <Button variant="heroBorder" className="rounded-full" onClick={() => navigate("/")}>
                <Home className="h-4 w-4" />
                Back Home
              </Button>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-primary/60">Opening your booking page automatically...</p>
          </div>
          </DesktopStatusDialog>
        </>
      );
    }

    return (
      <>
          <MobileStatusSheet
            step={step}
            tone="destructive"
            eyebrow="Payment Not Complete"
            title={failureCopy.title}
            description={failureCopy.description}
            indicator={<CircleAlert className="h-10 w-10" />}
            onClose={resetToPaymentStep}
          >
          <div className="mt-4 grid gap-3">
            <Button variant="hero" className="w-full rounded-xl" onClick={handleStartPayment} disabled={isSubmitting}>
              {retryButtonLabel}
            </Button>
            <Button variant="heroBorder" className="w-full rounded-xl" onClick={resetToPaymentStep}>
              Change Phone Number
            </Button>
          </div>
        </MobileStatusSheet>

        <DesktopStatusDialog>
        <div className="no-scrollbar relative max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.65rem] border border-border/60 bg-card px-6 py-6 text-center shadow-card sm:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-8 w-8 rounded-full border border-border/60 bg-white/80 text-muted-foreground hover:bg-white"
            onClick={resetToPaymentStep}
            aria-label="Close payment message"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="scale-90">
            <StatusHalo tone="destructive">
              <CircleAlert className="h-10 w-10" />
            </StatusHalo>
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">Payment Failed</p>
          <h3 className="mt-2 font-heading text-3xl font-semibold leading-tight text-foreground">{failureCopy.title}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-[0.95rem]">{failureCopy.description}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="hero" className="rounded-full" onClick={handleStartPayment} disabled={isSubmitting}>
              {retryButtonLabel}
            </Button>
            <Button variant="heroBorder" className="rounded-full" onClick={resetToPaymentStep}>
              Change Phone Number
            </Button>
          </div>
        </div>
        </DesktopStatusDialog>
      </>
    );
  };

  return (
    <section id="booking" ref={sectionRef} className="py-24">
      {isLoadingTherapists
        ? createPortal(
            <div className="pointer-events-none fixed left-1/2 top-1/2 z-[120] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              <div className="h-16 w-16 rounded-full border-[5px] border-primary/20 border-t-primary animate-spin" />
            </div>,
            document.body,
          )
        : null}
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className={step === "details" ? "grid gap-12 lg:grid-cols-[0.92fr_1.08fr]" : "grid gap-12"}>
            {step === "details" ? (
              <ScrollReveal direction="left">
                <div className="wellness-panel overflow-hidden rounded-[2rem] border border-border/60 p-6 text-center shadow-card sm:p-8 lg:text-left">
                  <LeafBannerHeading
                    eyebrow="Booking Flow"
                    title="Book your first session with confidence."
                    className="-mx-6 -mt-6 sm:-mx-8 sm:-mt-8"
                    innerClassName="px-6 py-6 sm:px-8 sm:py-7"
                    titleClassName="text-4xl md:text-5xl"
                  />
                  <p className="mt-4 max-w-lg text-muted-foreground leading-8">
                    Choose your therapist, review your session summary, pay a small refundable booking fee, and receive
                    your confirmation instantly.
                  </p>

                  <div className="mt-8 space-y-4">
                    {[
                      {
                        icon: CalendarDays,
                        title: "Calendar-ready booking",
                        description: "Each confirmed session includes a calendar link and private manage page.",
                      },
                      {
                        icon: ShieldCheck,
                        title: "Commitment-first flow",
                        description: "The booking fee helps confirm attendance and reduces last-minute no-shows.",
                      },
                      {
                        icon: Mail,
                        title: "Instant confirmation",
                        description: "As soon as payment succeeds, we send the confirmation package by email.",
                      },
                    ].map((item) => (
                      <div key={item.title} className="rounded-[1.5rem] bg-background/85 p-5 shadow-soft">
                        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-heading text-xl font-semibold text-foreground">{item.title}</h3>
                            <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-[1.75rem] bg-foreground px-6 py-5 text-center text-primary-foreground shadow-soft">
                    <p className="text-sm uppercase tracking-[0.24em] text-primary-foreground/60">Availability</p>
                    <p className="mt-3 text-lg font-medium">{BOOKING_AVAILABILITY_SUMMARY}</p>
                    <p className="mt-2 text-sm text-primary-foreground/70">
                      {BOOKING_AVAILABILITY_DETAIL} Physical sessions take place in Westlands, and virtual sessions arrive
                      with a calendar-ready access link.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ) : null}

            <ScrollReveal direction="right">
              <div className={step === "details" ? "" : "mx-auto w-full max-w-5xl"}>
                {step !== "details" ? (
                  <div className="mb-3 hidden text-center sm:block">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Secure Booking Checkout</p>
                    <h2 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">
                      Confirm your session in a few guided steps
                    </h2>
                  </div>
                ) : null}
                {step === "details" ? (
                  <form
                    id="schedule-appointment"
                    onSubmit={handleDetailsSubmit}
                    className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-border/60 bg-card p-6 shadow-card sm:p-8"
                  >
                    <LeafBannerHeading
                      title="Schedule your appointment"
                      titleTag="h3"
                      description="Enter your details first, then review the session summary before payment."
                      className="-mx-6 -mt-6 sm:-mx-8 sm:-mt-8"
                      innerClassName="px-6 py-6 sm:px-8 sm:py-7"
                      titleClassName="text-3xl"
                      descriptionClassName="max-w-none"
                    />

                    <div className="mt-8 grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label className="block text-sm leading-6">Service Type *</Label>
                        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                          {serviceCards.map((item) => (
                            <button
                              key={item.type}
                              type="button"
                              aria-pressed={serviceType === item.type}
                              onClick={() => handleServiceTypeSelect(item.type)}
                              className={`relative min-w-0 rounded-[1rem] border px-2 py-2 text-center transition-all duration-200 sm:px-2.5 sm:py-2.5 ${
                                serviceType === item.type
                                  ? "-translate-y-1 border-primary bg-primary/10 shadow-[0_18px_35px_rgba(17,24,39,0.24)]"
                                  : "border-border/60 bg-background hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_12px_24px_rgba(17,24,39,0.12)]"
                              }`}
                            >
                              {serviceType === item.type ? (
                                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_3px_rgba(78,124,104,0.14)] sm:right-3 sm:top-3" />
                              ) : null}
                              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                <div
                                  className={`flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${
                                    serviceType === item.type ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                                  }`}
                                >
                                  <item.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </div>
                                <p className="min-w-0 font-heading text-[10px] font-semibold leading-tight text-foreground sm:text-xs md:text-sm">
                                  {item.title}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="mt-3 min-h-6 px-1 text-xs leading-6 text-primary/80 sm:text-sm">
                          {serviceDescriptionText}
                          <span
                            aria-hidden="true"
                            className="ml-0.5 inline-block h-3 w-px animate-pulse bg-primary/55 align-[-1px] sm:h-4"
                          />
                        </div>
                      </div>

                      {serviceType === "corporate" ? (
                        <div className="sm:col-span-2 rounded-[1.5rem] border border-primary/15 bg-secondary/35 p-5 shadow-soft">
                          <div className="flex items-center gap-2 text-primary">
                            <Users className="h-4 w-4" />
                            <Label htmlFor="booking-participants" className="text-base font-medium text-foreground">
                              Number of Participants *
                            </Label>
                          </div>
                          <Input
                            id="booking-participants"
                            type="number"
                            inputMode="numeric"
                            min="1"
                            step="1"
                            value={form.participantCount}
                            onChange={(event) => updateField("participantCount", event.target.value)}
                            className="mt-4 max-w-[240px] bg-background/95"
                            placeholder="e.g. 25"
                            required
                          />
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            We&apos;ll tailor the program to your team size.
                          </p>
                        </div>
                      ) : null}

                      <div>
                        <Label htmlFor="booking-name">Full Name</Label>
                        <Input
                          id="booking-name"
                          value={form.clientName}
                          onChange={(event) => updateField("clientName", event.target.value)}
                          className="mt-2"
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="booking-phone">Phone Number</Label>
                        <Input
                          id="booking-phone"
                          type="tel"
                          value={form.clientPhone}
                          onChange={(event) => updateField("clientPhone", event.target.value)}
                          className="mt-2"
                          placeholder="+254 7XX XXX XXX or +254 1XX XXX XXX"
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <Label htmlFor="booking-email">Email Address</Label>
                      <Input
                        id="booking-email"
                        type="email"
                        value={form.clientEmail}
                        onChange={(event) => updateField("clientEmail", event.target.value)}
                        className="mt-2"
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5">
                      <div>
                        <Label htmlFor="booking-date">Preferred Date</Label>
                        <Input
                          id="booking-date"
                          type="date"
                          value={form.date}
                          aria-invalid={Boolean(bookingDateError)}
                          aria-describedby={bookingDateError ? "booking-date-error" : undefined}
                          onClick={showScheduleWindowNotice}
                          onFocus={showScheduleWindowNotice}
                          onChange={(event) => updateField("date", event.target.value)}
                          className={cn("mt-2", bookingDateError && "border-destructive focus-visible:ring-destructive/40")}
                          min={todayDate}
                          required
                        />
                        {bookingDateError ? (
                          <p id="booking-date-error" className="mt-2 text-xs font-medium leading-5 text-destructive">
                            {bookingDateError}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <Label htmlFor="booking-time">Preferred Time</Label>
                        <Input
                          id="booking-time"
                          type="time"
                          value={form.time}
                          aria-invalid={Boolean(bookingTimeError)}
                          aria-describedby={bookingTimeError ? "booking-time-error" : undefined}
                          onClick={showScheduleWindowNotice}
                          onFocus={showScheduleWindowNotice}
                          onChange={(event) => updateField("time", event.target.value)}
                          className={cn("mt-2", bookingTimeError && "border-destructive focus-visible:ring-destructive/40")}
                          min={BOOKING_OPEN_TIME}
                          max={BOOKING_LAST_START_TIME}
                          step={BOOKING_TIME_STEP_SECONDS}
                          required
                        />
                        {bookingTimeError ? (
                          <p id="booking-time-error" className="mt-2 text-xs font-medium leading-5 text-destructive">
                            {bookingTimeError}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5">
                      <Label htmlFor="booking-therapist">Preferred Therapist</Label>
                      <select
                        id="booking-therapist"
                        className="mt-2 flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={form.therapistId}
                        onChange={(event) => updateField("therapistId", event.target.value)}
                      >
                        {selectableTherapists.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} - {item.title}
                          </option>
                        ))}
                      </select>
                      <div className="mt-3 flex items-center gap-3 rounded-[1.25rem] border border-border/60 bg-secondary/25 p-3">
                        <img
                          src={selectedTherapist.image}
                          alt={selectedTherapist.name}
                          loading="lazy"
                          className="h-14 w-14 rounded-2xl object-cover object-top"
                        />
                        <div className="min-w-0">
                          <p className="font-heading text-base font-semibold leading-tight text-foreground">
                            {selectedTherapist.name}
                          </p>
                          <p className="mt-1 text-xs font-medium text-primary">{selectedTherapist.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {selectedTherapist.focusAreas}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Label className="block text-sm leading-6">Session Type (select preferred choice)</Label>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
                        {sessionCards.map((item) => (
                          <button
                            key={item.type}
                            type="button"
                            aria-pressed={sessionType === item.type}
                            onClick={() => setSessionType(item.type)}
                            className={`min-w-0 rounded-[1rem] border px-2 py-2 text-center transition-all duration-200 sm:px-2.5 sm:py-2.5 ${
                              sessionType === item.type
                                ? "-translate-y-1 border-primary bg-primary/10 shadow-[0_18px_35px_rgba(17,24,39,0.24)]"
                                : "border-border/60 bg-background hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_12px_24px_rgba(17,24,39,0.12)]"
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center gap-1">
                              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                <div
                                  className={`flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${
                                    sessionType === item.type ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                                  }`}
                                >
                                  <item.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </div>
                                <p className="font-heading text-[10px] font-semibold leading-tight text-foreground sm:text-xs">
                                  {item.title}
                                </p>
                              </div>
                              <p className="text-[8px] leading-tight text-muted-foreground sm:text-[10px]">{item.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5">
                      <Label htmlFor="booking-notes">Anything you would like us to know?</Label>
                      <Textarea
                        id="booking-notes"
                        value={form.notes}
                        onChange={(event) => updateField("notes", event.target.value)}
                        className="mt-2 min-h-[110px]"
                        placeholder="Share a brief note, preferred support area, or scheduling context."
                      />
                    </div>

                    <div className="mt-6 flex flex-col items-center gap-3 rounded-[1.5rem] bg-secondary/50 px-4 py-4 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <span>Your booking details remain private, and your follow-up session link is unique to you.</span>
                    </div>

                    <Button variant="hero" size="lg" type="submit" className="mt-7 w-full rounded-full" disabled={!canSubmitDetails}>
                      {isLoadingTherapists ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Checking Slot...
                        </>
                      ) : hasNoAvailableTherapists ? (
                        "Choose Another Slot"
                      ) : (
                        "Book Your First Session"
                      )}
                    </Button>
                  </form>
                ) : step === "summary" ? (
                  <>
                    <div className="relative mx-auto max-w-[21.9rem] overflow-hidden rounded-[1.85rem] border border-border/60 bg-card p-3.5 shadow-card sm:hidden">
                      <MobileSheetLeaves />
                      <div className="relative z-10 flex items-start gap-3">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border/60" onClick={() => setStep("details")}>
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-0 flex-1">
                          <div className="mt-3">
                            <MobileStageDots step={step} />
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 mt-4 rounded-[1.45rem] border border-border/60 bg-background/95 p-4 shadow-soft">
                        <h4 className="text-base font-semibold text-foreground">Session Summary</h4>
                        <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
                          {[
                            {
                              icon: Users,
                              label: "Session",
                              value: `${formatServiceType(serviceType)} ${sessionType === "virtual" ? "1-on-1 Session" : "In-Person Session"}`,
                            },
                            {
                              icon: CalendarDays,
                              label: "Date",
                              value: form.date ? formatDisplayDate(form.date) : "Select a date",
                            },
                            {
                              icon: Clock3,
                              label: "Time",
                              value: form.time ? formatDisplayTime(form.time) : "Select a time",
                            },
                            {
                              icon: Wallet,
                              label: "Booking Fee",
                              value: formatCurrencyAmount(bookingAmount, "KES"),
                            },
                            {
                              icon: User,
                              label: "Therapist",
                              value: selectedTherapist.name,
                            },
                          ].map((item) => (
                            <div key={item.label} className="flex items-start gap-2.5">
                              <div className="flex h-9 w-9 items-center justify-center rounded-[1rem] bg-primary/8 text-primary">
                                <item.icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/65">{item.label}</p>
                                <p className="mt-0.5 text-sm font-medium leading-5 text-foreground">{item.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="relative z-10 mt-3.5 rounded-[1.15rem] bg-primary/10 px-4 py-3 text-sm leading-6 text-foreground/85">
                        To confirm your session, a refundable booking fee is required.
                      </div>

                      <Button
                        variant="hero"
                        size="lg"
                        className="relative z-10 mt-4 w-full rounded-xl"
                        onClick={() => {
                          setPaymentPhone(form.clientPhone);
                          setStep("payment");
                        }}
                      >
                        Continue to Payment
                      </Button>
                    </div>

                    <div className="relative mt-5 hidden rounded-[2rem] border border-border/60 bg-card p-6 pt-8 shadow-card sm:block sm:p-8 sm:pt-9">
                      <CheckoutStageRail step={step} />
                      <div className="relative flex min-h-11 items-center justify-center gap-4 px-40">
                        <div className="text-center">
                          <h3 className="font-heading text-3xl font-semibold text-foreground">Review your session</h3>
                        </div>
                        <Button variant="heroBorder" className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full" onClick={() => setStep("details")}>
                          <ArrowLeft className="h-4 w-4" />
                          Edit Details
                        </Button>
                      </div>

                      <div className="mt-8 grid gap-5 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
                        <SummaryCard
                          serviceType={serviceType}
                          sessionType={sessionType}
                          date={form.date}
                          time={form.time}
                          therapistName={selectedTherapist.name}
                          bookingAmount={bookingAmount}
                        />
                        <div className="space-y-5">
                          <WhyPayCard />
                          <Button
                            variant="hero"
                            size="lg"
                            className="w-full rounded-full"
                            onClick={() => {
                              setPaymentPhone(form.clientPhone);
                              setStep("payment");
                            }}
                          >
                            Continue to Payment
                          </Button>
                          <div className="group/payment relative h-56 overflow-hidden rounded-[1.35rem] border border-border/60 bg-primary/10 shadow-[0_18px_40px_-34px_rgba(33,49,40,0.5)]">
                            <img
                              src={REVIEW_GARDEN_IMAGE_URL}
                              alt="Calm green valley landscape"
                              className="h-full w-full scale-[1.05] object-cover object-center animate-payment-image-pan"
                              loading="lazy"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.18)_45%,transparent_64%)] animate-payment-sheen" />
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(33,49,40,0.08),rgba(33,49,40,0.26))]" />
                            <div className="pointer-events-none absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/35 bg-white/82 text-primary shadow-soft backdrop-blur-md animate-payment-float">
                              <Wallet className="h-5 w-5" />
                            </div>
                            <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/35 bg-white/86 px-3.5 py-2 text-sm font-semibold text-primary shadow-soft backdrop-blur-md animate-payment-float animation-delay-400">
                              <ShieldCheck className="h-4 w-4" />
                              <span>{formatCurrencyAmount(bookingAmount, "KES")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : step === "payment" ? (
                  <>
                    <div className="relative mx-auto max-w-[21.9rem] overflow-hidden rounded-[1.85rem] border border-border/60 bg-card p-4 shadow-card sm:hidden">
                      <MobileSheetLeaves />
                      <div className="relative z-10 flex items-start gap-3">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border/60" onClick={() => setStep("summary")}>
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-0 flex-1">
                          <div className="mt-3">
                            <MobileStageDots step={step} />
                          </div>
                        </div>
                      </div>
                      <div className="relative z-10 mt-5 overflow-hidden rounded-[1.6rem] border border-border/60 bg-[linear-gradient(155deg,rgba(255,255,255,0.98),rgba(244,249,245,0.94))] px-4 py-5 shadow-soft">
                        <img
                          src={leafDecor}
                          alt=""
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-10 -top-10 w-44 rotate-[18deg] opacity-[0.18] mix-blend-multiply saturate-125"
                        />
                        <img
                          src={leafDecor}
                          alt=""
                          aria-hidden="true"
                          className="pointer-events-none absolute -bottom-12 right-8 w-36 rotate-[42deg] opacity-[0.12] mix-blend-multiply saturate-125"
                        />
                        <div className="relative flex items-start gap-2.5">
                          <img src={leafDecor} alt="" aria-hidden="true" className="mt-1 w-9 shrink-0 opacity-75 mix-blend-multiply saturate-125" />
                          <div>
                            <h3 className="text-lg font-semibold leading-tight text-primary">Choose your payment method</h3>
                            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Pick the option that works best for you.</p>
                          </div>
                        </div>
                        <div className="relative mt-4 grid gap-2.5">
                          <button
                            type="button"
                            onClick={() => setStep("send_money")}
                            className="relative overflow-hidden rounded-[1.15rem] border border-primary/15 bg-white/88 p-3 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-secondary/25"
                          >
                            <img src={leafDecor} alt="" aria-hidden="true" className="pointer-events-none absolute -right-8 bottom-0 w-32 rotate-[28deg] opacity-[0.12] mix-blend-multiply" />
                            <div className="flex items-start gap-2.5">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-primary/10 text-primary">
                                <Smartphone className="h-4.5 w-4.5" />
                              </span>
                              <span className="min-w-0">
                                <span className="block whitespace-nowrap text-[13px] font-semibold leading-5 text-primary">1. Pay Manually (Paybill/Till)</span>
                                <span className="mt-0.5 block text-[11px] leading-5 text-muted-foreground">Send money or use Paybill to complete your payment manually.</span>
                              </span>
                            </div>
                          </button>
                          <div className="relative overflow-hidden rounded-[1.15rem] border border-border/50 bg-white/55 p-3 text-left opacity-50">
                            <img src={leafDecor} alt="" aria-hidden="true" className="pointer-events-none absolute -right-8 bottom-0 w-32 rotate-[28deg] opacity-[0.12] mix-blend-multiply" />
                            <div className="flex items-start gap-2.5">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-primary/10 text-primary">
                                <Smartphone className="h-4.5 w-4.5" />
                              </span>
                              <span className="min-w-0">
                                <span className="block whitespace-nowrap text-[13px] font-semibold leading-5 text-primary">2. Pay with M-Pesa (STK)</span>
                                <span className="mt-0.5 block text-[11px] leading-5 text-muted-foreground">Get a prompt on your phone and enter your PIN to complete the payment.</span>
                              </span>
                            </div>
                          </div>
                          <div className="relative overflow-hidden rounded-[1.15rem] border border-border/50 bg-white/55 p-3 text-left opacity-50">
                            <img src={leafDecor} alt="" aria-hidden="true" className="pointer-events-none absolute -right-8 bottom-0 w-32 rotate-[28deg] opacity-[0.12] mix-blend-multiply" />
                            <div className="flex items-start gap-2.5">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-primary/8 text-primary">
                                <Landmark className="h-4.5 w-4.5" />
                              </span>
                              <span>
                                <span className="block text-[13px] font-semibold leading-5 text-primary">3. Bank Transfer</span>
                                <span className="mt-0.5 block text-[11px] leading-5 text-muted-foreground">Coming soon.</span>
                              </span>
                            </div>
                          </div>
                          <div className="relative overflow-hidden rounded-[1.15rem] border border-border/50 bg-white/55 p-3 text-left opacity-50">
                            <img src={leafDecor} alt="" aria-hidden="true" className="pointer-events-none absolute -right-8 bottom-0 w-32 rotate-[28deg] opacity-[0.12] mix-blend-multiply" />
                            <div className="flex items-start gap-2.5">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-primary/8 text-primary">
                                <Wallet className="h-4.5 w-4.5" />
                              </span>
                              <span>
                                <span className="block text-[13px] font-semibold leading-5 text-primary">4. Pay with Wallet</span>
                                <span className="mt-0.5 block text-[11px] leading-5 text-muted-foreground">Coming soon.</span>
                              </span>
                            </div>
                          </div>
                          <div className="rounded-[1rem] border border-primary/10 bg-primary/5 p-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] bg-primary text-primary-foreground">
                                <ShieldCheck className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-primary">Secure & Trusted</p>
                                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Your payments are encrypted and secure.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-5 hidden rounded-[2rem] border border-border/60 bg-card p-6 pt-8 shadow-card sm:block sm:p-8 sm:pt-9">
                      <CheckoutStageRail step={step} />
                      <div className="relative flex min-h-11 items-center justify-center gap-4 px-28">
                        <div className="text-center">
                          <h3 className="font-heading text-3xl font-semibold text-foreground">Choose payment option</h3>
                          <p className="mt-2 text-sm text-muted-foreground">Your booking fee is {formatCurrencyAmount(bookingAmount, "KES")}.</p>
                        </div>
                        <Button variant="heroBorder" className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full" onClick={() => setStep("summary")}>
                          <ArrowLeft className="h-4 w-4" />
                          Back
                        </Button>
                      </div>
                      <div className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
                        <SummaryCard
                          serviceType={serviceType}
                          sessionType={sessionType}
                          date={form.date}
                          time={form.time}
                          therapistName={selectedTherapist.name}
                          bookingAmount={bookingAmount}
                        />
                        <div className="relative overflow-hidden rounded-[1.8rem] border border-border/60 bg-[linear-gradient(155deg,rgba(255,255,255,0.98),rgba(244,249,245,0.94))] p-6 shadow-soft">
                          <img
                            src={leafDecor}
                            alt=""
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-14 -top-16 w-60 rotate-[18deg] opacity-[0.18] mix-blend-multiply saturate-125"
                          />
                          <img
                            src={leafDecor}
                            alt=""
                            aria-hidden="true"
                            className="pointer-events-none absolute bottom-8 right-16 w-44 rotate-[42deg] opacity-[0.12] mix-blend-multiply saturate-125"
                          />
                          <div className="relative flex items-start gap-4">
                            <img src={leafDecor} alt="" aria-hidden="true" className="mt-1 w-14 shrink-0 opacity-75 mix-blend-multiply saturate-125" />
                            <div>
                              <h3 className="text-2xl font-semibold leading-tight text-primary">Choose your payment method</h3>
                              <p className="mt-2 text-sm leading-6 text-muted-foreground">Pick the option that works best for you.</p>
                            </div>
                          </div>
                          <div className="relative mt-6 grid gap-4">
                          <button
                            type="button"
                            onClick={() => setStep("send_money")}
                            className="relative overflow-hidden rounded-[1.55rem] border border-primary/15 bg-white/88 p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-secondary/25"
                          >
                            <img src={leafDecor} alt="" aria-hidden="true" className="pointer-events-none absolute -right-10 bottom-0 w-40 rotate-[28deg] opacity-[0.12] mix-blend-multiply" />
                            <div className="flex items-center gap-5">
                              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.15rem] bg-primary/8 text-primary">
                                <Smartphone className="h-7 w-7" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-lg font-semibold text-primary">1. Pay Manually (Paybill/Till)</h4>
                                <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
                                  Send money or use Paybill to complete your payment manually.
                                </p>
                              </div>
                            </div>
                          </button>
                          <div className="relative overflow-hidden rounded-[1.55rem] border border-border/55 bg-white/55 p-5 text-left opacity-50">
                            <img src={leafDecor} alt="" aria-hidden="true" className="pointer-events-none absolute -right-10 bottom-0 w-40 rotate-[28deg] opacity-[0.12] mix-blend-multiply" />
                            <div className="flex items-center gap-5">
                              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.15rem] bg-primary/8 text-primary">
                                <Smartphone className="h-7 w-7" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-lg font-semibold text-primary">2. Pay with M-Pesa (STK)</h4>
                                <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
                                  Get a prompt on your phone and enter your PIN to complete the payment.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="relative overflow-hidden rounded-[1.55rem] border border-border/55 bg-white/55 p-5 text-left opacity-50">
                            <img src={leafDecor} alt="" aria-hidden="true" className="pointer-events-none absolute -right-10 bottom-0 w-40 rotate-[28deg] opacity-[0.12] mix-blend-multiply" />
                            <div className="flex items-center gap-5">
                              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.15rem] bg-primary/8 text-primary">
                                <Landmark className="h-7 w-7" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-primary">3. Bank Transfer</h4>
                                <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
                                  Transfer directly from your bank to our account securely.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="relative overflow-hidden rounded-[1.55rem] border border-border/55 bg-white/55 p-5 text-left opacity-50">
                            <img src={leafDecor} alt="" aria-hidden="true" className="pointer-events-none absolute -right-10 bottom-0 w-40 rotate-[28deg] opacity-[0.12] mix-blend-multiply" />
                            <div className="flex items-center gap-5">
                              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.15rem] bg-primary/8 text-primary">
                                <Wallet className="h-7 w-7" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-primary">4. Pay with Wallet</h4>
                                <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
                                  Use your e-wallet balance to make the payment instantly.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-[1.25rem] border border-primary/10 bg-primary/5 p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-primary text-primary-foreground">
                                <ShieldCheck className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-semibold text-primary">Secure & Trusted</p>
                                <p className="mt-1 text-sm text-muted-foreground">Your booking fee is {formatCurrencyAmount(bookingAmount, "KES")}.</p>
                              </div>
                            </div>
                          </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : step === "send_money" ? (
                  <>
                    <div className="relative mx-auto max-w-[21.9rem] overflow-hidden rounded-[1.85rem] border border-border/60 bg-card p-4 shadow-card sm:hidden">
                      <MobileSheetLeaves />
                      <div className="relative z-10 flex items-start gap-3">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border/60" onClick={() => setStep("payment")}>
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="mt-3 min-w-0 flex-1">
                          <MobileStageDots step={step} />
                        </div>
                      </div>
                      <div className="relative z-10 mt-5 rounded-[1.6rem] border border-border/60 bg-background/95 px-5 py-6 text-center shadow-soft">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">Pay manually</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-primary">{formatCurrencyAmount(bookingAmount, "KES")}</p>
                        <div className="mt-4 space-y-3 text-left">
                          <div className="rounded-[1.1rem] border border-primary/12 bg-primary/8 px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70">Paybill</p>
                                <p className="mt-1.5 text-sm font-medium leading-6 text-foreground">{MANUAL_PAYMENT_PAYBILL}</p>
                                <p className="mt-1 text-sm font-normal leading-6 text-muted-foreground">Account {MANUAL_PAYMENT_ACCOUNT}</p>
                              </div>
                              <CopyDetailButton label="Paybill" value={MANUAL_PAYMENT_PAYBILL} />
                            </div>
                          </div>
                          <div className="rounded-[1.1rem] border border-border/60 bg-white px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70">Send money to</p>
                                <p className="mt-1.5 text-sm font-medium leading-6 text-foreground">{MANUAL_PAYMENT_SEND_MONEY_NUMBER}</p>
                              </div>
                              <CopyDetailButton label="Send money number" value={MANUAL_PAYMENT_SEND_MONEY_NUMBER} />
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 rounded-[1.1rem] bg-primary/8 px-4 py-3 text-xs leading-6 text-foreground/85">
                          After paying, continue to enter your M-PESA transaction code and paid mobile name.
                        </div>
                        <Button variant="hero" size="lg" className="mt-6 w-full rounded-xl" onClick={() => setStep("send_money_confirmation")}>
                          Proceed
                        </Button>
                      </div>
                    </div>

                    <div className="relative mt-5 hidden rounded-[2rem] border border-border/60 bg-card p-6 pt-8 shadow-card sm:block sm:p-8 sm:pt-9">
                      <CheckoutStageRail step={step} />
                      <div className="relative flex min-h-11 items-center justify-center gap-4 px-28">
                        <div className="text-center">
                          <h3 className="font-heading text-3xl font-semibold text-foreground">Pay manually</h3>
                        </div>
                        <Button variant="heroBorder" className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full" onClick={() => setStep("payment")}>
                          <ArrowLeft className="h-4 w-4" />
                          Back
                        </Button>
                      </div>
                      <div className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
                        <div className="order-2 lg:order-1">
                          <SummaryCard serviceType={serviceType} sessionType={sessionType} date={form.date} time={form.time} therapistName={selectedTherapist.name} bookingAmount={bookingAmount} />
                        </div>
                        <div className="order-1 space-y-5 lg:order-2">
                          <div className="rounded-[1.6rem] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,246,0.96))] p-5 shadow-soft sm:p-6">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/70">Pay manually</p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-[1.25rem] border border-primary/12 bg-primary/8 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/70">Paybill</p>
                                    <p className="mt-2 text-sm font-medium leading-6 text-foreground">{MANUAL_PAYMENT_PAYBILL}</p>
                                    <p className="mt-2 text-sm font-normal leading-6 text-muted-foreground">Account {MANUAL_PAYMENT_ACCOUNT}</p>
                                  </div>
                                  <CopyDetailButton label="Paybill" value={MANUAL_PAYMENT_PAYBILL} />
                                </div>
                              </div>
                              <div className="rounded-[1.25rem] border border-border/60 bg-background/95 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/70">Send money to</p>
                                    <p className="mt-2 text-sm font-medium leading-6 text-foreground">{MANUAL_PAYMENT_SEND_MONEY_NUMBER}</p>
                                    <p className="mt-2 text-sm font-normal leading-6 text-muted-foreground">Amount {formatCurrencyAmount(bookingAmount, "KES")}</p>
                                  </div>
                                  <CopyDetailButton label="Send money number" value={MANUAL_PAYMENT_SEND_MONEY_NUMBER} />
                                </div>
                              </div>
                            </div>
                            <p className="mt-5 rounded-[1.2rem] bg-secondary/35 px-4 py-3 text-xs leading-6 text-muted-foreground">
                              After paying, continue to enter your M-PESA transaction code and paid mobile name.
                            </p>
                            <Button variant="hero" size="lg" className="mt-6 w-full rounded-full" onClick={() => setStep("send_money_confirmation")}>
                              Proceed
                            </Button>
                          </div>
                          <WhyPayCard />
                        </div>
                      </div>
                    </div>
                  </>
                ) : step === "send_money_confirmation" ? (
                  <>
                    <div className="relative mx-auto max-w-[21.9rem] overflow-hidden rounded-[1.85rem] border border-border/60 bg-card p-4 shadow-card sm:hidden">
                      <MobileSheetLeaves />
                      <div className="relative z-10 flex items-start gap-3">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border/60" onClick={() => setStep("send_money")}>
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="mt-3 min-w-0 flex-1">
                          <MobileStageDots step={step} />
                        </div>
                      </div>
                      <div className="relative z-10 mt-5 rounded-[1.6rem] border border-border/60 bg-background/95 px-5 py-6 text-center shadow-soft">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">Payment confirmation</p>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                          Enter the M-PESA transaction code and the paid mobile name exactly as shown after payment.
                        </p>
                        <div className="mt-5 space-y-3 text-left">
                          <div>
                            <Label htmlFor="manual-code-mobile">M-PESA transaction code</Label>
                            <Input id="manual-code-mobile" value={mpesaConfirmationCode} onChange={(event) => setMpesaConfirmationCode(event.target.value)} className="mt-2 h-12 rounded-2xl bg-white" placeholder="e.g. QWE123ABC" />
                          </div>
                          <div>
                            <Label htmlFor="manual-name-mobile">Paid mobile name</Label>
                            <Input id="manual-name-mobile" value={paidMobileName} onChange={(event) => setPaidMobileName(event.target.value)} className="mt-2 h-12 rounded-2xl bg-white" placeholder="Name shown by M-Pesa" />
                          </div>
                        </div>
                        <Button variant="hero" size="lg" className="mt-6 w-full rounded-xl" onClick={handleSubmitManualPayment} disabled={isSubmitting}>
                          {isSubmitting ? "Submitting..." : "Finalize Payment"}
                        </Button>
                      </div>
                    </div>

                    <div className="relative mt-5 hidden rounded-[2rem] border border-border/60 bg-card p-6 pt-8 shadow-card sm:block sm:p-8 sm:pt-9">
                      <CheckoutStageRail step={step} />
                      <div className="relative flex min-h-11 items-center justify-center gap-4 px-28">
                        <div className="text-center">
                          <h3 className="font-heading text-3xl font-semibold text-foreground">Confirm send money payment</h3>
                        </div>
                        <Button variant="heroBorder" className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full" onClick={() => setStep("send_money")}>
                          <ArrowLeft className="h-4 w-4" />
                          Back
                        </Button>
                      </div>
                      <div className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
                        <div className="order-2 lg:order-1">
                          <SummaryCard serviceType={serviceType} sessionType={sessionType} date={form.date} time={form.time} therapistName={selectedTherapist.name} bookingAmount={bookingAmount} />
                        </div>
                        <div className="order-1 space-y-5 lg:order-2">
                          <div className="rounded-[1.9rem] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,246,0.96))] p-5 shadow-soft sm:p-7">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">Payment confirmation</p>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                              <div>
                              <Label htmlFor="manual-code">M-PESA transaction code</Label>
                                <Input id="manual-code" value={mpesaConfirmationCode} onChange={(event) => setMpesaConfirmationCode(event.target.value)} className="mt-2 h-12 rounded-2xl" placeholder="e.g. QWE123ABC" />
                              </div>
                              <div>
                                <Label htmlFor="manual-name">Paid mobile name</Label>
                                <Input id="manual-name" value={paidMobileName} onChange={(event) => setPaidMobileName(event.target.value)} className="mt-2 h-12 rounded-2xl" placeholder="Name shown by M-Pesa" />
                              </div>
                            </div>
                            <p className="mt-4 text-xs leading-6 text-muted-foreground">
                              We will confirm your session immediately and send the session details to your email.
                            </p>
                            <Button variant="hero" size="lg" className="mt-6 w-full rounded-full" onClick={handleSubmitManualPayment} disabled={isSubmitting}>
                              {isSubmitting ? "Submitting..." : "Finalize Payment"}
                            </Button>
                          </div>
                          <WhyPayCard />
                        </div>
                      </div>
                    </div>
                  </>
                ) : step === "mpesa_payment" ? (
                  <>
                    <div className="relative mx-auto max-w-[21.9rem] overflow-hidden rounded-[1.85rem] border border-border/60 bg-card p-4 shadow-card sm:hidden">
                      <MobileSheetLeaves />
                      <div className="relative z-10 flex items-start gap-3">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border/60" onClick={() => setStep("summary")}>
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-0 flex-1">
                          <div className="mt-3">
                            <MobileStageDots step={step} />
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 mt-5 rounded-[1.6rem] border border-border/60 bg-background/95 px-5 py-6 text-center shadow-soft">
                        <MpesaWordmark className="justify-center" />
                        <p className="mt-5 text-sm font-medium text-foreground/80">Pay Deposit</p>
                        <p className="mt-2 text-4xl font-semibold tracking-tight text-primary">
                          {formatCurrencyAmount(bookingAmount, "KES")}
                        </p>
                        <p className="mt-4 text-sm leading-7 text-foreground/80">Enter the M-Pesa number you want to use</p>

                        <Input
                          id="payment-phone-mobile"
                          type="tel"
                          value={paymentPhone}
                          onChange={(event) => setPaymentPhone(event.target.value)}
                          className="mt-5 h-12 rounded-2xl bg-white text-center text-base"
                          placeholder="07 123 4567"
                          required
                        />

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs leading-6 text-muted-foreground">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <p>Your payment is secure</p>
                        </div>

                        <Button
                          variant="hero"
                          size="lg"
                          className="mt-6 w-full rounded-xl"
                          onClick={handleStartPayment}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Sending STK Push..." : "Pay with M-Pesa"}
                        </Button>

                        <p className="mt-4 text-xs leading-6 text-muted-foreground">
                          By continuing, you agree to our Terms and Conditions.
                        </p>
                      </div>
                    </div>

                    <div className="relative mt-5 hidden rounded-[2rem] border border-border/60 bg-card p-6 pt-8 shadow-card sm:block sm:p-8 sm:pt-9">
                      <CheckoutStageRail step={step} />
                      <div className="relative flex min-h-11 items-center justify-center gap-4 px-28">
                        <div className="text-center">
                          <h3 className="font-heading text-3xl font-semibold text-foreground">Pay the booking fee</h3>
                        </div>
                        <Button variant="heroBorder" className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full" onClick={() => setStep("summary")}>
                          <ArrowLeft className="h-4 w-4" />
                          Back
                        </Button>
                      </div>

                      <div className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
                        <div className="order-2 lg:order-1">
                          <SummaryCard
                            serviceType={serviceType}
                            sessionType={sessionType}
                            date={form.date}
                            time={form.time}
                            therapistName={selectedTherapist.name}
                            bookingAmount={bookingAmount}
                          />
                        </div>
                        <div className="order-1 space-y-5 lg:order-2">
                          <div className="overflow-hidden rounded-[1.9rem] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,246,0.96))] shadow-soft">
                            <div className="border-b border-border/60 bg-[linear-gradient(135deg,rgba(242,250,244,0.96),rgba(255,255,255,0.95))] px-5 py-5 sm:px-7">
                              <div className="flex items-start justify-between gap-4">
                                <div className="text-left">
                                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">M-Pesa Checkout</p>
                                  <MpesaWordmark className="mt-3" />
                                </div>
                                <div className="rounded-full border border-primary/15 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
                                  Secure STK
                                </div>
                              </div>
                              <div className="mt-5 flex items-end justify-between gap-4">
                                <div>
                                  <p className="text-sm font-medium text-foreground/80">Booking fee</p>
                                  <p className="mt-1 text-4xl font-semibold tracking-tight text-primary">
                                    {formatCurrencyAmount(bookingAmount, "KES")}
                                  </p>
                                </div>
                                <div className="max-w-[11rem] text-right text-xs leading-6 text-muted-foreground">
                                  Your session is only confirmed after the payment succeeds.
                                </div>
                              </div>
                            </div>

                            <div className="space-y-5 p-5 sm:p-7">
                              <div className="rounded-[1.4rem] border border-primary/12 bg-secondary/20 p-4 sm:p-5">
                                <Label htmlFor="payment-phone" className="text-sm font-semibold text-foreground">
                                  M-Pesa phone number
                                </Label>
                                <Input
                                  id="payment-phone"
                                  type="tel"
                                  value={paymentPhone}
                                  onChange={(event) => setPaymentPhone(event.target.value)}
                                  className="mt-3 h-12 rounded-2xl bg-background/95 text-base sm:text-center"
                                  placeholder="07XXXXXXXX or 01XXXXXXXX"
                                  required
                                />
                                <p className="mt-3 text-xs leading-6 text-muted-foreground">
                                  Use the Safaricom number that should receive the payment prompt.
                                </p>
                              </div>

                              <div className="flex items-start gap-2 rounded-[1.2rem] bg-secondary/35 px-4 py-3 text-xs leading-6 text-muted-foreground">
                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <p>Your payment is secure and only used to send the Safaricom STK prompt and record the transaction.</p>
                              </div>

                              <Button
                                variant="hero"
                                size="lg"
                                className="w-full rounded-full"
                                onClick={handleStartPayment}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? "Sending STK Push..." : "Pay with M-Pesa"}
                              </Button>

                              <p className="text-center text-xs leading-6 text-muted-foreground">
                                By continuing, you agree to the session booking terms and refundable fee policy.
                              </p>
                            </div>
                          </div>

                          <WhyPayCard />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  renderStatusStep()
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
