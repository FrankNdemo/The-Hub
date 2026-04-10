import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, CalendarDays, Clock3, ExternalLink, Mail, MapPin, ShieldCheck, Video } from "lucide-react";
import { toast } from "sonner";

import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { primaryTherapist } from "@/data/siteData";
import { ApiError, getApiErrorMessage, verifyJoinBooking } from "@/lib/api";
import { softPageBackgroundStyle } from "@/lib/pageBackground";
import { formatDisplayDate, formatDisplayTime, formatServiceType } from "@/lib/wellness";
import type { BookingJoinRecord } from "@/types/wellness";

const sessionImage = primaryTherapist.image;

const JoinSessionPage = () => {
  const { token } = useParams();
  const [booking, setBooking] = useState<BookingJoinRecord | null | undefined>(undefined);
  const [accessEmail, setAccessEmail] = useState("");
  const [accessError, setAccessError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setBooking(undefined);
    setAccessEmail("");
    setAccessError("");
    setIsVerifying(false);
  }, [token]);

  const canJoinSession = Boolean(booking?.canJoinSession && booking.meetLink);

  const handleVerifyAccess = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    const email = accessEmail.trim();

    if (!email) {
      setAccessError("Enter the email connected to this session.");
      return;
    }

    setIsVerifying(true);
    setAccessError("");

    try {
      setBooking(await verifyJoinBooking(token, email));
      setAccessEmail(email);
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 404
          ? "This private session link could not be found."
          : getApiErrorMessage(error, "We could not verify this session link right now.");
      setBooking(null);
      setAccessError(message);
      toast.error(message);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen" style={softPageBackgroundStyle}>
        <section className="pt-32 pb-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-lg border border-border/60 bg-card p-8 text-center shadow-card">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Session Link</p>
              <h1 className="mt-4 font-heading text-4xl font-semibold text-foreground">Session not found</h1>
              <p className="mt-4 text-muted-foreground leading-8">
                This private link may be incomplete or no longer available.
              </p>
              <Button variant="hero" className="mt-8 rounded-md" asChild>
                <Link to="/booking">Book a New Session</Link>
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
              className="mx-auto max-w-2xl rounded-lg border border-border/60 bg-card p-8 text-center shadow-card"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Session Link</p>
              <h1 className="mt-4 font-heading text-4xl font-semibold text-foreground">Confirm your session email</h1>
              <p className="mt-4 text-muted-foreground leading-8">
                Enter the client email or therapist email connected to this booking. The session room stays private and
                opens only on the session day.
              </p>
              <div className="mx-auto mt-7 max-w-md text-left">
                <Label htmlFor="join-access-email">Session email</Label>
                <Input
                  id="join-access-email"
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
                  <p className="mt-3 rounded-md bg-destructive/10 px-4 py-3 text-sm leading-6 text-foreground">
                    {accessError}
                  </p>
                ) : null}
              </div>
              <Button variant="hero" className="mt-8 rounded-md" type="submit" disabled={isVerifying}>
                {isVerifying ? "Checking..." : "Continue"}
              </Button>
            </form>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const isCancelled = booking.status === "cancelled";
  const isCompleted = booking.status === "completed";
  const isVirtual = booking.sessionType === "virtual";

  return (
    <div className="min-h-screen" style={softPageBackgroundStyle}>
      <section className="pt-28 pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-card">
              <img src={sessionImage} alt="" aria-hidden="true" className="h-72 w-full object-cover object-top lg:h-[34rem]" />
            </div>

            <div className="rounded-lg border border-border/60 bg-card p-6 shadow-card sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {isVirtual ? <Video className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Private Session Link</p>
                  <h1 className="mt-3 font-heading text-4xl font-semibold text-foreground md:text-5xl">
                    {canJoinSession ? "Your session room is ready" : "Your session is scheduled"}
                  </h1>
                  <p className="mt-4 text-muted-foreground leading-8">
                    Add this appointment to your calendar and keep the confirmation email close. The room will be
                    available on the session day, and you will receive email updates before it starts.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-background p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <CalendarDays className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">Date</p>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-foreground">{formatDisplayDate(booking.date)}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock3 className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">Time</p>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-foreground">{formatDisplayTime(booking.time)}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Therapist</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{booking.therapistName}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Service</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{formatServiceType(booking.serviceType)}</p>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-primary/8 p-5">
                {isCancelled ? (
                  <>
                    <p className="font-semibold text-foreground">This session has been cancelled.</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      The meeting room is no longer available for this booking.
                    </p>
                  </>
                ) : isCompleted ? (
                  <>
                    <p className="font-semibold text-foreground">This session is marked complete.</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      Please book a new appointment if you need another session.
                    </p>
                  </>
                ) : canJoinSession ? (
                  <>
                    <p className="font-semibold text-foreground">It is session day.</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      The private room is available now. Open it when you are ready to begin.
                    </p>
                  </>
                ) : isVirtual ? (
                  <>
                    <p className="font-semibold text-foreground">The room opens on the session day.</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      Until {formatDisplayDate(booking.date)}, save the calendar event and check your email for the
                      confirmation package. The session room will be available on the session day, so no need to worry.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-foreground">In-person session location</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{booking.locationSummary}</p>
                  </>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {booking.addToCalendarUrl ? (
                  <Button variant="hero" className="rounded-md" asChild>
                    <a href={booking.addToCalendarUrl} target="_blank" rel="noreferrer">
                      <CalendarDays className="h-4 w-4" />
                      Add to Google Calendar
                    </a>
                  </Button>
                ) : null}
                {canJoinSession ? (
                  <Button variant="heroBorder" className="rounded-md" asChild>
                    <a href={booking.meetLink} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Join Session Room
                    </a>
                  </Button>
                ) : null}
                <Button variant="heroBorder" className="rounded-md" asChild>
                  <Link to={`/manage/${booking.token}`}>
                    <ShieldCheck className="h-4 w-4" />
                    Manage Session
                  </Link>
                </Button>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-lg border border-primary/15 bg-background p-4 text-sm leading-7 text-muted-foreground">
                <Mail className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>
                  Please check your email for the confirmation package. It includes the same session link and a calendar
                  invite that can be saved directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default JoinSessionPage;
