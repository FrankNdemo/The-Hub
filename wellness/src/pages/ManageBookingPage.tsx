import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Clock3, ExternalLink, MapPin, RefreshCw, ShieldCheck, Trash2, Users, Video } from "lucide-react";
import { toast } from "sonner";

import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { getApiErrorMessage, getSuggestedBookingSlot } from "@/lib/api";
import { softPageBackgroundStyle } from "@/lib/pageBackground";
import {
  BOOKING_AVAILABILITY_DETAIL,
  BOOKING_LAST_START_TIME,
  BOOKING_OPEN_TIME,
  BOOKING_TIME_STEP_SECONDS,
  formatDisplayDate,
  formatDisplayTime,
  formatServiceType,
  getTodayDateInputValue,
} from "@/lib/wellness";
import type { BookingRecord } from "@/types/wellness";

const ManageBookingPage = () => {
  const { token } = useParams();
  const { getBookingByToken, rescheduleBooking, cancelBooking } = useWellnessHub();
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [accessEmail, setAccessEmail] = useState("");
  const [accessError, setAccessError] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [bookingGuidance, setBookingGuidance] = useState("");
  const todayDate = getTodayDateInputValue();

  useEffect(() => {
    setBooking(null);
    setDate("");
    setTime("");
    setAccessEmail("");
    setAccessError("");
    setBookingGuidance("");
    setIsLoading(false);
  }, [token]);

  const statusLabel = useMemo(() => {
    if (!booking) {
      return "";
    }

    return booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
  }, [booking]);

  const handleVerifyAccess = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    const email = accessEmail.trim();

    if (!email) {
      setAccessError("Enter the email address you used when booking this session.");
      return;
    }

    setIsLoading(true);
    setAccessError("");

    try {
      const nextBooking = await getBookingByToken(token, email);

      if (!nextBooking) {
        setAccessError("This private link could not be matched to a booking.");
        return;
      }

      setBooking(nextBooking);
      setDate(nextBooking.date);
      setTime(nextBooking.time);
      setAccessEmail(email);
    } catch (error) {
      const message = getApiErrorMessage(error, "We could not verify this booking right now.");
      setAccessError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={softPageBackgroundStyle}>
        <section className="pt-32 pb-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-[2rem] border border-border/60 bg-card p-10 text-center shadow-card">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Session Manager</p>
              <h1 className="mt-4 font-heading text-4xl font-semibold text-foreground">Loading your booking</h1>
              <p className="mt-4 text-muted-foreground leading-8">
                We&apos;re pulling your session details from the secure booking link now.
              </p>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen" style={softPageBackgroundStyle}>
        <section className="pt-32 pb-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-[2rem] border border-border/60 bg-card p-10 text-center shadow-card">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Session Manager</p>
              <h1 className="mt-4 font-heading text-4xl font-semibold text-foreground">Booking not found</h1>
              <p className="mt-4 text-muted-foreground leading-8">
                The manage link may be incomplete or no longer available. You can always return to the booking page and
                create a new session request.
              </p>
              <Button variant="hero" className="mt-8 rounded-full" asChild>
                <Link to="/booking">Back to Booking</Link>
              </Button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen" style={softPageBackgroundStyle}>
        <section className="pt-32 pb-24">
          <div className="container mx-auto px-4">
            <form
              onSubmit={handleVerifyAccess}
              className="mx-auto max-w-2xl rounded-[2rem] border border-border/60 bg-card p-8 text-center shadow-card sm:p-10"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Secure Session Access</p>
              <h1 className="mt-4 font-heading text-4xl font-semibold text-foreground">Confirm your booking email</h1>
              <p className="mt-4 text-muted-foreground leading-8">
                For privacy, session details only open after the booking email matches this private link.
              </p>
              <div className="mx-auto mt-7 max-w-md text-left">
                <Label htmlFor="manage-access-email">Booking email</Label>
                <Input
                  id="manage-access-email"
                  type="email"
                  value={accessEmail}
                  onChange={(event) => {
                    setAccessError("");
                    setAccessEmail(event.target.value);
                  }}
                  className="mt-2"
                  placeholder="you@example.com"
                  required
                />
                {accessError ? (
                  <p className="mt-3 rounded-[1rem] bg-destructive/10 px-4 py-3 text-sm leading-6 text-foreground">
                    {accessError}
                  </p>
                ) : null}
              </div>
              <Button variant="hero" className="mt-7 rounded-full" type="submit">
                Open My Session
              </Button>
            </form>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const handleReschedule = async () => {
    setIsUpdating(true);

    try {
      const updated = await rescheduleBooking({ token: booking.token, clientEmail: accessEmail, date, time });
      setBooking(updated);
      setDate(updated.date);
      setTime(updated.time);
      setBookingGuidance("");
      toast.success("Your session has been rescheduled.");
    } catch (error) {
      const message = getApiErrorMessage(error, "We could not update this session.");
      const suggestion = getSuggestedBookingSlot(error);

      if (suggestion) {
        setDate(suggestion.date);
        setTime(suggestion.time);
        setBookingGuidance(`${message} We prefilled the next available option for you.`);
        toast.error(`${message} We prefilled ${formatDisplayDate(suggestion.date)} at ${formatDisplayTime(suggestion.time)}.`);
      } else {
        setBookingGuidance(message);
        toast.error(message);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    setIsUpdating(true);

    try {
      const cancelled = await cancelBooking(booking.token, accessEmail);
      setBooking(cancelled);
      toast.success(booking.isExplorationCall ? "Your request has been cancelled." : "Your session has been cancelled.");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, booking.isExplorationCall ? "This request could not be cancelled." : "This session could not be cancelled."),
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen" style={softPageBackgroundStyle}>
      <section className="pt-28 pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="wellness-section-surface rounded-[2.5rem] border border-border/60 px-6 py-8 shadow-card sm:px-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Private Session Link</p>
              <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h1 className="font-heading text-4xl font-semibold text-foreground md:text-5xl">
                    {booking.isExplorationCall ? "Reschedule or cancel your request" : "Reschedule or cancel your session"}
                  </h1>
                  <p className="mt-4 max-w-2xl text-muted-foreground leading-8">
                    “You showed up for yourself—that matters.”
                  </p>
                </div>
                <div className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  Status: {statusLabel}
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
              <ScrollReveal direction="left">
              <div className="rounded-[2rem] border border-border/60 bg-card p-7 shadow-card">
                <h2 className="font-heading text-3xl font-semibold text-foreground">
                  {booking.isExplorationCall ? "Request details" : "Booking details"}
                </h2>
                <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Client</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{booking.clientName}</p>
                  </div>
                  <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Therapist</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{booking.therapistName}</p>
                  </div>
                  <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5">
                    <div className="flex items-center gap-2 text-primary">
                      <CalendarDays className="h-4 w-4" />
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Date</p>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-foreground">{formatDisplayDate(booking.date)}</p>
                  </div>
                  <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5">
                    <div className="flex items-center gap-2 text-primary">
                      <Clock3 className="h-4 w-4" />
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Time</p>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-foreground">{formatDisplayTime(booking.time)}</p>
                  </div>
                  <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5">
                    <div className="flex items-center gap-2 text-primary">
                      <Users className="h-4 w-4" />
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">
                        {booking.isExplorationCall ? "Request Type" : "Service Type"}
                      </p>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {booking.isExplorationCall ? "Exploration Call" : formatServiceType(booking.serviceType)}
                    </p>
                  </div>
                  <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5">
                    {booking.isExplorationCall ? (
                      <>
                        <div className="flex items-center gap-2 text-primary">
                          <ShieldCheck className="h-4 w-4" />
                          <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Follow-up</p>
                        </div>
                        <p className="mt-2 text-lg font-semibold text-foreground">Therapist reaches out directly</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-primary">
                          {booking.sessionType === "virtual" ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                          <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Session Type</p>
                        </div>
                        <p className="mt-2 text-lg font-semibold capitalize text-foreground">{booking.sessionType}</p>
                      </>
                    )}
                  </div>
                  {booking.serviceType === "corporate" && booking.participantCount ? (
                    <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Participants</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{booking.participantCount.toLocaleString()}</p>
                    </div>
                  ) : null}
                  <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-primary/70">
                      {booking.isExplorationCall
                        ? "Next Step"
                        : booking.sessionType === "virtual"
                          ? "Virtual Session Link"
                          : "Session Details"}
                    </p>
                    {!booking.isExplorationCall && booking.sessionType === "virtual" && booking.joinUrl ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {booking.addToCalendarUrl ? (
                          <a
                            href={booking.addToCalendarUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-primary/25 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary/45 hover:bg-primary/8"
                          >
                            Add to calendar
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                        <a
                          href={booking.joinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          Open virtual session
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <p className="w-full text-xs leading-6 text-muted-foreground">
                          This is the same private session link sent by email and saved in the calendar event.
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {booking.isExplorationCall
                          ? booking.locationSummary
                          : booking.sessionType === "virtual"
                          ? "Virtual session access will be included in your updated confirmation."
                          : booking.locationSummary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8 rounded-[1.5rem] bg-secondary/45 p-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {booking.isExplorationCall
                        ? "Changes made here will be sent by email, and the therapist will see the updated request details."
                        : "Changes made here will be sent by email with your updated schedule and session details."}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="font-heading text-2xl font-semibold text-foreground">Session activity</h3>
                  <div className="mt-5 space-y-4">
                    {booking.history.map((event) => (
                      <div key={event.id} className="rounded-[1.5rem] border border-border/60 bg-background/90 p-5">
                        <p className="font-medium text-foreground">{event.title}</p>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">{event.description}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-primary/65">
                          {new Date(event.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              </ScrollReveal>

              <ScrollReveal direction="right">
              <div className="rounded-[2rem] border border-border/60 bg-card p-7 shadow-card">
                <h2 className="font-heading text-3xl font-semibold text-foreground">
                  {booking.isExplorationCall ? "Manage this request" : "Manage this booking"}
                </h2>
                <p className="mt-3 text-muted-foreground leading-8">
                  {booking.isExplorationCall
                    ? "Need to make a change? Update your preferred date and time below or cancel the request entirely."
                    : "Need to make a change? Choose a new slot below or cancel the session entirely."}
                </p>

                {booking.status === "cancelled" ? (
                  <div className="mt-8 rounded-[1.75rem] bg-destructive/10 p-6">
                    <p className="text-lg font-semibold text-foreground">This booking has already been cancelled.</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      If you still need support, you can create a new booking at any time.
                    </p>
                    <Button variant="hero" className="mt-5 rounded-full" asChild>
                      <Link to="/booking">Book a New Session</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="mt-8 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="reschedule-date">New date</Label>
                        <Input
                          id="reschedule-date"
                          type="date"
                          value={date}
                          onChange={(event) => {
                            setBookingGuidance("");
                            setDate(event.target.value);
                          }}
                          className="mt-2"
                          min={todayDate}
                        />
                      </div>
                      <div>
                        <Label htmlFor="reschedule-time">New time</Label>
                        <Input
                          id="reschedule-time"
                          type="time"
                          value={time}
                          onChange={(event) => {
                            setBookingGuidance("");
                            setTime(event.target.value);
                          }}
                          className="mt-2"
                          min={BOOKING_OPEN_TIME}
                          max={BOOKING_LAST_START_TIME}
                          step={BOOKING_TIME_STEP_SECONDS}
                        />
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] bg-primary/8 p-5">
                      <p className="text-sm leading-7 text-muted-foreground">
                        {booking.isExplorationCall
                          ? "This preferred date and time helps the therapist plan the follow-up. Once updated, the therapist will use the refreshed request details when reaching out."
                          : `${BOOKING_AVAILABILITY_DETAIL} Virtual sessions receive a refreshed calendar-ready access link when rescheduled, while physical sessions keep the same centre location and updated calendar reference.`}
                      </p>
                    </div>

                    {bookingGuidance ? (
                      <div className="rounded-[1.5rem] border border-primary/20 bg-primary/8 p-5">
                        <p className="text-sm leading-7 text-foreground">{bookingGuidance}</p>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                      <Button variant="hero" className="rounded-full" type="button" onClick={handleReschedule} disabled={isUpdating}>
                        <RefreshCw className="h-4 w-4" />
                        {isUpdating ? "Updating..." : booking.isExplorationCall ? "Update Request Time" : "Reschedule Session"}
                      </Button>
                      <Button variant="heroBorder" className="rounded-full" type="button" onClick={handleCancel} disabled={isUpdating}>
                        <Trash2 className="h-4 w-4" />
                        {booking.isExplorationCall ? "Cancel Request" : "Cancel Session"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ManageBookingPage;
