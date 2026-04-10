import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AlertCircle, CalendarDays, Clock3, ExternalLink, MapPin, ShieldCheck, Video } from "lucide-react";
import { toast } from "sonner";

import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { primaryTherapist } from "@/data/siteData";
import { ApiError, fetchTherapistSessionBooking, getApiErrorMessage } from "@/lib/api";
import { softPageBackgroundStyle } from "@/lib/pageBackground";
import { formatDisplayDate, formatDisplayTime, formatServiceType } from "@/lib/wellness";
import type { BookingJoinRecord } from "@/types/wellness";

const sessionImage = primaryTherapist.image;

const TherapistSessionPage = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get("access") ?? "";
  const [booking, setBooking] = useState<BookingJoinRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadSession = async () => {
      if (!token || !accessToken) {
        setBooking(null);
        setErrorMessage("This therapist session link is incomplete.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextBooking = await fetchTherapistSessionBooking(token, accessToken);
        if (!isActive) {
          return;
        }

        setBooking(nextBooking);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const message =
          error instanceof ApiError && error.status === 404
            ? "This therapist session link could not be found."
            : getApiErrorMessage(error, "This therapist session link could not be opened right now.");
        setBooking(null);
        setErrorMessage(message);
        toast.error(message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      isActive = false;
    };
  }, [accessToken, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={softPageBackgroundStyle}>
        <section className="pt-32 pb-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-lg border border-border/60 bg-card p-8 text-center shadow-card">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">
                Therapist Session
              </p>
              <h1 className="mt-4 font-heading text-4xl font-semibold text-foreground">Opening session access</h1>
              <p className="mt-4 text-muted-foreground leading-8">Your therapist session link is being checked now.</p>
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
            <div className="mx-auto max-w-2xl rounded-lg border border-border/60 bg-card p-8 text-center shadow-card">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">
                Therapist Session
              </p>
              <h1 className="mt-4 font-heading text-4xl font-semibold text-foreground">Session link unavailable</h1>
              <p className="mt-4 text-muted-foreground leading-8">
                {errorMessage || "This therapist session link is no longer available."}
              </p>
              <Button variant="hero" className="mt-8 rounded-md" asChild>
                <Link to="/therapist/portal">Open Therapist Portal</Link>
              </Button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const isVirtual = booking.sessionType === "virtual";
  const canOpenRoom = isVirtual && Boolean(booking.meetLink);

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
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">
                    Therapist Session Access
                  </p>
                  <h1 className="mt-3 font-heading text-4xl font-semibold text-foreground md:text-5xl">
                    Your session is live—ready when you are.
                  </h1>
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
                {isVirtual ? (
                  <>
                    <p className="font-semibold text-foreground">Therapist room access</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      Use the room link when it is time for the session. The client still confirms the booking email on
                      their own private link.
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
                {canOpenRoom ? (
                  <Button variant="heroBorder" className="rounded-md" asChild>
                    <a href={booking.meetLink} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open Session Room
                    </a>
                  </Button>
                ) : null}
                <Button variant="heroBorder" className="rounded-md" asChild>
                  <Link to="/therapist/portal">
                    <ShieldCheck className="h-4 w-4" />
                    Therapist Portal
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default TherapistSessionPage;
