import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type BookingStep = "details" | "summary" | "payment" | "stk_sent" | "processing" | "success" | "failed";

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

const CHECKOUT_STAGE_COPY = [
  { label: "Review", description: "Session summary" },
  { label: "Pay", description: "M-Pesa checkout" },
  { label: "Confirm", description: "Booking confirmed" },
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
    <div className="mx-auto mt-6 flex w-full max-w-3xl flex-col gap-4 rounded-[1.75rem] border border-primary/10 bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {CHECKOUT_STAGE_COPY.map((stage, index) => {
          const isComplete = currentIndex > index || step === "success";
          const isActive = currentIndex === index && step !== "success";

          return (
            <div
              key={stage.label}
              className={cn(
                "rounded-[1.2rem] border px-4 py-3 text-left transition-all duration-200",
                isComplete
                  ? "border-primary/20 bg-primary/10"
                  : isActive
                    ? "border-primary/30 bg-card shadow-soft"
                    : "border-border/60 bg-card/75",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                    isComplete
                      ? "bg-primary text-primary-foreground"
                      : isActive
                        ? "bg-primary/12 text-primary"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{stage.label}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{stage.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
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
    <div className="relative mx-auto h-28 w-28">
      <div className={cn("absolute inset-0 rounded-full border border-dashed", toneClassName)} />
      <div className="absolute inset-[10px] rounded-full bg-black/10" />
      <div className={cn("absolute inset-[18px] flex items-center justify-center rounded-full border", toneClassName)}>
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
  switch (payment?.status) {
    case "cancelled":
      return {
        title: "Payment not completed",
        description: "The M-Pesa prompt was cancelled before the booking fee was confirmed.",
      };
    case "timed_out":
      return {
        title: "Payment timed out",
        description: "The STK prompt took too long to finish. Please check your phone and try again.",
      };
    case "insufficient_funds":
      return {
        title: "Insufficient funds",
        description: "The wallet balance was not enough for the booking fee. Top up and try again.",
      };
    default:
      return {
        title: "Payment not completed",
        description:
          payment?.resultDescription || "The booking fee could not be confirmed yet. Please check your phone and try again.",
      };
  }
};

const BookingSection = () => {
  const { therapist } = useWellnessHub();
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState<ServiceType>("individual");
  const [sessionType, setSessionType] = useState<SessionType>("virtual");
  const [step, setStep] = useState<BookingStep>("details");
  const [checkout, setCheckout] = useState<BookingCheckoutResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    }, 2200);

    const pollPayment = async () => {
      try {
        const latest = await fetchBookingPaymentStatus(checkout.booking.token, checkout.payment.id);
        if (!isActive) {
          return;
        }

        setCheckout(latest);
        const latestStatus = latest.payment.status;

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
    }, 4000);

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

  const handleServiceTypeSelect = (value: ServiceType) => {
    setServiceType(value);
    setForm((current) => ({
      ...current,
      participantCount: value === "corporate" ? current.participantCount : "",
    }));
  };

  const handleDetailsSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPaymentPhone(form.clientPhone);
    setPaymentFeedback("");
    setStep("summary");
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
        <div className="mx-auto max-w-xl rounded-[2rem] border border-border/60 bg-[linear-gradient(180deg,hsl(150_18%_16%),hsl(150_19%_12%))] px-6 py-10 text-center text-white shadow-card sm:px-8">
          <StatusHalo>
            <CheckCircle2 className="h-10 w-10" />
          </StatusHalo>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-white/65">STK Push Sent</p>
          <h3 className="mt-3 font-heading text-3xl font-semibold">Check your phone now</h3>
          <p className="mt-4 text-sm leading-8 text-white/78 sm:text-base">
            Enter your M-Pesa PIN on the prompt to finish the booking fee payment.
          </p>
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
      );
    }

    if (step === "processing") {
      return (
        <div className="mx-auto max-w-xl rounded-[2rem] border border-border/60 bg-[linear-gradient(180deg,hsl(150_18%_16%),hsl(150_19%_12%))] px-6 py-10 text-center text-white shadow-card sm:px-8">
          <StatusHalo>
            <LoaderCircle className="h-10 w-10 animate-spin" />
          </StatusHalo>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-white/65">Processing Payment</p>
          <h3 className="mt-3 font-heading text-3xl font-semibold">Confirming your payment</h3>
          <p className="mt-4 text-sm leading-8 text-white/78 sm:text-base">
            Please wait while we confirm your booking fee with M-Pesa.
          </p>
          <div className="mt-8 rounded-[1.4rem] border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-white/75">
            This usually takes a few seconds.
          </div>
          {paymentFeedback ? (
            <div className="mt-4 rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-white/72">
              {paymentFeedback}
            </div>
          ) : null}
        </div>
      );
    }

    if (step === "success") {
      return (
        <div className="mx-auto max-w-xl rounded-[2rem] border border-border/60 bg-card px-6 py-10 text-center shadow-hover sm:px-8">
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
      );
    }

    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border border-border/60 bg-card px-6 py-10 text-center shadow-card sm:px-8">
        <StatusHalo tone="destructive">
          <CircleAlert className="h-10 w-10" />
        </StatusHalo>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-primary/75">Payment Failed</p>
        <h3 className="mt-3 font-heading text-3xl font-semibold text-foreground">{failureCopy.title}</h3>
        <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">{failureCopy.description}</p>
        {activePayment?.resultDescription ? (
          <div className="mt-6 rounded-[1.2rem] border border-border/60 bg-secondary/35 px-4 py-4 text-left text-sm leading-7 text-muted-foreground">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Reason</p>
            <p className="mt-2 text-foreground">{activePayment.resultDescription}</p>
          </div>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="hero" className="rounded-full" onClick={handleStartPayment} disabled={isSubmitting}>
            {isSubmitting ? "Trying Again..." : "Try Again"}
          </Button>
          <Button variant="heroBorder" className="rounded-full" onClick={resetToPaymentStep}>
            Change Phone Number
          </Button>
        </div>
      </div>
    );
  };

  return (
    <section id="booking" className="py-24">
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
                  <div className="mb-6 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Secure Booking Checkout</p>
                    <h2 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">
                      Confirm your session in a few guided steps
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                      Review the summary, confirm the M-Pesa number, and complete the booking fee to reserve your time.
                    </p>
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

                    <Button variant="hero" size="lg" type="submit" className="mt-7 w-full rounded-full">
                      Book Your First Session
                    </Button>
                  </form>
                ) : step === "summary" ? (
                  <div className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-card sm:p-8">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/75">Step 1 of 3</p>
                        <h3 className="mt-2 font-heading text-3xl font-semibold text-foreground">Review your session</h3>
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
                ) : step === "payment" ? (
                  <div className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-card sm:p-8">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/75">Step 2 of 3</p>
                        <h3 className="mt-2 font-heading text-3xl font-semibold text-foreground">Pay the booking fee</h3>
                      </div>
                      <Button variant="heroBorder" className="rounded-full" onClick={() => setStep("summary")}>
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
                        therapistName={therapist.name}
                      />
                      <div className="space-y-5">
                        <div className="rounded-[1.9rem] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,246,0.96))] p-6 shadow-soft sm:p-7">
                          <div className="text-center">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/70">Payment</p>
                            <MpesaWordmark className="mt-4 justify-center" />
                            <p className="mt-4 text-sm font-medium text-foreground/80">Pay Deposit</p>
                            <p className="mt-2 text-4xl font-semibold tracking-tight text-primary">
                              {formatCurrencyAmount(bookingAmount, "KES")}
                            </p>
                            <p className="mt-3 text-sm leading-7 text-muted-foreground">
                              Enter the M-Pesa number you want to use for this booking fee.
                            </p>
                          </div>

                          <div className="mt-7">
                            <Label htmlFor="payment-phone">Enter your M-Pesa phone number</Label>
                            <Input
                              id="payment-phone"
                              type="tel"
                              value={paymentPhone}
                              onChange={(event) => setPaymentPhone(event.target.value)}
                              className="mt-2 h-12 rounded-2xl bg-background/95 text-center text-base tracking-[0.08em]"
                              placeholder="07XXXXXXXX or 01XXXXXXXX"
                              required
                            />
                          </div>

                          <div className="mt-4 flex items-start justify-center gap-2 text-xs text-muted-foreground">
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <p>Your payment is secure and only used to send the Safaricom STK prompt.</p>
                          </div>

                          <div className="mt-5 rounded-[1.2rem] bg-secondary/35 px-4 py-3 text-center text-xs leading-6 text-muted-foreground">
                            Powered by Safaricom M-Pesa
                          </div>

                          {paymentFeedback ? (
                            <div className="mt-4 rounded-[1.2rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-7 text-foreground">
                              {paymentFeedback}
                            </div>
                          ) : null}

                          <Button
                            variant="hero"
                            size="lg"
                            className="mt-6 w-full rounded-full"
                            onClick={handleStartPayment}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Sending STK Push..." : "Pay with M-Pesa"}
                          </Button>

                          <p className="mt-4 text-center text-xs leading-6 text-muted-foreground">
                            By continuing, you agree to the session booking terms and refundable fee policy.
                          </p>
                        </div>

                        <WhyPayCard />
                      </div>
                    </div>
                  </div>
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
