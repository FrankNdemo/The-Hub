import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Home,
  LoaderCircle,
  Mail,
  MapPin,
  ShieldCheck,
  User,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { useWellnessHub } from "@/context/WellnessHubContext";
import { rememberBookingAccess } from "@/lib/bookingAccess";
import {
  fetchBookingPaymentStatus,
  getApiErrorMessage,
  getSuggestedBookingSlot,
  precheckBooking,
  retryBookingCheckout,
  startBookingCheckout,
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

type BookingStep = "details" | "summary" | "payment" | "stk_sent" | "processing" | "success" | "failed";

const STK_SENT_PROMOTE_DELAY_MS = 900;
const PAYMENT_STATUS_POLL_INTERVAL_MS = 500;

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

const STK_PROMPT_STEPS = [
  "Open the Safaricom prompt on your phone.",
  "Enter your M-Pesa PIN to approve the booking fee.",
  "Return here while we confirm the payment automatically.",
];

const getCheckoutStageIndex = (step: BookingStep) => {
  if (step === "summary") {
    return 0;
  }

  if (step === "payment") {
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

const CheckoutStageRail = ({ step }: { step: BookingStep }) => {
  const currentIndex = getCheckoutStageIndex(step);

  return (
    <div className="mx-auto mt-6 flex w-full max-w-3xl items-center rounded-[1.75rem] border border-primary/10 bg-background/80 px-5 py-5 backdrop-blur">
      <div className="mx-auto flex w-full max-w-xl items-center gap-3">
        {CHECKOUT_STAGE_COPY.map((stage, index) => {
          const isComplete = currentIndex > index || step === "success";
          const isActive = currentIndex === index && step !== "success";

          return (
            <Fragment key={stage.label}>
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                  isComplete
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/80 bg-background/90 text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : index + 1}
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
  children,
}: {
  step: BookingStep;
  eyebrow: string;
  title: string;
  description: string;
  tone?: "light" | "dark" | "destructive" | "success";
  indicator: ReactNode;
  bareIndicator?: boolean;
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
      <div className="fixed inset-0 z-[141] flex items-center justify-center px-4 pb-6 pt-[5.85rem]">
        <div
          className={cn(
            "relative w-full max-w-[21.75rem] overflow-hidden rounded-[1.85rem] border px-4 pb-4 pt-3 shadow-[0_36px_80px_-34px_rgba(17,24,39,0.42)]",
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
}: {
  serviceType: ServiceType;
  sessionType: SessionType;
  date: string;
  time: string;
  therapistName: string;
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
          value: formatCurrencyAmount(200, "KES"),
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
  const resultDescription = payment?.resultDescription?.toLowerCase() ?? "";

  switch (payment?.status) {
    case "cancelled":
      return {
        title: "Payment Cancelled",
        description: "You cancelled the M-Pesa prompt before the booking fee was confirmed. Your session is not booked yet.",
      };
    case "timed_out":
      return {
        title: "Payment timed out",
        description: "The M-Pesa prompt on your phone took too long to finish. Your session is not booked yet, so please try again.",
      };
    case "insufficient_funds":
      return {
        title: "Insufficient funds",
        description: "Your M-Pesa balance was not enough for the booking fee. Your session is not booked yet.",
      };
    default:
      if (resultDescription.includes("pin") || resultDescription.includes("credential") || resultDescription.includes("initiator")) {
        return {
          title: "Incorrect M-Pesa PIN",
          description: payment?.resultDescription || "The M-Pesa PIN entered on your phone was not accepted. Your session is not booked yet.",
        };
      }

      return {
        title: "Payment not complete",
        description:
          payment?.resultDescription || "We could not confirm the booking fee on your phone. No session has been booked yet.",
      };
  }
};

const BookingSection = () => {
  const { therapist } = useWellnessHub();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>("individual");
  const [sessionType, setSessionType] = useState<SessionType>("virtual");
  const [step, setStep] = useState<BookingStep>("details");
  const [checkout, setCheckout] = useState<BookingCheckoutResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [bookingGuidance, setBookingGuidance] = useState("");
  const [paymentFeedback, setPaymentFeedback] = useState("");
  const [serviceDescriptionText, setServiceDescriptionText] = useState("");
  const [isDeletingServiceDescription, setIsDeletingServiceDescription] = useState(false);
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    therapistId: therapist.id,
    date: "",
    time: "",
    participantCount: "",
    notes: "",
  });
  const [paymentPhone, setPaymentPhone] = useState("");
  const activeServiceCard = serviceCards.find((item) => item.type === serviceType) ?? serviceCards[0];
  const todayDate = getTodayDateInputValue();

  const activePayment = checkout?.payment ?? null;
  const failureCopy = getFailureCopy(activePayment);

  const bookingAmount = useMemo(
    () => (checkout?.booking.bookingFeeAmount ? checkout.booking.bookingFeeAmount : 200),
    [checkout?.booking.bookingFeeAmount],
  );

  const updateField = (field: keyof typeof form, value: string) => {
    setBookingGuidance("");
    setCheckout(null);
    setPaymentFeedback("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    setServiceDescriptionText("");
    setIsDeletingServiceDescription(false);
  }, [serviceType]);

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
    const promoteTimer = window.setTimeout(() => {
      if (isActive) {
        setStep((current) => (current === "stk_sent" ? "processing" : current));
      }
    }, STK_SENT_PROMOTE_DELAY_MS);

    const pollPayment = async () => {
      try {
        const latest = await fetchBookingPaymentStatus(checkout.booking.token, checkout.payment.id);
        if (!isActive) {
          return;
        }

        setCheckout(latest);
        const latestStatus = latest.payment.status;

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

        setPaymentFeedback(getApiErrorMessage(error, "We could not refresh the payment status just now."));
      }
    };

    void pollPayment();
    const intervalId = window.setInterval(() => {
      void pollPayment();
    }, PAYMENT_STATUS_POLL_INTERVAL_MS);

    return () => {
      isActive = false;
      window.clearTimeout(promoteTimer);
      window.clearInterval(intervalId);
    };
  }, [checkout?.booking.token, checkout?.payment.id, form.clientEmail, step]);

  useEffect(() => {
    if (step !== "success" || !checkout?.booking.token) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigate(`/manage/${checkout.booking.token}`);
    }, 2800);

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

  const handleDetailsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const participantCount =
      serviceType === "corporate" && form.participantCount
        ? Number.parseInt(form.participantCount, 10)
        : undefined;

    setIsCheckingAvailability(true);
    setBookingGuidance("");
    setPaymentFeedback("");

    try {
      await precheckBooking({
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
      });
      setCheckout(null);
      setPaymentPhone(form.clientPhone);
      setStep("summary");
    } catch (error) {
      const message = getApiErrorMessage(error, "We could not confirm availability right now.");
      const suggestion = getSuggestedBookingSlot(error);

      if (suggestion) {
        setForm((current) => ({
          ...current,
          date: suggestion.date,
          time: suggestion.time,
        }));
        setBookingGuidance(`${message} We prefilled the next available option so you can continue quickly.`);
        toast.error(`${message} We prefilled ${formatDisplayDate(suggestion.date)} at ${formatDisplayTime(suggestion.time)}.`);
      } else {
        setBookingGuidance(message);
        toast.error(message);
      }
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleStartPayment = async () => {
    const participantCount =
      serviceType === "corporate" && form.participantCount
        ? Number.parseInt(form.participantCount, 10)
        : undefined;

    setIsSubmitting(true);
    setPaymentFeedback("");

    try {
      const nextCheckout =
        checkout?.payment.canRetry && checkout.booking.token
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
      setStep("stk_sent");
      toast.success("STK push sent. Check your phone to complete the payment.");
    } catch (error) {
      const message = getApiErrorMessage(error, "We could not start the M-Pesa payment right now.");
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
        setStep("payment");
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToPaymentStep = () => {
    setPaymentFeedback("");
    setStep("payment");
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

          <div className="hidden overflow-hidden rounded-[2rem] border border-border/60 bg-[linear-gradient(180deg,hsl(150_18%_16%),hsl(150_19%_12%))] px-6 py-10 text-center text-white shadow-card sm:mx-auto sm:block sm:max-w-xl sm:px-8">
            <StatusHalo>
              <CheckCircle2 className="h-10 w-10" />
            </StatusHalo>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-white/65">STK Push Sent</p>
            <h3 className="mt-3 font-heading text-3xl font-semibold">STK Push Sent!</h3>
            <p className="mt-4 text-sm leading-8 text-white/78 sm:text-base">
              Enter your M-Pesa PIN on the prompt to finish the booking fee payment.
            </p>
            <div className="mt-8 grid gap-3 text-left">
              {STK_PROMPT_STEPS.map((instruction, index) => (
                <div key={instruction} className="flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-[hsl(136_60%_72%)]">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-white/78">{instruction}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-[1.4rem] border border-white/10 bg-white/5 px-5 py-4 text-left">
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
            {paymentFeedback ? (
              <div className="mt-3 rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white/72">
                {paymentFeedback}
              </div>
            ) : null}
          </MobileStatusSheet>

          <div className="hidden rounded-[2rem] border border-border/60 bg-[linear-gradient(180deg,hsl(150_18%_16%),hsl(150_19%_12%))] px-6 py-10 text-center text-white shadow-card sm:mx-auto sm:block sm:max-w-xl sm:px-8">
            <StatusHalo>
              <LoaderCircle className="h-10 w-10 animate-spin" />
            </StatusHalo>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-white/65">Processing Payment</p>
            <h3 className="mt-3 font-heading text-3xl font-semibold">Confirming your payment</h3>
            <p className="mt-4 text-sm leading-8 text-white/78 sm:text-base">
              Please wait while we confirm your booking fee with M-Pesa.
            </p>
            <div className="mt-8 rounded-[1.4rem] border border-white/10 bg-white/5 px-5 py-4 text-left text-sm leading-7 text-white/75">
              <p className="font-medium text-white">What happens next</p>
              <p className="mt-2">We are checking the Safaricom response, updating your booking, and preparing the confirmation details.</p>
              <p className="mt-2 text-white/58">This usually takes a few seconds.</p>
            </div>
            {paymentFeedback ? (
              <div className="mt-4 rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-white/72">
                {paymentFeedback}
              </div>
            ) : null}
          </div>
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
            description="Your deposit has been received. Your session is now booked."
            indicator={<CheckCircle2 className="h-10 w-10" />}
          >
            <div className="rounded-[1.1rem] bg-primary/8 px-4 py-4 text-center">
              <p className="text-sm text-muted-foreground">Your deposit of</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-primary">{formatCurrencyAmount(bookingAmount, "KES")}</p>
              <p className="mt-3 text-sm text-muted-foreground">has been received.</p>
            </div>
            <div className="mt-4 grid gap-3">
              <Button
                variant="hero"
                className="w-full rounded-xl"
                onClick={() => checkout && navigate(`/manage/${checkout.booking.token}`)}
              >
                View Booking
              </Button>
              <Button variant="heroBorder" className="w-full rounded-xl" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </div>
          </MobileStatusSheet>

          <div className="hidden rounded-[2rem] border border-border/60 bg-card px-6 py-10 text-center shadow-hover sm:mx-auto sm:block sm:max-w-xl sm:px-8">
            <StatusHalo tone="success">
              <CheckCircle2 className="h-10 w-10" />
            </StatusHalo>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-primary/75">Payment Successful</p>
            <h3 className="mt-3 font-heading text-3xl font-semibold text-foreground">Your session is booked</h3>
            <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">
              Your deposit of {formatCurrencyAmount(bookingAmount, "KES")} has been received. A confirmation email has
              been sent for your session. Please check your mail.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-border/60 bg-secondary/35 px-4 py-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/65">Payment method</p>
                <p className="mt-2 text-base font-semibold text-foreground">{activePayment?.paymentMethod ?? "M-Pesa STK Push"}</p>
              </div>
              <div className="rounded-[1.2rem] border border-border/60 bg-secondary/35 px-4 py-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/65">Transaction ID</p>
                <p className="mt-2 text-base font-semibold text-foreground">{activePayment?.transactionId ?? "Awaiting receipt"}</p>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="hero" className="rounded-full" onClick={() => checkout && navigate(`/manage/${checkout.booking.token}`)}>
                View Booking
              </Button>
              <Button variant="heroBorder" className="rounded-full" onClick={() => navigate("/")}>
                <Home className="h-4 w-4" />
                Back Home
              </Button>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-primary/60">Opening your booking page automatically...</p>
          </div>
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
          >
          <div className="mt-4 grid gap-3">
            <Button variant="hero" className="w-full rounded-xl" onClick={handleStartPayment} disabled={isSubmitting}>
              {isSubmitting ? "Trying Again..." : "Try Again"}
            </Button>
            <Button variant="heroBorder" className="w-full rounded-xl" onClick={resetToPaymentStep}>
              Change Phone Number
            </Button>
          </div>
        </MobileStatusSheet>

        <div className="hidden rounded-[2rem] border border-border/60 bg-card px-6 py-10 text-center shadow-card sm:mx-auto sm:block sm:max-w-xl sm:px-8">
          <StatusHalo tone="destructive">
            <CircleAlert className="h-10 w-10" />
          </StatusHalo>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-primary/75">Payment Failed</p>
          <h3 className="mt-3 font-heading text-3xl font-semibold text-foreground">{failureCopy.title}</h3>
          <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">{failureCopy.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="hero" className="rounded-full" onClick={handleStartPayment} disabled={isSubmitting}>
              {isSubmitting ? "Trying Again..." : "Try Again"}
            </Button>
            <Button variant="heroBorder" className="rounded-full" onClick={resetToPaymentStep}>
              Change Phone Number
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <section id="booking" ref={sectionRef} className="py-24">
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
                  <div className="mb-6 hidden text-center sm:block">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Secure Booking Checkout</p>
                    <h2 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">
                      Confirm your session in a few guided steps
                    </h2>
                   
                    <CheckoutStageRail step={step} />
                  </div>
                ) : null}
                {step === "details" ? (
                  <form onSubmit={handleDetailsSubmit} className="overflow-hidden rounded-[2rem] border border-border/60 bg-card p-6 shadow-card sm:p-8">
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

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="booking-date">Preferred Date</Label>
                        <Input
                          id="booking-date"
                          type="date"
                          value={form.date}
                          onChange={(event) => updateField("date", event.target.value)}
                          className="mt-2"
                          min={todayDate}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="booking-time">Preferred Time</Label>
                        <Input
                          id="booking-time"
                          type="time"
                          value={form.time}
                          onChange={(event) => updateField("time", event.target.value)}
                          className="mt-2"
                          min={BOOKING_OPEN_TIME}
                          max={BOOKING_LAST_START_TIME}
                          step={BOOKING_TIME_STEP_SECONDS}
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-4 rounded-[1.25rem] bg-primary/8 px-4 py-3 text-sm leading-7 text-muted-foreground">
                      {BOOKING_AVAILABILITY_DETAIL}
                    </div>

                    {bookingGuidance ? (
                      <div className="mt-4 rounded-[1.25rem] border border-primary/20 bg-primary/8 px-4 py-3 text-sm leading-7 text-foreground">
                        {bookingGuidance}
                      </div>
                    ) : null}

                    <div className="mt-5">
                      <Label htmlFor="booking-therapist">Preferred Therapist</Label>
                      <select
                        id="booking-therapist"
                        className="mt-2 flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={form.therapistId}
                        onChange={(event) => updateField("therapistId", event.target.value)}
                      >
                        <option value={therapist.id}>
                          {therapist.name} - {therapist.title}
                        </option>
                      </select>
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

                    <Button variant="hero" size="lg" type="submit" className="mt-7 w-full rounded-full" disabled={isCheckingAvailability}>
                      {isCheckingAvailability ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Checking Availability...
                        </>
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

                    <div className="hidden rounded-[2rem] border border-border/60 bg-card p-6 shadow-card sm:block sm:p-8">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-heading text-3xl font-semibold text-foreground">Review your session</h3>
                        </div>
                        <Button variant="heroBorder" className="rounded-full" onClick={() => setStep("details")}>
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
                          therapistName={therapist.name}
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

                        {paymentFeedback ? (
                          <div className="mt-4 rounded-[1.2rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-7 text-foreground">
                            {paymentFeedback}
                          </div>
                        ) : null}

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

                    <div className="hidden rounded-[2rem] border border-border/60 bg-card p-6 shadow-card sm:block sm:p-8">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-heading text-3xl font-semibold text-foreground">Pay the booking fee</h3>
                        </div>
                        <Button variant="heroBorder" className="rounded-full" onClick={() => setStep("summary")}>
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
                            therapistName={therapist.name}
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

                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-[1.2rem] border border-border/60 bg-background/90 px-4 py-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/65">Session slot</p>
                                  <p className="mt-2 text-sm font-medium leading-7 text-foreground">
                                    {form.date && form.time
                                      ? `${formatDisplayDate(form.date)} at ${formatDisplayTime(form.time)}`
                                      : "Select a session time"}
                                  </p>
                                </div>
                                <div className="rounded-[1.2rem] border border-border/60 bg-background/90 px-4 py-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/65">Confirmation</p>
                                  <p className="mt-2 text-sm font-medium leading-7 text-foreground">
                                    Booking email and receipt send immediately after successful payment.
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2 rounded-[1.2rem] bg-secondary/35 px-4 py-3 text-xs leading-6 text-muted-foreground">
                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <p>Your payment is secure and only used to send the Safaricom STK prompt and record the transaction.</p>
                              </div>

                              {paymentFeedback ? (
                                <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-7 text-foreground">
                                  {paymentFeedback}
                                </div>
                              ) : null}

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
