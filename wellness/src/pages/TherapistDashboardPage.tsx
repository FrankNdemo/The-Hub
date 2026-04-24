import { Fragment, type MouseEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  BellRing,
  CalendarCheck2,
  ChevronDown,
  ExternalLink,
  FilePenLine,
  LayoutDashboard,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import Footer from "@/components/Footer";
import RichTextEditor from "@/components/RichTextEditor";
import TherapistSecurityPanel from "@/components/TherapistSecurityPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWellnessHub } from "@/context/WellnessHubContext";
import { getApiErrorMessage, uploadTherapistProfileImageRequest } from "@/lib/api";
import { softPageBackgroundStyle } from "@/lib/pageBackground";
import { formatDisplayDate, formatDisplayTime, formatServiceType, stripHtml } from "@/lib/wellness";
import type { BlogPostDraft, BookingRecord, BookingStatus, TherapistProfile } from "@/types/wellness";

interface TherapistProfileFormState {
  name: string;
  title: string;
  bio: string;
  qualifications: string;
  approach: string;
  experience: string;
  focusAreas: string;
  specialties: string;
  email: string;
  phone: string;
  location: string;
  image: string;
}

const DASHBOARD_TABS = [
  "overview",
  "sessions",
  "calls",
  "blog",
  "notifications",
  "completed",
  "profile",
  "security",
] as const;

type DashboardTab = (typeof DASHBOARD_TABS)[number];

const normalizeDashboardTab = (value: string | null): DashboardTab =>
  DASHBOARD_TABS.includes(value as DashboardTab) ? (value as DashboardTab) : "overview";

const makeEmptyDraft = (author: string): BlogPostDraft => ({
  title: "",
  category: "",
  author,
  excerpt: "",
  featuredImage: "",
  contentHtml: "<p></p>",
  tags: [],
});

const makeProfileDraft = (therapist: TherapistProfile): TherapistProfileFormState => ({
  name: therapist.name,
  title: therapist.title,
  bio: therapist.bio,
  qualifications: therapist.qualifications,
  approach: therapist.approach,
  experience: therapist.experience,
  focusAreas: therapist.focusAreas,
  specialties: therapist.specialties.join(", "),
  email: therapist.email,
  phone: therapist.phone,
  location: therapist.location.join("\n"),
  image: therapist.image,
});

const parseCommaSeparated = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parseLineSeparated = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const therapistDashboardHeroImage =
  "https://images.pexels.com/photos/36729384/pexels-photo-36729384.jpeg?auto=compress&cs=tinysrgb&w=1800&h=980&fit=crop";

const uploadTherapistProfileImage = async (imageDataUrl: string): Promise<{ image: string }> => {
  try {
    return await uploadTherapistProfileImageRequest(imageDataUrl);
  } catch (error) {
    throw new Error("Failed to upload profile image: " + (error instanceof Error ? error.message : "Unknown error"));
  }
};

const optimizeProfileImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unable to process the selected image."));
        return;
      }

      const source = reader.result;
      const image = new window.Image();

      image.onerror = () => resolve(source);
      image.onload = () => {
        const longestSide = Math.max(image.width, image.height);
        const scale = longestSide > 1200 ? 1200 / longestSide : 1;
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          resolve(source);
          return;
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };

      image.src = source;
    };

    reader.readAsDataURL(file);
  });

const getStatusBadgeClassName = (status: BookingStatus | "expired") => {
  switch (status) {
    case "upcoming":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "completed":
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case "expired":
      return "bg-stone-100 text-stone-800 border border-stone-200";
    case "cancelled":
      return "bg-rose-100 text-rose-800 border border-rose-200";
    case "rescheduled":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    default:
      return "bg-primary/10 text-primary border border-primary/15";
  }
};

const getTherapistSessionLink = (booking: BookingRecord) => booking.therapistSessionUrl || booking.meetLink || "";

const BOOKING_SESSION_DURATION_MINUTES = 60;

