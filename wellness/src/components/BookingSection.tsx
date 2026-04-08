import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Mail,
  MapPin,
  ShieldCheck,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { useWellnessHub } from "@/context/WellnessHubContext";
import { formatDisplayDate, formatDisplayTime } from "@/lib/wellness";
import type { BookingRecord, SessionType } from "@/types/wellness";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const sessionCards: {
  type: SessionType;
  title: string;
  description: string;
  icon: typeof Video;
}[] = [
  {
    type: "virtual",
    title: "Virtual Session",
    description: "Online support with a Google Meet style session link prepared in your confirmation.",
    icon: Video,
  },
  {
    type: "physical",
    title: "Physical Session",
    description: "In-person care at our Westlands centre in a calm, welcoming environment.",
    icon: MapPin,
  },
];

const BookingSection = () => {
  const { submitBooking, therapist } = useWellnessHub();
  const [sessionType, setSessionType] = useState<SessionType>("virtual");
  const [submittedBooking, setSubmittedBooking] = useState<BookingRecord | null>(null);
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    therapistId: therapist.id,
    date: "",
    time: "",
    notes: "",
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const booking = submitBooking({
      ...form,
      therapistId: therapist.id,
      sessionType,
    });

    setSubmittedBooking(booking);
    toast.success("Your booking has been confirmed.");
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
                    description: "Beautiful HTML confirmation content is prepared with date, time, therapist, and session details.",
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
                <p className="mt-3 text-lg font-medium">Tuesday to Saturday, 10:00 AM to 7:00 PM</p>
                <p className="mt-2 text-sm text-primary-foreground/70">
                  Physical sessions take place in Westlands. Virtual sessions are prepared with a live meeting link.
                </p>
              </div>
            </div>

            <div>
              {submittedBooking ? (
                <div className="rounded-[2rem] border border-border/60 bg-card p-6 text-center shadow-hover sm:p-8 sm:text-left">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary animate-glow sm:mx-0">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 font-heading text-3xl font-semibold text-foreground">Your session is confirmed</h3>
                  <p className="mt-3 max-w-2xl text-muted-foreground leading-8">
                    A confirmation package has been prepared for you and {therapist.name}. Use your private manage link
                    below anytime you need to reschedule or cancel.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Date</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{formatDisplayDate(submittedBooking.date)}</p>
                    </div>
                    <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Time</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{formatDisplayTime(submittedBooking.time)}</p>
                    </div>
                    <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Session Type</p>
                      <p className="mt-2 text-lg font-semibold capitalize text-foreground">{submittedBooking.sessionType}</p>
                    </div>
                    <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Therapist</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{submittedBooking.therapistName}</p>
                    </div>
                  </div>

                  {submittedBooking.sessionType === "virtual" && submittedBooking.meetLink ? (
                    <div className="mt-6 rounded-[1.5rem] bg-primary/8 p-5">
                      <p className="text-sm font-medium text-foreground">Virtual session link</p>
                      <a
                        href={submittedBooking.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block break-all text-sm text-primary hover:underline"
                      >
                        {submittedBooking.meetLink}
                      </a>
                    </div>
                  ) : (
                    <div className="mt-6 rounded-[1.5rem] bg-primary/8 p-5">
                      <p className="text-sm font-medium text-foreground">Session location</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{submittedBooking.locationSummary}</p>
                    </div>
                  )}

                  <div className="mt-6 rounded-[1.5rem] border border-border/60 bg-background px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Private manage link</p>
                    <p className="mt-2 break-all text-sm text-muted-foreground">{submittedBooking.manageUrl}</p>
                  </div>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Button variant="hero" className="w-full rounded-full sm:w-auto" asChild>
                      <Link to={`/manage/${submittedBooking.token}`}>Manage This Session</Link>
                    </Button>
                    <Button type="button" variant="heroBorder" className="w-full rounded-full sm:w-auto" onClick={copyManageLink}>
                      <Copy className="h-4 w-4" />
                      Copy Link
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
                        required
                      />
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
                      <option value={therapist.id}>{therapist.name} - {therapist.title}</option>
                    </select>
                  </div>

                  <div className="mt-6">
                    <Label className="block">Session Type (select preferred choice)</Label>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      {sessionCards.map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setSessionType(item.type)}
                          className={`rounded-[1.5rem] border p-5 text-center transition-all sm:text-left ${
                            sessionType === item.type
                              ? "border-primary bg-primary/8 shadow-card"
                              : "border-border/60 hover:border-primary/40 hover:bg-primary/5"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                                sessionType === item.type ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              <item.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-heading text-xl font-semibold text-foreground">{item.title}</p>
                              <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
                            </div>
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
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
