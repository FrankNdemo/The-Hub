import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Clock3, MapPin, RefreshCw, ShieldCheck, Trash2, Users, Video } from "lucide-react";
import { toast } from "sonner";

import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { getApiErrorMessage } from "@/lib/api";
import { softPageBackgroundStyle } from "@/lib/pageBackground";
import { formatDisplayDate, formatDisplayTime, formatServiceType } from "@/lib/wellness";
import type { BookingRecord } from "@/types/wellness";

const ManageBookingPage = () => {
  const { token } = useParams();
  const { getBookingByToken, rescheduleBooking, cancelBooking } = useWellnessHub();
  const [booking, setBooking] = useState<BookingRecord | null | undefined>(undefined);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadBooking = async () => {
      if (!token) {
        if (isActive) {
          setBooking(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const nextBooking = await getBookingByToken(token);

        if (!isActive) {
          return;
        }

        setBooking(nextBooking);
        setDate(nextBooking?.date ?? "");
        setTime(nextBooking?.time ?? "");
      } catch (error) {
        if (isActive) {
          setBooking(null);
          toast.error(getApiErrorMessage(error, "We could not load this booking right now."));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadBooking();

    return () => {
      isActive = false;
    };
  }, [token]);

  const statusLabel = useMemo(() => {
    if (!booking) {
      return "";
    }

    return booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
  }, [booking]);

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

  if (!booking) {
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

  const handleReschedule = async () => {
    setIsUpdating(true);

    try {
      const updated = await rescheduleBooking({ token: booking.token, date, time });
      setBooking(updated);
      setDate(updated.date);
      setTime(updated.time);
      toast.success("Your session has been rescheduled.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "We could not update this session."));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    setIsUpdating(true);

    try {
      const cancelled = await cancelBooking(booking.token);
      setBooking(cancelled);
      toast.success("Your session has been cancelled.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "This session could not be cancelled."));
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
                    Reschedule or cancel your session
                  </h1>
                  <p className="mt-4 max-w-2xl text-muted-foreground leading-8">
                    Your booking details are loaded automatically from your private link. No login is required.
                  </p>
                </div>
                <div className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  Status: {statusLabel}
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[2rem] border border-border/60 bg-card p-7 shadow-card">
                <h2 className="font-heading text-3xl font-semibold text-foreground">Booking details</h2>
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
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Service Type</p>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-foreground">{formatServiceType(booking.serviceType)}</p>
                  </div>
                  <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5">
                    <div className="flex items-center gap-2 text-primary">
                      {booking.sessionType === "virtual" ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Session Type</p>
                    </div>
                    <p className="mt-2 text-lg font-semibold capitalize text-foreground">{booking.sessionType}</p>
                  </div>
                  {booking.serviceType === "corporate" && booking.participantCount ? (
                    <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Participants</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{booking.participantCount.toLocaleString()}</p>
                    </div>
                  ) : null}
                  <div className="wellness-panel rounded-[1.5rem] border border-border/60 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Session Details</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {booking.sessionType === "virtual" ? booking.meetLink : booking.locationSummary}
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-[1.5rem] bg-secondary/45 p-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Changes made here also update the therapist dashboard and confirmation package.
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

              <div className="rounded-[2rem] border border-border/60 bg-card p-7 shadow-card">
                <h2 className="font-heading text-3xl font-semibold text-foreground">Manage this booking</h2>
                <p className="mt-3 text-muted-foreground leading-8">
                  Need to make a change? Choose a new slot below or cancel the session entirely.
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
                          onChange={(event) => setDate(event.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reschedule-time">New time</Label>
                        <Input
                          id="reschedule-time"
                          type="time"
                          value={time}
                          onChange={(event) => setTime(event.target.value)}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] bg-primary/8 p-5">
                      <p className="text-sm leading-7 text-muted-foreground">
                        Virtual sessions receive a fresh meeting link when rescheduled. Physical sessions keep the same
                        centre location and updated calendar reference.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button variant="hero" className="rounded-full" type="button" onClick={handleReschedule} disabled={isUpdating}>
                        <RefreshCw className="h-4 w-4" />
                        {isUpdating ? "Updating..." : "Reschedule Session"}
                      </Button>
                      <Button variant="heroBorder" className="rounded-full" type="button" onClick={handleCancel} disabled={isUpdating}>
                        <Trash2 className="h-4 w-4" />
                        Cancel Session
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ManageBookingPage;