const getBookingEndTimestamp = (booking: BookingRecord) => {
  const start = new Date(`${booking.date}T${booking.time}`);

  if (Number.isNaN(start.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return start.getTime() + BOOKING_SESSION_DURATION_MINUTES * 60 * 1000;
};

const isExpiredBooking = (booking: BookingRecord, now = Date.now()) =>
  booking.status !== "completed" && booking.status !== "cancelled" && getBookingEndTimestamp(booking) < now;

const isCompletedOrExpiredBooking = (booking: BookingRecord, now = Date.now()) =>
  booking.status === "completed" || isExpiredBooking(booking, now);

const getBookingStatusLabel = (booking: BookingRecord, now = Date.now()): BookingStatus | "expired" =>
  isExpiredBooking(booking, now) ? "expired" : booking.status;

const getCallRequestStatusLabel = (booking: BookingRecord) => {
  switch (booking.status) {
    case "upcoming":
      return "requested";
    case "rescheduled":
      return "updated";
    case "completed":
      return "closed";
    default:
      return booking.status;
  }
};

const hasBookingDashboardLinks = (booking: BookingRecord) =>
  !booking.isExplorationCall &&
  Boolean(
    booking.therapistAddToCalendarUrl ||
      booking.manageUrl ||
      (booking.sessionType === "virtual" && getTherapistSessionLink(booking)),
  );

interface BookingDashboardLinksProps {
  booking: BookingRecord;
  compact?: boolean;
  stopPropagation?: boolean;
}

const BookingDashboardLinks = ({ booking, compact = false, stopPropagation = false }: BookingDashboardLinksProps) => {
  if (booking.isExplorationCall) {
    return null;
  }

  const therapistSessionLink = getTherapistSessionLink(booking);
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
  };
  const linkClassName = compact
    ? "inline-flex items-center gap-1 text-xs font-semibold text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
    : "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/25 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto";

  return (
    <div className={compact ? "flex flex-wrap items-center gap-x-3 gap-y-2" : "mt-4 space-y-3"}>
      {!compact ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Session Links</p>
      ) : null}
      <div className={compact ? "contents" : "flex flex-col gap-2 sm:flex-row sm:flex-wrap"}>
        {booking.therapistAddToCalendarUrl ? (
          <a
            href={booking.therapistAddToCalendarUrl}
            target="_blank"
            rel="noreferrer"
            onClick={handleClick}
            className={linkClassName}
          >
            Add to calendar
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
        {booking.sessionType === "virtual" && therapistSessionLink ? (
          <a
            href={therapistSessionLink}
            target="_blank"
            rel="noreferrer"
            onClick={handleClick}
            className={linkClassName}
          >
            Open therapist session
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
        {booking.manageUrl ? (
          <a
            href={booking.manageUrl}
            target="_blank"
            rel="noreferrer"
            onClick={handleClick}
            className={linkClassName}
          >
            Client manage page
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
    </div>
  );
};

const TherapistDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    blogPosts,
    bookings,
    notifications,
    therapist,
    therapistSession,
    isInitializing,
    isTherapistAuthenticated,
    markBookingCompleted,
    deleteBooking,
    saveBlogPost,
    deleteBlogPost,
    dismissNotification,
    markNotificationsRead,
    updateTherapistProfile,
  } = useWellnessHub();

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => normalizeDashboardTab(searchParams.get("tab")));
  const [draft, setDraft] = useState<BlogPostDraft>(() => makeEmptyDraft(therapist.name));
  const [tagInput, setTagInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedOverviewBookingId, setExpandedOverviewBookingId] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState<TherapistProfileFormState>(() => makeProfileDraft(therapist));
  const [bookingToComplete, setBookingToComplete] = useState<BookingRecord | null>(null);
  const [isCompletingBooking, setIsCompletingBooking] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<BookingRecord | null>(null);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);

  useEffect(() => {
    setProfileDraft(makeProfileDraft(therapist));
    if (!editingId) {
      setDraft((current) => ({ ...current, author: therapist.name }));
    }
  }, [editingId, therapist]);

  const requestedTab = normalizeDashboardTab(searchParams.get("tab"));

  useEffect(() => {
    setActiveTab((current) => (current === requestedTab ? current : requestedTab));
  }, [requestedTab]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );
  const unreadNotificationCountLabel = unreadNotificationCount > 99 ? "99+" : String(unreadNotificationCount);
  const currentTime = Date.now();
  const sortedBookings = useMemo(
    () => [...bookings].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [bookings],
  );
  const sessionBookings = useMemo(
    () => sortedBookings.filter((booking) => !booking.isExplorationCall),
    [sortedBookings],
  );
  const callRequests = useMemo(
    () => sortedBookings.filter((booking) => booking.isExplorationCall),
    [sortedBookings],
  );
  const activeBookings = useMemo(
    () => sessionBookings.filter((booking) => !isCompletedOrExpiredBooking(booking, currentTime)),
    [sessionBookings, currentTime],
  );
  const completedBookings = useMemo(
    () => sessionBookings.filter((booking) => isCompletedOrExpiredBooking(booking, currentTime)),
    [sessionBookings, currentTime],
  );
  const metrics = useMemo(
    () => ({
      total: sessionBookings.length,
      upcoming: sessionBookings.filter((booking) => !isCompletedOrExpiredBooking(booking, currentTime) && booking.status !== "cancelled").length,
      cancelled: sessionBookings.filter((booking) => booking.status === "cancelled").length,
      rescheduled: sessionBookings.filter((booking) => booking.history.some((event) => event.type === "rescheduled")).length,
    }),
    [sessionBookings, currentTime],
  );

  const setDraftField = (field: keyof BlogPostDraft, value: string | string[]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const setProfileField = (field: keyof TherapistProfileFormState, value: string) => {
    setProfileDraft((current) => ({ ...current, [field]: value }));
  };

  const resetDraft = () => {
    setDraft(makeEmptyDraft(therapist.name));
    setEditingId(null);
    setTagInput("");
  };

  const handleFeatureImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraftField("featuredImage", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const optimizedImage = await optimizeProfileImage(file);
      // Upload the image immediately instead of storing as data URL
      const uploadResult = await uploadTherapistProfileImage(optimizedImage);
      setProfileField("image", uploadResult.image);
      toast.success("Profile image uploaded and ready to save.");
    } catch {
      toast.error("The selected image could not be processed.");
    } finally {
      event.target.value = "";
    }
  };

  const handleSavePost = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const saved = await saveBlogPost({
        ...draft,
        id: editingId ?? undefined,
        tags: tagInput
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      const action = editingId ? "updated" : "published";

      resetDraft();
      toast.success(`"${saved.title}" has been ${action}.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "This blog post could not be saved right now."));
    }
  };

  const handleEditPost = (id: string) => {
    const post = blogPosts.find((entry) => entry.id === id);

    if (!post) {
      return;
    }

    setEditingId(post.id);
    setDraft({
      id: post.id,
      title: post.title,
      category: post.category,
      author: post.author,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      contentHtml: post.contentHtml,
      tags: post.tags,
    });
    setTagInput(post.tags.join(", "));
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextProfile: TherapistProfile = {
      ...therapist,
      name: profileDraft.name.trim(),
      title: profileDraft.title.trim(),
      bio: profileDraft.bio.trim(),
      qualifications: profileDraft.qualifications.trim(),
      approach: profileDraft.approach.trim(),
      experience: profileDraft.experience.trim(),
      focusAreas: profileDraft.focusAreas.trim(),
      specialties: parseCommaSeparated(profileDraft.specialties),
      email: profileDraft.email.trim(),
      phone: profileDraft.phone.trim(),
      location: parseLineSeparated(profileDraft.location),
      image: profileDraft.image || therapist.image,
    };

    if (!nextProfile.name || !nextProfile.title || !nextProfile.email || !nextProfile.phone) {
      toast.error("Please complete the main profile details before saving.");
      return;
    }

    if (!nextProfile.specialties.length || !nextProfile.location.length) {
      toast.error("Please add at least one specialty and one location line.");
      return;
    }

    try {
      await updateTherapistProfile(nextProfile);
      toast.success("Your therapist profile has been updated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Your therapist profile could not be updated right now."));
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await deleteBlogPost(id);
      if (editingId === id) {
        resetDraft();
      }
      toast.success("Blog post deleted.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "This blog post could not be deleted right now."));
    }
  };

  const handleDismissNotification = async (id: string) => {
    try {
      await dismissNotification(id);
      toast.success("Notification removed.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "This notification could not be removed right now."));
    }
  };

  const openCompleteBookingDialog = (booking: BookingRecord) => {
    setBookingToComplete(booking);
  };

  const closeCompleteBookingDialog = () => {
    if (isCompletingBooking) {
      return;
    }

    setBookingToComplete(null);
  };

  const handleMarkCompleted = async () => {
    if (!bookingToComplete) {
      return;
    }

    setIsCompletingBooking(true);

    try {
      await markBookingCompleted(bookingToComplete.id);
      toast.success("Booking marked as completed.");
      setBookingToComplete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "This booking could not be marked as completed."));
    } finally {
      setIsCompletingBooking(false);
    }
  };

  const toggleOverviewBooking = (id: string) => {
    setExpandedOverviewBookingId((current) => (current === id ? null : id));
  };

  const openDeleteBookingDialog = (booking: BookingRecord) => {
    setBookingToDelete(booking);
  };

  const closeDeleteBookingDialog = () => {
    if (isDeletingBooking) {
      return;
    }

    setBookingToDelete(null);
  };

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) {
      return;
    }

    setIsDeletingBooking(true);

    try {
      await deleteBooking(bookingToDelete.id, "Deleted by therapist after confirmation.");
      toast.success("Session removed from the dashboard.");
      setBookingToDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "This session could not be deleted right now."));
    } finally {
      setIsDeletingBooking(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen" style={softPageBackgroundStyle}>
        <section className="pt-32 pb-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-[2rem] border border-border/60 bg-card p-10 text-center shadow-card">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Secure Portal</p>
              <h1 className="mt-4 font-heading text-4xl font-semibold text-foreground">Loading therapist portal</h1>
              <p className="mt-4 text-muted-foreground leading-8">
                We&apos;re checking your session and syncing the latest dashboard data now.
              </p>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (!isTherapistAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={softPageBackgroundStyle}>
      <section className="pb-16 sm:pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-[2rem] border border-border/60 px-5 pb-8 pt-28 shadow-card sm:min-h-[23rem] sm:rounded-[2.5rem] sm:px-8 sm:pb-10 sm:pt-32">
              <img
                src={therapistDashboardHeroImage}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover object-[center_34%] contrast-[1.02] saturate-[1.03]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(42_31%_97%_/_0.2),hsl(42_31%_97%_/_0.06),hsl(42_31%_97%_/_0.24))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(42_31%_99%_/_0.1),transparent_28%),radial-gradient(circle_at_bottom,hsl(136_22%_88%_/_0.08),transparent_42%)]" />
              <div className="relative z-10 mx-auto max-w-4xl rounded-[1.75rem] bg-[hsl(42_31%_97%_/_0.42)] px-4 py-5 text-center shadow-[0_24px_48px_-32px_rgba(35,72,61,0.28)] backdrop-blur-[8px] sm:px-8 sm:py-7">
                <h1 className="mt-4 font-heading text-3xl font-semibold text-foreground [text-shadow:0_4px_18px_rgba(255,255,255,0.22)] sm:text-4xl md:text-5xl">
                  Welcome back, {therapistSession?.name ?? therapist.name}
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-foreground/82 sm:text-base sm:leading-8">
                  “Every conversation you hold has the power to heal.”
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:gap-8 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="min-w-0 space-y-8">
                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
                  {[
                    {
                      label: "Total Sessions Booked",
                      value: metrics.total,
                      icon: LayoutDashboard,
                      note: "All full therapy sessions currently in the system.",
                    },
                    {
                      label: "Upcoming Sessions",
                      value: metrics.upcoming,
                      icon: CalendarCheck2,
                      note: "Confirmed sessions still ahead.",
                    },
                    {
                      label: "Cancelled Sessions",
                      value: metrics.cancelled,
                      icon: Trash2,
                      note: "Appointments cancelled by clients.",
                    },
                    {
                      label: "Rescheduled Sessions",
                      value: metrics.rescheduled,
                      icon: RefreshCw,
                      note: "Bookings that have changed time.",
                    },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="wellness-panel min-h-[9.5rem] rounded-[1.2rem] border border-border/60 bg-card/95 p-3 shadow-card transition-shadow duration-300 hover:shadow-hover sm:min-h-[10rem] sm:rounded-[1.3rem] sm:p-4"
                    >
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="min-w-0">
                          <p className="text-[0.95rem] font-medium leading-snug text-foreground sm:text-[1.05rem]">
                            {card.label}
                          </p>
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-9 sm:w-9 sm:rounded-[1rem]">
                          <card.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:mt-5">
                        <p className="font-heading text-[1.7rem] font-semibold leading-none text-foreground sm:text-[1.85rem]">
                          {card.value}
                        </p>
                        <p className="text-[10px] leading-4 text-muted-foreground sm:text-[11px] sm:leading-5">
                          {card.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                  <Tabs
                  value={activeTab}
                  onValueChange={(value) => {
                    const nextTab = normalizeDashboardTab(value);
                    setActiveTab(nextTab);
                    setSearchParams(nextTab === "overview" ? {} : { tab: nextTab }, { replace: true });
                    if (nextTab === "notifications") {
                      void markNotificationsRead().catch(() => undefined);
                    }
                  }}
                  className="-mx-2 rounded-[1.6rem] border border-border/60 bg-card p-3 shadow-card sm:mx-0 sm:rounded-[2rem] sm:p-6"
                >
                  <TabsList className="no-scrollbar flex h-auto w-full flex-nowrap items-center justify-start gap-2 overflow-x-auto rounded-[1.25rem] bg-secondary/60 p-1.5 whitespace-nowrap">
                    <TabsTrigger value="overview" className="h-auto shrink-0 rounded-full px-3 py-2 text-[11px] sm:px-4 sm:text-sm lg:px-5">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="sessions" className="h-auto shrink-0 rounded-full px-3 py-2 text-[11px] sm:px-4 sm:text-sm lg:px-5">
                      Sessions
                    </TabsTrigger>
                    <TabsTrigger value="calls" className="h-auto shrink-0 rounded-full px-3 py-2 text-[11px] sm:px-4 sm:text-sm lg:px-5">
                      Calls
                    </TabsTrigger>
                    <TabsTrigger value="blog" className="h-auto shrink-0 rounded-full px-3 py-2 text-[11px] sm:px-4 sm:text-sm lg:px-5">
                      <span className="sm:hidden">Blog</span>
                      <span className="hidden sm:inline">Blog Manager</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="notifications"
                      className="h-auto shrink-0 rounded-full px-3 py-2 text-[10px] sm:px-4 sm:text-sm lg:px-5"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="relative inline-flex">
                          <BellRing className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          {unreadNotificationCount > 0 ? (
                            <span className="absolute -right-2 -top-2 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold leading-4 text-primary-foreground sm:min-w-[1.2rem]">
                              {unreadNotificationCountLabel}
                            </span>
                          ) : null}
                        </span>
                        <span className="hidden sm:inline">Notifications</span>
                        <span className="sm:hidden">Alerts</span>
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="h-auto shrink-0 rounded-full px-3 py-2 text-[10px] sm:px-4 sm:text-sm lg:px-5">
                      Completed
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="h-auto shrink-0 rounded-full px-3 py-2 text-[11px] sm:px-4 sm:text-sm lg:px-5">
                      Profile
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="h-auto shrink-0 rounded-full px-3 py-2 text-[10px] sm:px-4 sm:text-sm lg:px-5"
                    >
                      Security
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-8 space-y-5">
                    {activeBookings.slice(0, 3).map((booking) => {
                      const isExpanded = expandedOverviewBookingId === booking.id;
                      const serviceLabel = formatServiceType(booking.serviceType);

                      return (
                        <div
                        key={booking.id}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onClick={() => toggleOverviewBooking(booking.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            toggleOverviewBooking(booking.id);
                          }
                        }}
                        className="group wellness-panel cursor-pointer rounded-[1.5rem] border border-border/60 p-4 transition-all duration-300 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 sm:rounded-[1.75rem] sm:p-6"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:items-center">
                          <div>
                            <p className="font-heading text-xl font-semibold text-foreground sm:text-2xl">{booking.clientName}</p>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:leading-7">
                              {formatDisplayDate(booking.date)} at {formatDisplayTime(booking.time)} ·{" "}
                              {formatServiceType(booking.serviceType)} Â· <span className="capitalize">{booking.sessionType}</span> session
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge
                              variant="secondary"
                              className={`w-fit rounded-full px-3 py-1 capitalize ${getStatusBadgeClassName(booking.status)}`}
                            >
                              {booking.status}
                            </Badge>
                            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary/65">
                              <span>{isExpanded ? "Hide details" : "View details"}</span>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </div>
                          </div>
                        </div>
                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            isExpanded
                              ? "mt-5 max-h-80 opacity-100"
                              : "max-h-0 opacity-0 lg:group-hover:mt-5 lg:group-hover:max-h-80 lg:group-hover:opacity-100"
                          }`}
                        >
                          <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <div className="min-w-0 rounded-2xl bg-secondary/40 px-2 py-3 sm:rounded-[1.25rem] sm:p-4">
                              <div className="flex min-w-0 items-center gap-1.5 text-primary/80 sm:gap-2">
                                <Mail className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                                <p className="truncate text-[0.58rem] font-semibold uppercase leading-4 tracking-[0.08em] sm:text-xs sm:tracking-[0.18em]">
                                  Email
                                </p>
                              </div>
                              <a
                                href={`mailto:${booking.clientEmail}`}
                                title={booking.clientEmail}
                                onClick={(event) => event.stopPropagation()}
                                className="mt-2 block truncate text-[0.68rem] leading-5 text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline sm:text-sm sm:leading-7"
                              >
                                {booking.clientEmail}
                              </a>
                            </div>
                            <div className="min-w-0 rounded-2xl bg-secondary/40 px-2 py-3 sm:rounded-[1.25rem] sm:p-4">
                              <div className="flex min-w-0 items-center gap-1.5 text-primary/80 sm:gap-2">
                                <Phone className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                                <p className="truncate text-[0.58rem] font-semibold uppercase leading-4 tracking-[0.08em] sm:text-xs sm:tracking-[0.18em]">
                                  Phone
                                </p>
                              </div>
                              <a
                                href={`tel:${booking.clientPhone.replace(/\s+/g, "")}`}
                                title={booking.clientPhone}
                                onClick={(event) => event.stopPropagation()}
                                className="mt-2 block truncate text-[0.68rem] leading-5 text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline sm:text-sm sm:leading-7"
                              >
                                {booking.clientPhone}
                              </a>
                            </div>
                            <div className="min-w-0 rounded-2xl bg-secondary/40 px-2 py-3 sm:rounded-[1.25rem] sm:p-4">
                              <p className="truncate text-[0.58rem] font-semibold uppercase leading-4 tracking-[0.08em] text-primary/80 sm:text-xs sm:tracking-[0.18em]">
                                Service Type
                              </p>
                              <p
                                title={serviceLabel}
                                className="mt-2 truncate text-[0.68rem] leading-5 text-foreground sm:text-sm sm:leading-7"
                              >
                                {serviceLabel}
                              </p>
                            </div>
                            {booking.serviceType === "corporate" && booking.participantCount ? (
                              <div className="col-span-3 rounded-2xl bg-secondary/40 px-3 py-3 sm:rounded-[1.25rem] sm:p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Participants</p>
                                <p className="mt-2 text-sm leading-7 text-foreground">{booking.participantCount.toLocaleString()}</p>
                              </div>
                            ) : null}
                          </div>
                          <BookingDashboardLinks booking={booking} stopPropagation />
                        </div>
                        </div>
                      );
                    })}
                    {activeBookings.length === 0 ? (
                      <div className="rounded-[1.75rem] bg-secondary/50 p-6 text-sm text-muted-foreground">
                        No sessions have been booked yet.
                      </div>
                    ) : null}
                  </TabsContent>

                  <TabsContent value="sessions" className="mt-8">
                    <div className="space-y-4 md:hidden">
                      {activeBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="rounded-[1.5rem] border border-border/60 bg-secondary/25 p-4 shadow-card"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{booking.clientName}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-primary/65">
                                {formatServiceType(booking.serviceType)} · {booking.sessionType} session
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`rounded-full px-3 py-1 capitalize ${getStatusBadgeClassName(booking.status)}`}
                            >
                              {booking.status}
                            </Badge>
                          </div>

                          <div className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
                            <p>
                              <span className="font-medium text-foreground">Date:</span> {formatDisplayDate(booking.date)}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">Time:</span> {formatDisplayTime(booking.time)}
                            </p>
                            <p className="break-all">
                              <span className="font-medium text-foreground">Email:</span> {booking.clientEmail}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">Phone:</span> {booking.clientPhone}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">Service:</span> {formatServiceType(booking.serviceType)}
                            </p>
                            {booking.serviceType === "corporate" && booking.participantCount ? (
                              <p>
                                <span className="font-medium text-foreground">Participants:</span>{" "}
                                {booking.participantCount.toLocaleString()}
                              </p>
                            ) : null}
                          </div>

                          <div className="mt-4 flex gap-2">
                            <Button
                              type="button"
                              variant="heroBorder"
                              size="sm"
                              className="w-full rounded-full"
                              onClick={() => openCompleteBookingDialog(booking)}
                              disabled={isCompletedOrExpiredBooking(booking, currentTime) || booking.status === "cancelled"}
                            >
                              Mark Completed
                            </Button>
                            <Button
                              type="button"
                              variant="heroBorder"
                              size="icon"
                              className="h-9 w-9 rounded-full"
                              onClick={() => openDeleteBookingDialog(booking)}
                              aria-label={`Delete ${booking.clientName}'s session`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {hasBookingDashboardLinks(booking) ? (
                            <div className="mt-4 border-t border-border/40 pt-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                                Session Links
                              </p>
                              <BookingDashboardLinks booking={booking} compact />
                            </div>
                          ) : null}
                        </div>
                      ))}
                      {activeBookings.length === 0 ? (
                        <div className="rounded-[1.5rem] bg-secondary/50 p-5 text-sm text-muted-foreground">
                          No bookings to display yet.
                        </div>
                      ) : null}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeBookings.map((booking) => (
                            <Fragment key={booking.id}>
                            <TableRow>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium text-foreground">{booking.clientName}</p>
                                  <p className="text-xs uppercase tracking-[0.18em] text-primary/65">
                                    {formatServiceType(booking.serviceType)} · {booking.sessionType} session
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="text-sm text-foreground">{booking.clientEmail}</p>
                                  <p className="text-xs text-muted-foreground">{booking.clientPhone}</p>
                                </div>
                              </TableCell>
                              <TableCell>{formatDisplayDate(booking.date)}</TableCell>
                              <TableCell>{formatDisplayTime(booking.time)}</TableCell>
                              <TableCell className="capitalize">{booking.sessionType}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className={`rounded-full px-3 py-1 capitalize ${getStatusBadgeClassName(booking.status)}`}
                                >
                                  {booking.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="heroBorder"
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => openCompleteBookingDialog(booking)}
                                    disabled={isCompletedOrExpiredBooking(booking, currentTime) || booking.status === "cancelled"}
                                  >
                                    Mark Completed
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="heroBorder"
                                    size="icon"
                                    className="rounded-full"
                                    onClick={() => openDeleteBookingDialog(booking)}
                                    aria-label={`Delete ${booking.clientName}'s session`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {hasBookingDashboardLinks(booking) ? (
                              <TableRow>
                                <TableCell colSpan={7} className="pt-0">
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/40 pt-3">
                                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                                      Session Links
                                    </span>
                                    <BookingDashboardLinks booking={booking} compact />
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : null}
                            </Fragment>
                          ))}
                          {activeBookings.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground">
                                No bookings to display yet.
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="calls" className="mt-8">
                    <div className="rounded-[1.75rem] border border-border/60 bg-card/80 p-5 shadow-card sm:p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">Exploration Calls</h2>
                          <p className="mt-2 text-sm leading-7 text-muted-foreground">
                            All exploration call requests are recorded here and kept separate from full therapy
                            sessions.
                          </p>
                        </div>
                        <Badge variant="secondary" className="w-fit rounded-full bg-primary/10 px-3 py-1 text-primary">
                          {callRequests.length} {callRequests.length === 1 ? "call request" : "call requests"}
                        </Badge>
                      </div>

                      <div className="mt-6 space-y-4 md:hidden">
                        {callRequests.map((booking) => (
                          <div key={booking.id} className="rounded-[1.5rem] border border-border/60 bg-secondary/25 p-4 shadow-card">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium text-foreground">{booking.clientName}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-primary/65">
                                  Exploration Call
                                </p>
                              </div>
                              <Badge
                                variant="secondary"
                                className={`rounded-full px-3 py-1 capitalize ${getStatusBadgeClassName(booking.status)}`}
                              >
                                {getCallRequestStatusLabel(booking)}
                              </Badge>
                            </div>

                            <div className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
                              <p>
                                <span className="font-medium text-foreground">Preferred date:</span> {formatDisplayDate(booking.date)}
                              </p>
                              <p>
                                <span className="font-medium text-foreground">Preferred time:</span> {formatDisplayTime(booking.time)}
                              </p>
                              <p className="break-all">
                                <span className="font-medium text-foreground">Email:</span> {booking.clientEmail}
                              </p>
                              <p>
                                <span className="font-medium text-foreground">Phone:</span> {booking.clientPhone}
                              </p>
                              {booking.notes ? (
                                <p>
                                  <span className="font-medium text-foreground">Notes:</span> {booking.notes}
                                </p>
                              ) : null}
                              <p>
                                <span className="font-medium text-foreground">Last updated:</span>{" "}
                                {new Date(booking.updatedAt).toLocaleString()}
                              </p>
                            </div>

                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                              <Button variant="heroBorder" className="w-full rounded-full sm:w-auto" asChild>
                                <a href={`tel:${booking.clientPhone}`}>
                                  <Phone className="h-4 w-4" />
                                  Call Client
                                </a>
                              </Button>
                              <Button variant="heroBorder" className="w-full rounded-full sm:w-auto" asChild>
                                <a href={`mailto:${booking.clientEmail}`}>
                                  <Mail className="h-4 w-4" />
                                  Email Client
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                        {callRequests.length === 0 ? (
                          <div className="rounded-[1.5rem] bg-secondary/45 p-4 text-sm text-muted-foreground">
                            Exploration call requests will appear here as soon as clients submit them.
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-6 hidden overflow-x-auto md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Client</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Preferred Date</TableHead>
                              <TableHead>Preferred Time</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Follow Up</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {callRequests.map((booking) => (
                              <Fragment key={booking.id}>
                                <TableRow>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <p className="font-medium text-foreground">{booking.clientName}</p>
                                      <p className="text-xs uppercase tracking-[0.18em] text-primary/65">
                                        Exploration Call
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <p className="text-sm text-foreground">{booking.clientEmail}</p>
                                      <p className="text-xs text-muted-foreground">{booking.clientPhone}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>{formatDisplayDate(booking.date)}</TableCell>
                                  <TableCell>{formatDisplayTime(booking.time)}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="secondary"
                                      className={`rounded-full px-3 py-1 capitalize ${getStatusBadgeClassName(booking.status)}`}
                                    >
                                      {getCallRequestStatusLabel(booking)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button variant="heroBorder" size="sm" className="rounded-full" asChild>
                                        <a href={`tel:${booking.clientPhone}`}>
                                          <Phone className="h-4 w-4" />
                                          Call
                                        </a>
                                      </Button>
                                      <Button variant="heroBorder" size="sm" className="rounded-full" asChild>
                                        <a href={`mailto:${booking.clientEmail}`}>
                                          <Mail className="h-4 w-4" />
                                          Email
                                        </a>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                                {booking.notes ? (
                                  <TableRow>
                                    <TableCell colSpan={6} className="pt-0">
                                      <div className="border-t border-border/40 pt-3 text-sm leading-7 text-muted-foreground">
                                        <span className="font-medium text-foreground">Notes:</span> {booking.notes}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : null}
                              </Fragment>
                            ))}
                            {callRequests.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                  Exploration call requests will appear here as soon as clients submit them.
                                </TableCell>
                              </TableRow>
                            ) : null}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="blog" className="mt-8 space-y-8">
                    <form onSubmit={handleSavePost} className="space-y-5 rounded-[1.75rem] bg-secondary/25 p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="font-heading text-3xl font-semibold text-foreground">
                            {editingId ? "Edit post" : "Create a new post"}
                          </h2>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Publish polished articles with headings, emphasis, images, and rich body content.
                          </p>
                        </div>
                        <Button type="button" variant="heroBorder" className="w-full rounded-full sm:w-auto" onClick={resetDraft}>
                          <Plus className="h-4 w-4" />
                          New Draft
                        </Button>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <Label htmlFor="post-title">Title</Label>
                          <Input
                            id="post-title"
                            value={draft.title}
                            onChange={(event) => setDraftField("title", event.target.value)}
                            className="mt-2"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="post-category">Category</Label>
                          <Input
                            id="post-category"
                            value={draft.category}
                            onChange={(event) => setDraftField("category", event.target.value)}
                            className="mt-2"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <Label htmlFor="post-excerpt">Excerpt</Label>
                          <Input
                            id="post-excerpt"
                            value={draft.excerpt}
                            onChange={(event) => setDraftField("excerpt", event.target.value)}
                            className="mt-2"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="post-tags">Tags</Label>
                          <Input
                            id="post-tags"
                            value={tagInput}
                            onChange={(event) => setTagInput(event.target.value)}
                            className="mt-2"
                            placeholder="Anxiety, self-care, therapy"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="featured-image">Featured image</Label>
                        <Input id="featured-image" type="file" accept="image/*" className="mt-2" onChange={handleFeatureImage} />
                        {draft.featuredImage ? (
                          <img
                            src={draft.featuredImage}
                            alt="Featured blog preview"
                            className="mt-4 h-48 w-full rounded-[1.5rem] object-cover shadow-card"
                          />
                        ) : null}
                      </div>

                      <div>
                        <Label className="mb-2 block">Body content</Label>
                        <RichTextEditor
                          value={draft.contentHtml}
                          onChange={(content) => setDraftField("contentHtml", content)}
                          placeholder="Write the story, add headings, emphasize key ideas, and upload supporting images."
                        />
                      </div>

                      <Button type="submit" variant="hero" className="w-full rounded-full sm:w-auto">
                        <FilePenLine className="h-4 w-4" />
                        {editingId ? "Update Post" : "Publish Post"}
                      </Button>
                    </form>

                    <div className="space-y-4">
                      {blogPosts.map((post) => (
                        <div key={post.id} className="wellness-panel rounded-[1.75rem] border border-border/60 p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex flex-col gap-4 sm:flex-row">
                              <img
                                src={post.featuredImage}
                                alt={post.title}
                                className="hidden h-24 w-24 rounded-[1.25rem] object-cover sm:block"
                              />
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                                    {post.category}
                                  </Badge>
                                  <span className="text-xs uppercase tracking-[0.2em] text-primary/65">
                                    {formatDisplayDate(post.publishDate)}
                                  </span>
                                </div>
                                <h3 className="mt-3 font-heading text-2xl font-semibold text-foreground">{post.title}</h3>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
                                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-primary/65">
                                  {stripHtml(post.contentHtml).slice(0, 120)}...
                                </p>
                              </div>
                            </div>
                            <div className="grid w-full grid-cols-3 gap-2 lg:w-auto">
                              <Button
                                variant="heroBorder"
                                className="h-9 min-w-0 rounded-full px-2 text-[0.7rem] font-medium tracking-[0.01em] sm:h-10 sm:px-3 sm:text-xs md:px-4 md:text-sm"
                                type="button"
                                onClick={() => handleEditPost(post.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="heroBorder"
                                className="h-9 min-w-0 rounded-full px-2 text-[0.7rem] font-medium tracking-[0.01em] sm:h-10 sm:px-3 sm:text-xs md:px-4 md:text-sm"
                                type="button"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                Delete
                              </Button>
                              <Button
                                variant="hero"
                                className="h-9 min-w-0 rounded-full px-2 text-[0.7rem] font-medium tracking-[0.01em] sm:h-10 sm:px-3 sm:text-xs md:px-4 md:text-sm"
                                asChild
                              >
                                <Link to={`/blog/${post.slug}`}>View Live</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="profile" className="mt-8">
                    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                      <div className="wellness-panel rounded-[1.75rem] border border-border/60 p-5 shadow-card sm:p-6">
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">
                          Public profile preview
                        </p>
                        <div className="mt-5 overflow-hidden rounded-[1.75rem] bg-secondary/35">
                          <img
                            src={profileDraft.image || therapist.image}
                            alt={profileDraft.name || therapist.name}
                            className="h-[17rem] w-full object-cover object-top sm:h-[22rem]"
                          />
                        </div>
                        <div className="mt-5">
                          <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
                            {profileDraft.name || therapist.name}
                          </h2>
                          <p className="mt-2 text-base text-primary">{profileDraft.title || therapist.title}</p>
                          <p className="mt-4 text-sm leading-7 text-muted-foreground">
                            Save your changes here and the updated therapist image and details will appear anywhere the
                            public profile is shown across the site.
                          </p>
                        </div>

                        <div className="mt-6">
                          <Label htmlFor="profile-image">Upload a new profile photo</Label>
                          <Input
                            id="profile-image"
                            type="file"
                            accept="image/*"
                            className="mt-2"
                            onChange={handleProfileImage}
                          />
                          <p className="mt-2 text-xs leading-6 text-muted-foreground">
                            Choose a clear portrait-style image. It will be optimized automatically for a smoother site
                            preview and local saving.
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleSaveProfile} className="space-y-5 rounded-[1.75rem] bg-secondary/25 p-4 sm:p-5">
                        <div>
                          <h2 className="font-heading text-3xl font-semibold text-foreground">Update your profile</h2>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Edit the therapist details used on the home page, team page, contact page, booking flow,
                            and therapist overview cards.
                          </p>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <Label htmlFor="profile-name">Full name</Label>
                            <Input
                              id="profile-name"
                              value={profileDraft.name}
                              onChange={(event) => setProfileField("name", event.target.value)}
                              className="mt-2"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="profile-title">Professional title</Label>
                            <Input
                              id="profile-title"
                              value={profileDraft.title}
                              onChange={(event) => setProfileField("title", event.target.value)}
                              className="mt-2"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <Label htmlFor="profile-email">Public email</Label>
                            <Input
                              id="profile-email"
                              type="email"
                              value={profileDraft.email}
                              onChange={(event) => setProfileField("email", event.target.value)}
                              className="mt-2"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="profile-phone">Public phone</Label>
                            <Input
                              id="profile-phone"
                              value={profileDraft.phone}
                              onChange={(event) => setProfileField("phone", event.target.value)}
                              className="mt-2"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="profile-bio">Short bio</Label>
                          <Textarea
                            id="profile-bio"
                            value={profileDraft.bio}
                            onChange={(event) => setProfileField("bio", event.target.value)}
                            className="mt-2 min-h-[120px]"
                            required
                          />
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <Label htmlFor="profile-qualifications">Qualifications</Label>
                            <Textarea
                              id="profile-qualifications"
                              value={profileDraft.qualifications}
                              onChange={(event) => setProfileField("qualifications", event.target.value)}
                              className="mt-2 min-h-[100px]"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="profile-approach">Approach</Label>
                            <Textarea
                              id="profile-approach"
                              value={profileDraft.approach}
                              onChange={(event) => setProfileField("approach", event.target.value)}
                              className="mt-2 min-h-[100px]"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <Label htmlFor="profile-experience">Experience</Label>
                            <Textarea
                              id="profile-experience"
                              value={profileDraft.experience}
                              onChange={(event) => setProfileField("experience", event.target.value)}
                              className="mt-2 min-h-[100px]"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="profile-focus-areas">Focus areas</Label>
                            <Textarea
                              id="profile-focus-areas"
                              value={profileDraft.focusAreas}
                              onChange={(event) => setProfileField("focusAreas", event.target.value)}
                              className="mt-2 min-h-[100px]"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <Label htmlFor="profile-specialties">Specialties</Label>
                            <Textarea
                              id="profile-specialties"
                              value={profileDraft.specialties}
                              onChange={(event) => setProfileField("specialties", event.target.value)}
                              className="mt-2 min-h-[120px]"
                              placeholder="Anxiety, grief, ADHD, trauma"
                              required
                            />
                            <p className="mt-2 text-xs leading-6 text-muted-foreground">
                              Separate each specialty with a comma.
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="profile-location">Location lines</Label>
                            <Textarea
                              id="profile-location"
                              value={profileDraft.location}
                              onChange={(event) => setProfileField("location", event.target.value)}
                              className="mt-2 min-h-[120px]"
                              placeholder={
                                "Nairobi, Westlands\n1st Floor Realite Building\nCrescent Lane off Parklands Road"
                              }
                              required
                            />
                            <p className="mt-2 text-xs leading-6 text-muted-foreground">
                              Use a new line for each address line shown publicly.
                            </p>
                          </div>
                        </div>

                        <Button type="submit" variant="hero" className="w-full rounded-full sm:w-auto">
                          <FilePenLine className="h-4 w-4" />
                          Save Profile Changes
                        </Button>
                      </form>
                    </div>
                  </TabsContent>

                  <TabsContent value="security" className="mt-8">
                    <TherapistSecurityPanel />
                  </TabsContent>

                  <TabsContent value="notifications" className="mt-8">
                    <div className="rounded-[1.75rem] border border-border/60 bg-card/80 p-5 shadow-card sm:p-6">
                      <div className="flex items-start gap-3 sm:items-center">
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <BellRing className="h-5 w-5" />
                          {unreadNotificationCount > 0 ? (
                            <span className="absolute -right-1 -top-1 inline-flex min-w-[1.2rem] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold leading-4 text-primary-foreground">
                              {unreadNotificationCountLabel}
                            </span>
                          ) : null}
                        </div>
                        <div>
                          <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">Notifications</h2>
                          <p className="text-sm text-muted-foreground">New bookings, cancellations, reschedules, and blog updates.</p>
                        </div>
                      </div>

                      <div className="mt-6 space-y-4">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`rounded-[1.5rem] p-4 transition-colors ${
                              notification.read ? "bg-secondary/35" : "bg-primary/8 ring-1 ring-primary/12"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-foreground">{notification.title}</p>
                                  {!notification.read ? (
                                    <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                                      Unread
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDismissNotification(notification.id)}
                                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground"
                                aria-label="Delete notification"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="mt-2 text-sm leading-7 text-muted-foreground">{notification.description}</p>
                            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-primary/65">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                        {notifications.length === 0 ? (
                          <div className="rounded-[1.5rem] bg-secondary/45 p-4 text-sm text-muted-foreground">
                            Notifications will appear here as soon as bookings and content changes are made.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="completed" className="mt-8">
                    <div className="rounded-[1.75rem] border border-border/60 bg-card/80 p-5 shadow-card sm:p-6">
                      <div>
                        <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">Completed Sessions</h2>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          Completed sessions and sessions whose scheduled time has passed are kept here.
                        </p>
                      </div>

                      <div className="mt-6 space-y-4 md:hidden">
                        {completedBookings.map((booking) => {
                          const statusLabel = getBookingStatusLabel(booking, currentTime);

                          return (
                            <div key={booking.id} className="rounded-[1.5rem] border border-border/60 bg-secondary/25 p-4 shadow-card">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground">{booking.clientName}</p>
                                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-primary/65">
                                    {formatServiceType(booking.serviceType)} Â· {booking.sessionType} session
                                  </p>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className={`rounded-full px-3 py-1 capitalize ${getStatusBadgeClassName(statusLabel)}`}
                                >
                                  {statusLabel}
                                </Badge>
                              </div>
                              <div className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
                                <p>
                                  <span className="font-medium text-foreground">Date:</span> {formatDisplayDate(booking.date)}
                                </p>
                                <p>
                                  <span className="font-medium text-foreground">Time:</span> {formatDisplayTime(booking.time)}
                                </p>
                                <p className="break-all">
                                  <span className="font-medium text-foreground">Email:</span> {booking.clientEmail}
                                </p>
                                <p>
                                  <span className="font-medium text-foreground">Phone:</span> {booking.clientPhone}
                                </p>
                              </div>
                              {hasBookingDashboardLinks(booking) ? (
                                <div className="mt-4 border-t border-border/40 pt-3">
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                                    Session Links
                                  </p>
                                  <BookingDashboardLinks booking={booking} compact />
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                        {completedBookings.length === 0 ? (
                          <div className="rounded-[1.5rem] bg-secondary/45 p-4 text-sm text-muted-foreground">
                            Completed and expired sessions will appear here.
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-6 hidden overflow-x-auto md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Client</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {completedBookings.map((booking) => {
                              const statusLabel = getBookingStatusLabel(booking, currentTime);

                              return (
                                <Fragment key={booking.id}>
                                  <TableRow>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <p className="font-medium text-foreground">{booking.clientName}</p>
                                        <p className="text-xs uppercase tracking-[0.18em] text-primary/65">
                                          {formatServiceType(booking.serviceType)} Â· {booking.sessionType} session
                                        </p>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <p className="text-sm text-foreground">{booking.clientEmail}</p>
                                        <p className="text-xs text-muted-foreground">{booking.clientPhone}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell>{formatDisplayDate(booking.date)}</TableCell>
                                    <TableCell>{formatDisplayTime(booking.time)}</TableCell>
                                    <TableCell className="capitalize">{booking.sessionType}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="secondary"
                                        className={`rounded-full px-3 py-1 capitalize ${getStatusBadgeClassName(statusLabel)}`}
                                      >
                                        {statusLabel}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                  {hasBookingDashboardLinks(booking) ? (
                                    <TableRow>
                                      <TableCell colSpan={6} className="pt-0">
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/40 pt-3">
                                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                                            Session Links
                                          </span>
                                          <BookingDashboardLinks booking={booking} compact />
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ) : null}
                                </Fragment>
                              );
                            })}
                            {completedBookings.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                  Completed and expired sessions will appear here.
                                </TableCell>
                              </TableRow>
                            ) : null}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <aside className="min-w-0 space-y-6">
                <div className="rounded-[2rem] border border-border/60 bg-card p-5 shadow-card sm:p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">Live profile</p>
                  <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <img
                      src={therapist.image}
                      alt={therapist.name}
                      className="h-20 w-20 rounded-[1.5rem] object-cover object-top shadow-soft"
                    />
                    <div className="min-w-0">
                      <h2 className="font-heading text-[1.85rem] font-semibold leading-tight text-foreground sm:text-2xl">{therapist.name}</h2>
                      <p className="mt-1 text-sm text-primary">{therapist.title}</p>
                      <p className="mt-2 break-all text-xs uppercase tracking-[0.2em] text-primary/65">{therapist.email}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    Keep this profile updated so the public therapist sections, bookings, and contact details stay in
                    sync.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>
      <Dialog open={Boolean(bookingToComplete)} onOpenChange={(open) => (open ? undefined : closeCompleteBookingDialog())}>
        <DialogContent className="max-w-lg rounded-[1.75rem] border-border/60">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-foreground">Mark session completed</DialogTitle>
            <DialogDescription className="leading-6">
              {bookingToComplete
                ? `Confirm that ${bookingToComplete.clientName}'s session is finished. It will move to Completed.`
                : "Confirm that this session is finished."}
            </DialogDescription>
          </DialogHeader>

          {bookingToComplete ? (
            <div className="rounded-[1.25rem] border border-border/60 bg-secondary/30 p-4 text-sm leading-7 text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Date:</span> {formatDisplayDate(bookingToComplete.date)}
              </p>
              <p>
                <span className="font-medium text-foreground">Time:</span> {formatDisplayTime(bookingToComplete.time)}
              </p>
              <p>
                <span className="font-medium text-foreground">Session:</span>{" "}
                {formatServiceType(bookingToComplete.serviceType)} {bookingToComplete.sessionType}
              </p>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="heroBorder" className="rounded-full" onClick={closeCompleteBookingDialog} disabled={isCompletingBooking}>
              Cancel
            </Button>
            <Button type="button" variant="hero" className="rounded-full" onClick={handleMarkCompleted} disabled={isCompletingBooking}>
              {isCompletingBooking ? "Completing..." : "Confirm Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(bookingToDelete)} onOpenChange={(open) => (open ? undefined : closeDeleteBookingDialog())}>
        <DialogContent className="max-w-lg rounded-[1.75rem] border-border/60">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-foreground">Delete session</DialogTitle>
            <DialogDescription className="leading-6">
              If you proceed, this session will be deleted permanently.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="heroBorder" className="rounded-full" onClick={closeDeleteBookingDialog} disabled={isDeletingBooking}>
              Cancel
            </Button>
            <Button type="button" variant="hero" className="rounded-full" onClick={handleDeleteBooking} disabled={isDeletingBooking}>
              {isDeletingBooking ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default TherapistDashboardPage;
