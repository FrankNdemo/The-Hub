import { useState } from "react";
import { CalendarClock, CheckCircle2, Compass, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  getTodayDateInputValue,
} from "@/lib/wellness";
import { softPageBackgroundStyle } from "@/lib/pageBackground";
import type { BookingRecord } from "@/types/wellness";

const EXPLORATION_CALL_MARKER = "[exploration-call]";

const buildExplorationNotes = (note: string) => {
  const trimmed = note.trim();
  return trimmed
    ? `${EXPLORATION_CALL_MARKER} Client wants clarity before committing to a full therapy session. ${trimmed}`
    : `${EXPLORATION_CALL_MARKER} Client wants clarity before committing to a full therapy session.`;
};

const ExplorationCallPage = () => {
  const { submitBooking, therapist } = useWellnessHub();
  const [submittedBooking, setSubmittedBooking] = useState<BookingRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingGuidance, setBookingGuidance] = useState("");
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    therapistId: therapist.id,
    date: "",
    time: "",
    notes: "",
  });

  const todayDate = getTodayDateInputValue();

  const updateField = (field: keyof typeof form, value: string) => {
    setBookingGuidance("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const booking = await submitBooking({
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        clientPhone: form.clientPhone,
        therapistId: form.therapistId,
        date: form.date,
        time: form.time,
        serviceType: "individual",
        sessionType: "virtual",
        notes: buildExplorationNotes(form.notes),
      });

      setSubmittedBooking(booking);
      setBookingGuidance("");
      toast.success("Thanks for booking an exploration call. Please check your email.");
    } catch (error) {
      const message = getApiErrorMessage(error, "We could not confirm your exploration call right now.");
      const suggestion = getSuggestedBookingSlot(error);

      if (suggestion) {
        setForm((current) => ({
          ...current,
          date: suggestion.date,
          time: suggestion.time,
        }));
        setBookingGuidance(`${message} We prefilled the next available time so you can confirm quickly.`);
        toast.error(`${message} We prefilled ${formatDisplayDate(suggestion.date)} at ${formatDisplayTime(suggestion.time)}.`);
      } else {
        setBookingGuidance(message);
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={softPageBackgroundStyle}>
      <section className="pt-24 pb-12 md:pt-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto overflow-hidden rounded-[2.5rem] border border-border/60 bg-card shadow-card">
            <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
              <ScrollReveal direction="left">
                <div className="wellness-section-surface px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Exploration Call</p>
                  <h1 className="mt-4 font-heading text-4xl font-semibold text-foreground md:text-[3.2rem]">
                    A short first call to help you choose the right support.
                  </h1>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
                    An exploration call works like a gentle first request. You share what kind of support you may need,
                    suggest a suitable time, and the therapist follows up directly to decide the best next step with
                    you.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        icon: Compass,
                        title: "What it is for",
                        description: "Clarity, fit, and direction before committing to a full session.",
                      },
                      {
                        icon: CalendarClock,
                        title: "What it is not",
                        description: "Not a full therapy appointment or deep assessment session.",
                      },
                      {
                        icon: MessageCircle,
                        title: "Best when unsure",
                        description: "Useful if you are deciding between services or want a softer first step.",
                      },
                      {
                        icon: Sparkles,
                        title: "Simple next step",
                        description: "Send the request below and the therapist follows up directly in the most suitable way.",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 shadow-card"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">{item.title}</h2>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:flex-row">
                    <Button
                      variant="hero"
                      className="h-10 min-w-0 rounded-full px-3 text-[0.68rem] font-medium uppercase tracking-[0.04em] sm:px-6 sm:text-sm sm:tracking-normal"
                      asChild
                    >
                      <a href="#book-exploration-call">
                        <span className="sm:hidden">Book Call</span>
                        <span className="hidden sm:inline">Book This Call</span>
                      </a>
                    </Button>
                    <Button
                      variant="heroBorder"
                      className="h-10 min-w-0 rounded-full px-3 text-[0.64rem] font-medium uppercase tracking-[0.02em] sm:px-6 sm:text-sm sm:tracking-normal"
                      asChild
                    >
                      <Link to="/booking">
                        <span className="sm:hidden">Full Booking</span>
                        <span className="hidden sm:inline">Go to Full Session Booking</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="right">
                <div className="bg-[linear-gradient(160deg,hsl(42_31%_99%),hsl(136_18%_92%))] px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
                  <div className="rounded-[2rem] border border-border/60 bg-background/90 p-6 shadow-card">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">What to expect</p>
                    <div className="mt-5 space-y-4">
                      {[
                        "A brief virtual call focused on questions, fit, and your next step.",
                        "A chance to talk through what kind of support would feel most useful.",
                        "A clear outcome: either move into therapy or leave with a calmer understanding of your options.",
                      ].map((point) => (
                        <div key={point} className="flex items-start gap-3">
                          <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                          <p className="text-sm leading-7 text-muted-foreground">{point}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 rounded-[1.5rem] border border-primary/15 bg-primary/8 p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">Call format</p>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        This page sends a structured exploration request to {therapist.name}. Once it arrives, the
                        therapist can call, email, or choose another suitable way to reach you directly.
                      </p>
                    </div>

                    <div className="mt-8 rounded-[1.5rem] bg-foreground px-5 py-5 text-primary-foreground shadow-soft">
                      <p className="text-sm uppercase tracking-[0.22em] text-primary-foreground/65">Availability</p>
                      <p className="mt-3 text-lg font-medium">{BOOKING_AVAILABILITY_SUMMARY}</p>
                      <p className="mt-2 text-sm leading-7 text-primary-foreground/75">{BOOKING_AVAILABILITY_DETAIL}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <section id="book-exploration-call" className="scroll-mt-28 pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            {submittedBooking ? (
              <div className="rounded-[2rem] border border-border/60 bg-card p-6 text-center shadow-hover sm:p-8 sm:text-left">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary animate-glow sm:mx-0">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="mt-6 font-heading text-3xl font-semibold text-foreground">Thanks for booking an exploration call</h2>
                <p className="mt-3 max-w-2xl text-muted-foreground leading-8">
                  Your request has been sent to {submittedBooking.therapistName}. Please check your email for the
                  confirmation, then expect a call or direct follow-up once the therapist reviews your details.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 text-center">
                    <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Preferred Date</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{formatDisplayDate(submittedBooking.date)}</p>
                  </div>
                  <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 text-center">
                    <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Preferred Time</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{formatDisplayTime(submittedBooking.time)}</p>
                  </div>
                  <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 text-center">
                    <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Request Type</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">Exploration Call</p>
                  </div>
                  <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 text-center">
                    <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Therapist</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{submittedBooking.therapistName}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-[1.5rem] bg-primary/8 p-5 text-center sm:text-left">
                  <p className="text-sm font-medium text-foreground">What happens next</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {submittedBooking.locationSummary}
                  </p>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-border/60 bg-background/80 p-5 text-center sm:text-left">
                  <p className="text-sm font-medium text-foreground">Need to change this request later?</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Use the secure link inside your confirmation email if you ever need to update or cancel it before
                    the therapist reaches you.
                  </p>
                </div>
              </div>
            ) : (
              <ScrollReveal direction="up">
                <form onSubmit={handleSubmit} className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-card sm:p-8">
                  <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:text-left">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <CalendarClock className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-heading text-3xl font-semibold text-foreground">Book your exploration call</h2>
                      <p className="text-sm text-muted-foreground">
                        Simple, private, and separate from the full therapy session booking flow.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="exploration-name">Full Name</Label>
                          <Input
                            id="exploration-name"
                            value={form.clientName}
                            onChange={(event) => updateField("clientName", event.target.value)}
                            className="mt-2"
                            placeholder="Your full name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="exploration-phone">Phone Number</Label>
                          <Input
                            id="exploration-phone"
                            type="tel"
                            value={form.clientPhone}
                            onChange={(event) => updateField("clientPhone", event.target.value)}
                            className="mt-2"
                            placeholder="+254 7XX XXX XXX"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="exploration-email">Email Address</Label>
                        <Input
                          id="exploration-email"
                          type="email"
                          value={form.clientEmail}
                          onChange={(event) => updateField("clientEmail", event.target.value)}
                          className="mt-2"
                          placeholder="you@example.com"
                          required
                        />
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="exploration-date">Preferred Date</Label>
                          <Input
                            id="exploration-date"
                            type="date"
                            value={form.date}
                            onChange={(event) => updateField("date", event.target.value)}
                            className="mt-2"
                            min={todayDate}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="exploration-time">Preferred Time</Label>
                          <Input
                            id="exploration-time"
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

                      <div>
                        <Label htmlFor="exploration-notes">What would you like clarity on?</Label>
                        <Textarea
                          id="exploration-notes"
                          value={form.notes}
                          onChange={(event) => updateField("notes", event.target.value)}
                          className="mt-2 min-h-[120px]"
                          placeholder="For example: I am not sure which type of support fits me best, or I want to understand what the first full session would look like."
                        />
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 shadow-card">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/75">Your therapist</p>
                        <h3 className="mt-3 font-heading text-2xl font-semibold text-foreground">{therapist.name}</h3>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">{therapist.title}</p>
                      </div>

                  <div className="rounded-[1.5rem] border border-primary/15 bg-primary/8 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">Call details</p>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Compass className="mt-1 h-4 w-4 shrink-0 text-primary" />
                        <p className="text-sm leading-7 text-muted-foreground">Purpose: clarity, fit, and next-step guidance.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <MessageCircle className="mt-1 h-4 w-4 shrink-0 text-primary" />
                        <p className="text-sm leading-7 text-muted-foreground">
                          Follow-up: the therapist reviews your preferred time, then reaches out directly by phone,
                          email, or another suitable method.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
                            <p className="text-sm leading-7 text-muted-foreground">Privacy: your call details stay private and manageable through a secure link.</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.25rem] bg-primary/8 px-4 py-3 text-sm leading-7 text-muted-foreground">
                        {BOOKING_AVAILABILITY_DETAIL}
                      </div>

                      {bookingGuidance ? (
                        <div className="rounded-[1.25rem] border border-primary/20 bg-primary/8 px-4 py-3 text-sm leading-7 text-foreground">
                          {bookingGuidance}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <Button variant="hero" size="lg" type="submit" className="mt-7 w-full rounded-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending Your Request..." : "Send Exploration Call Request"}
                  </Button>
                </form>
              </ScrollReveal>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ExplorationCallPage;
