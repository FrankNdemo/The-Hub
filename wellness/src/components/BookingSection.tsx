import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Briefcase,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Mail,
  MapPin,
  ShieldCheck,
  User,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { useWellnessHub } from "@/context/WellnessHubContext";
import { getApiErrorMessage, getSuggestedBookingSlot } from "@/lib/api";
import {
  BOOKING_AVAILABILITY_DETAIL,
  BOOKING_AVAILABILITY_SUMMARY,
  BOOKING_LAST_START_TIME,
  BOOKING_OPEN_TIME,
  BOOKING_TIME_STEP_SECONDS,
  formatDisplayDate,
  formatDisplayTime,
  formatServiceType,
  getTodayDateInputValue,
} from "@/lib/wellness";
import type { BookingRecord, ServiceType, SessionType } from "@/types/wellness";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ScrollReveal from "@/components/ScrollReveal";
import { Textarea } from "@/components/ui/textarea";

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

const BookingSection = () => {
  const { submitBooking, therapist } = useWellnessHub();
  const [serviceType, setServiceType] = useState<ServiceType>("individual");
  const [sessionType, setSessionType] = useState<SessionType>("virtual");
  const [submittedBooking, setSubmittedBooking] = useState<BookingRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingGuidance, setBookingGuidance] = useState("");
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
  const activeServiceCard = serviceCards.find((item) => item.type === serviceType) ?? serviceCards[0];

  const updateField = (field: keyof typeof form, value: string) => {
    setBookingGuidance("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const todayDate = getTodayDateInputValue();

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

  const handleServiceTypeSelect = (value: ServiceType) => {
    setServiceType(value);
    setForm((current) => ({
      ...current,
      participantCount: value === "corporate" ? current.participantCount : "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const participantCount =
      serviceType === "corporate" && form.participantCount
        ? Number.parseInt(form.participantCount, 10)
        : undefined;

    setIsSubmitting(true);

    try {
      const booking = await submitBooking({
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

      setSubmittedBooking(booking);
      setBookingGuidance("");
      toast.success("Your booking is confirmed. Please check your email.");
    } catch (error) {
      const message = getApiErrorMessage(error, "We could not confirm your booking right now.");
      const suggestion = getSuggestedBookingSlot(error);

      if (suggestion) {
        setForm((current) => ({
          ...current,
          date: suggestion.date,
          time: suggestion.time,
        }));
        setBookingGuidance(`${message} We prefilled the next available option so you can confirm it quickly.`);
        toast.error(`${message} We prefilled ${formatDisplayDate(suggestion.date)} at ${formatDisplayTime(suggestion.time)}.`);
      } else {
        setBookingGuidance(message);
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyManageLink = async () => {
    if (!submittedBooking) {
      return;
    }

    try {
      await navigator.clipboard.writeText(submittedBooking.manageUrl);
      toast.success("Private manage link copied.");
    } catch {
      toast.error("Unable to copy the link right now.");
    }
  };

  return (
    <section id="booking" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <ScrollReveal direction="left">
            <div className="wellness-panel rounded-[2rem] border border-border/60 p-6 text-center shadow-card sm:p-8 lg:text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Booking Flow</p>
              <h2 className="mt-4 font-heading text-4xl font-semibold text-foreground md:text-5xl">
                Book your first session with confidence.
              </h2>
              <p className="mt-4 max-w-lg text-muted-foreground leading-8">
                Choose your therapist, pick a session format, and receive a private link that lets you reschedule or
                cancel later without needing an account.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: CalendarDays,
                    title: "Calendar-ready booking",
                    description: "Each booking includes a calendar event reference and confirmation details for both client and therapist.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Private manage link",
                    description: "A secure session link is generated for rescheduling or cancellation without login barriers.",
                  },
                  {
                    icon: Mail,
                    title: "Confirmation package",
                    description: "A confirmation message arrives with your session details, timing, and next-step guidance.",
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

            <ScrollReveal direction="right">
            <div>
              {submittedBooking ? (
                <div className="rounded-[2rem] border border-border/60 bg-card p-6 text-center shadow-hover sm:p-8 sm:text-left">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary animate-glow sm:mx-0">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 font-heading text-3xl font-semibold text-foreground">Your session is confirmed</h3>
                  <p className="mt-3 max-w-2xl text-muted-foreground leading-8">
                    Please check your email for the confirmation package sent to you and {therapist.name}. Add the
                    appointment to your calendar now, then use the same private session link on the meeting day.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Date</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{formatDisplayDate(submittedBooking.date)}</p>
                    </div>
                    <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Time</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{formatDisplayTime(submittedBooking.time)}</p>
                    </div>
                    <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Service Type</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{formatServiceType(submittedBooking.serviceType)}</p>
                    </div>
                    <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Session Type</p>
                      <p className="mt-2 text-lg font-semibold capitalize text-foreground">{submittedBooking.sessionType}</p>
                    </div>
                    <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Therapist</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{submittedBooking.therapistName}</p>
                    </div>
                    {submittedBooking.serviceType === "corporate" && submittedBooking.participantCount ? (
                      <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 text-center">
                        <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Participants</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">
                          {submittedBooking.participantCount.toLocaleString()}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {submittedBooking.sessionType === "virtual" && submittedBooking.joinUrl ? (
                    <div className="mt-6 rounded-[1.5rem] bg-primary/8 p-5 text-center sm:text-left">
                      <p className="text-sm font-medium text-foreground">Virtual session access</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        The private session link on this page, in your email, and in the calendar event is the same. It
                        opens the room on the session day.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 rounded-[1.5rem] bg-primary/8 p-5">
                      <p className="text-sm font-medium text-foreground">Session location</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{submittedBooking.locationSummary}</p>
                    </div>
                  )}

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {submittedBooking.addToCalendarUrl ? (
                      <a
                        href={submittedBooking.addToCalendarUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex min-h-20 items-center justify-between gap-4 rounded-[1.25rem] border border-primary/20 bg-background px-5 py-4 text-left shadow-soft transition-colors hover:border-primary/45 hover:bg-primary/8"
                      >
                        <span>
                          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
                            Calendar
                          </span>
                          <span className="mt-1 block font-heading text-xl font-semibold text-foreground">
                            Add to Google Calendar
                          </span>
                        </span>
                        <ExternalLink className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </a>
                    ) : null}
                    {submittedBooking.sessionType === "virtual" && submittedBooking.joinUrl ? (
                      <a
                        href={submittedBooking.joinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex min-h-20 items-center justify-between gap-4 rounded-[1.25rem] border border-primary/20 bg-background px-5 py-4 text-left shadow-soft transition-colors hover:border-primary/45 hover:bg-primary/8"
                      >
                        <span>
                          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
                            Session link
                          </span>
                          <span className="mt-1 block font-heading text-xl font-semibold text-foreground">
                            Open virtual session
                          </span>
                        </span>
                        <ExternalLink className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </a>
                    ) : null}
                    <Link
                      to={`/manage/${submittedBooking.token}`}
                      className="group flex min-h-20 items-center justify-between gap-4 rounded-[1.25rem] border border-primary/20 bg-background px-5 py-4 text-left shadow-soft transition-colors hover:border-primary/45 hover:bg-primary/8"
                    >
                      <span>
                        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
                          Private link
                        </span>
                        <span className="mt-1 block font-heading text-xl font-semibold text-foreground">
                          Manage this session
                        </span>
                      </span>
                      <ExternalLink className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Button type="button" variant="heroBorder" className="w-full rounded-full sm:w-auto" onClick={copyManageLink}>
                      <Copy className="h-4 w-4" />
                      Copy Private Link
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-card sm:p-8">
                  <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:text-left">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Clock3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-3xl font-semibold text-foreground">Schedule your appointment</h3>
                      <p className="text-sm text-muted-foreground">
                        Select your preferred details and we will prepare the confirmation package immediately.
                      </p>
                    </div>
                  </div>

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
                        placeholder="+254 7XX XXX XXX"
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
                      <option value={therapist.id}>{therapist.name} - {therapist.title}</option>
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
                            <p className="text-[8px] leading-tight text-muted-foreground sm:text-[10px]">
                              {item.description}
                            </p>
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

                  <Button variant="hero" size="lg" type="submit" className="mt-7 w-full rounded-full" disabled={isSubmitting}>
                    {isSubmitting ? "Confirming Your Session..." : "Book Your First Session"}
                  </Button>
                </form>
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
