import { createContext, useContext, useEffect, useState } from "react";

import { seedBlogPosts } from "@/data/blogPosts";
import { primaryTherapist } from "@/data/siteData";
import {
  ApiError,
  clearStoredAuthTokens,
  createBooking as createBookingRequest,
  deleteBookingRequest,
  deleteBlogPostRequest,
  deleteNotificationRequest,
  fetchDashboardOverview,
  fetchManageBooking,
  fetchPublicBlogPosts,
  fetchPublicTherapist,
  getApiErrorMessage,
  getStoredAuthTokens,
  loginTherapistRequest,
  logoutTherapistRequest,
  markNotificationsReadRequest,
  rescheduleManageBooking,
  cancelManageBooking as cancelManageBookingRequest,
  completeBookingRequest,
  resetTherapistPasswordRequest,
  saveBlogPostRequest,
  updateTherapistPasswordRequest,
  updateTherapistProfileRequest,
  updateTherapistSecretPassphraseRequest,
  verifyTherapistPassphraseRequest,
  type DashboardOverviewResponse,
} from "@/lib/api";
import type {
  BlogPost,
  BlogPostDraft,
  BookingInput,
  BookingRecord,
  NotificationItem,
  TherapistProfile,
  WellnessHubState,
} from "@/types/wellness";

type ActionResult = { success: true } | { success: false; error: string };

interface WellnessHubContextValue extends WellnessHubState {
  isInitializing: boolean;
  isTherapistAuthenticated: boolean;
  refreshPublicContent: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  submitBooking: (input: BookingInput) => Promise<BookingRecord>;
  getBookingByToken: (token: string, email: string) => Promise<BookingRecord | null>;
  rescheduleBooking: (input: { token: string; clientEmail: string; date: string; time: string }) => Promise<BookingRecord>;
  cancelBooking: (token: string, email: string) => Promise<BookingRecord>;
  markBookingCompleted: (id: string) => Promise<BookingRecord>;
  deleteBooking: (id: string, reason: string) => Promise<void>;
  saveBlogPost: (draft: BlogPostDraft) => Promise<BlogPost>;
  deleteBlogPost: (id: string) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  updateTherapistProfile: (profile: TherapistProfile) => Promise<TherapistProfile>;
  verifyTherapistPassphrase: (passphrase: string) => Promise<ActionResult>;
  loginTherapist: (email: string, password: string) => Promise<ActionResult>;
  updateTherapistPassword: (currentPassword: string, nextPassword: string) => Promise<ActionResult>;
  updateTherapistSecretPassphrase: (
    currentSecretPassphrase: string,
    nextSecretPassphrase: string,
  ) => Promise<ActionResult>;
  resetTherapistPassword: (
    email: string,
    secretPassphrase: string,
    nextPassword: string,
  ) => Promise<ActionResult>;
  logoutTherapist: () => Promise<void>;
}

const WellnessHubContext = createContext<WellnessHubContextValue | null>(null);

const defaultState: WellnessHubState = {
  blogPosts: seedBlogPosts,
  bookings: [],
  notifications: [],
  therapist: primaryTherapist,
  therapistSession: null,
};

const seedBlogPostsBySlug = new Map(seedBlogPosts.map((post) => [post.slug, post]));

const normalizeTherapistProfile = (profile?: Partial<TherapistProfile> | null): TherapistProfile => ({
  ...primaryTherapist,
  ...profile,
  specialties:
    Array.isArray(profile?.specialties) && profile.specialties.length
      ? profile.specialties
      : primaryTherapist.specialties,
  location:
    Array.isArray(profile?.location) && profile.location.length ? profile.location : primaryTherapist.location,
  image: typeof profile?.image === "string" && profile.image ? profile.image : primaryTherapist.image,
});

const normalizeNotification = (notification?: Partial<NotificationItem> | null): NotificationItem | null => {
  if (
    !notification ||
    typeof notification.id !== "string" ||
    typeof notification.title !== "string" ||
    typeof notification.description !== "string" ||
    typeof notification.createdAt !== "string"
  ) {
    return null;
  }

  const type: NotificationItem["type"] =
    notification.type === "booking" ||
    notification.type === "reschedule" ||
    notification.type === "cancel" ||
    notification.type === "completion" ||
    notification.type === "blog"
      ? notification.type
      : "booking";

  return {
    id: notification.id,
    type,
    title: notification.title,
    description: notification.description,
    createdAt: notification.createdAt,
    read: Boolean(notification.read),
  };
};

const normalizeBlogPost = (post?: Partial<BlogPost> | null): BlogPost | null => {
  if (
    !post ||
    typeof post.id !== "string" ||
    typeof post.slug !== "string" ||
    typeof post.title !== "string" ||
    typeof post.category !== "string" ||
    typeof post.publishDate !== "string" ||
    typeof post.author !== "string" ||
    typeof post.readTime !== "string" ||
    typeof post.excerpt !== "string" ||
    typeof post.contentHtml !== "string" ||
    !Array.isArray(post.tags)
  ) {
    return null;
  }

  const seedFallback = seedBlogPostsBySlug.get(post.slug);

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    category: post.category,
    publishDate: post.publishDate,
    author: post.author,
    readTime: post.readTime,
    excerpt: post.excerpt,
    featuredImage:
      typeof post.featuredImage === "string" && post.featuredImage
        ? post.featuredImage
        : seedFallback?.featuredImage ?? "",
    contentHtml: post.contentHtml,
    tags: post.tags.filter((tag): tag is string => typeof tag === "string"),
  };
};

const normalizeBooking = (booking?: Partial<BookingRecord> | null): BookingRecord | null => {
  if (
    !booking ||
    typeof booking.id !== "string" ||
    typeof booking.token !== "string" ||
    typeof booking.clientName !== "string" ||
    typeof booking.clientEmail !== "string" ||
    typeof booking.clientPhone !== "string" ||
    typeof booking.therapistId !== "string" ||
    typeof booking.therapistName !== "string" ||
    typeof booking.date !== "string" ||
    typeof booking.time !== "string" ||
    typeof booking.locationSummary !== "string" ||
    typeof booking.calendarEventId !== "string" ||
    typeof booking.manageUrl !== "string" ||
    typeof booking.createdAt !== "string" ||
    typeof booking.updatedAt !== "string"
  ) {
    return null;
  }

  const status: BookingRecord["status"] =
    booking.status === "rescheduled" ||
    booking.status === "cancelled" ||
    booking.status === "completed"
      ? booking.status
      : "upcoming";

  return {
    id: booking.id,
    token: booking.token,
    clientName: booking.clientName,
    clientEmail: booking.clientEmail,
    clientPhone: booking.clientPhone,
    therapistId: booking.therapistId,
    therapistName: booking.therapistName,
    serviceType:
      booking.serviceType === "family" || booking.serviceType === "corporate"
        ? booking.serviceType
        : "individual",
    participantCount:
      typeof booking.participantCount === "number" &&
      Number.isFinite(booking.participantCount) &&
      booking.participantCount > 0
        ? Math.round(booking.participantCount)
        : undefined,
    sessionType: booking.sessionType === "physical" ? "physical" : "virtual",
    date: booking.date,
    time: booking.time,
    status,
    locationSummary: booking.locationSummary,
    calendarEventId: booking.calendarEventId,
    meetLink: typeof booking.meetLink === "string" && booking.meetLink ? booking.meetLink : undefined,
    joinUrl: typeof booking.joinUrl === "string" ? booking.joinUrl : "",
    manageUrl: booking.manageUrl,
    addToCalendarUrl: typeof booking.addToCalendarUrl === "string" ? booking.addToCalendarUrl : "",
    therapistAddToCalendarUrl:
      typeof booking.therapistAddToCalendarUrl === "string" ? booking.therapistAddToCalendarUrl : "",
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    notes: typeof booking.notes === "string" && booking.notes ? booking.notes : undefined,
    emails: Array.isArray(booking.emails) ? booking.emails : [],
    history: Array.isArray(booking.history) ? booking.history : [],
  };
};

const applyDashboardSnapshot = (snapshot: DashboardOverviewResponse): WellnessHubState => ({
  blogPosts: snapshot.blogPosts
    .map((post) => normalizeBlogPost(post))
    .filter((post): post is BlogPost => Boolean(post)),
  bookings: snapshot.bookings
    .map((booking) => normalizeBooking(booking))
    .filter((booking): booking is BookingRecord => Boolean(booking)),
  notifications: snapshot.notifications
    .map((notification) => normalizeNotification(notification))
    .filter((notification): notification is NotificationItem => Boolean(notification)),
  therapist: normalizeTherapistProfile(snapshot.therapist),
  therapistSession: snapshot.therapistSession ?? null,
});

const upsertById = <T extends { id: string }>(items: T[], nextItem: T) => {
  const exists = items.some((item) => item.id === nextItem.id);

  if (!exists) {
    return [nextItem, ...items];
  }

  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
};

export const WellnessHubProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<WellnessHubState>(defaultState);
  const [isInitializing, setIsInitializing] = useState(true);

  const setPublicContent = ({
    therapist,
    blogPosts,
  }: {
    therapist?: TherapistProfile;
    blogPosts?: BlogPost[];
  }) => {
    setState((current) => ({
      ...current,
      therapist: therapist ?? current.therapist,
      blogPosts: blogPosts ?? current.blogPosts,
    }));
  };

  const resetAuthenticatedState = () => {
    setState((current) => ({
      ...current,
      bookings: [],
      notifications: [],
      therapistSession: null,
    }));
  };

  const refreshPublicContent = async () => {
    const [therapistResult, blogPostsResult] = await Promise.allSettled([
      fetchPublicTherapist(),
      fetchPublicBlogPosts(),
    ]);

    const therapist =
      therapistResult.status === "fulfilled"
        ? normalizeTherapistProfile(therapistResult.value)
        : undefined;
    const blogPosts =
      blogPostsResult.status === "fulfilled"
        ? blogPostsResult.value
            .map((post) => normalizeBlogPost(post))
            .filter((post): post is BlogPost => Boolean(post))
        : undefined;

    const nextBlogPosts = blogPosts && blogPosts.length > 0 ? blogPosts : undefined;

    if (therapist || nextBlogPosts) {
      setPublicContent({ therapist, blogPosts: nextBlogPosts });
    }
  };

  const refreshDashboard = async () => {
    const snapshot = await fetchDashboardOverview();
    setState(applyDashboardSnapshot(snapshot));
  };

  useEffect(() => {
    let isActive = true;

    const initialize = async () => {
      setIsInitializing(true);

      try {
        await refreshPublicContent();

        if (getStoredAuthTokens()) {
          try {
            await refreshDashboard();
          } catch {
            clearStoredAuthTokens();
            if (isActive) {
              resetAuthenticatedState();
            }
          }
        }
      } finally {
        if (isActive) {
          setIsInitializing(false);
        }
      }
    };

    void initialize();

    return () => {
      isActive = false;
    };
  }, []);

  const submitBooking = async (input: BookingInput) => {
    const booking = normalizeBooking(await createBookingRequest(input));

    if (!booking) {
      throw new Error("The booking response was incomplete.");
    }

    setState((current) => ({
      ...current,
      bookings: current.therapistSession ? upsertById(current.bookings, booking) : current.bookings,
    }));

    if (getStoredAuthTokens()) {
      void refreshDashboard().catch(() => undefined);
    }

    return booking;
  };

  const getBookingByToken = async (token: string, email: string) => {
    try {
      const booking = normalizeBooking(await fetchManageBooking(token, email));

      if (booking && getStoredAuthTokens()) {
        setState((current) => ({
          ...current,
          bookings: upsertById(current.bookings, booking),
        }));
      }

      return booking;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      throw error;
    }
  };

  const rescheduleBooking = async ({
    token,
    clientEmail,
    date,
    time,
  }: {
    token: string;
    clientEmail: string;
    date: string;
    time: string;
  }) => {
    const booking = normalizeBooking(await rescheduleManageBooking(token, clientEmail, date, time));

    if (!booking) {
      throw new Error("The booking response was incomplete.");
    }

    setState((current) => ({
      ...current,
      bookings: current.bookings.some((item) => item.id === booking.id)
        ? upsertById(current.bookings, booking)
        : current.bookings,
    }));

    if (getStoredAuthTokens()) {
      void refreshDashboard().catch(() => undefined);
    }

    return booking;
  };

  const cancelBooking = async (token: string, email: string) => {
    const booking = normalizeBooking(await cancelManageBookingRequest(token, email));

    if (!booking) {
      throw new Error("The booking response was incomplete.");
    }

    setState((current) => ({
      ...current,
      bookings: current.bookings.some((item) => item.id === booking.id)
        ? upsertById(current.bookings, booking)
        : current.bookings,
    }));

    if (getStoredAuthTokens()) {
      void refreshDashboard().catch(() => undefined);
    }

    return booking;
  };

  const markBookingCompleted = async (id: string) => {
    const booking = normalizeBooking(await completeBookingRequest(id));

    if (!booking) {
      throw new Error("The booking response was incomplete.");
    }

    setState((current) => ({
      ...current,
      bookings: upsertById(current.bookings, booking),
    }));

    void refreshDashboard().catch(() => undefined);

    return booking;
  };

  const deleteBooking = async (id: string, reason: string) => {
    await deleteBookingRequest(id, reason);
    setState((current) => ({
      ...current,
      bookings: current.bookings.filter((booking) => booking.id !== id),
    }));

    void refreshDashboard().catch(() => undefined);
  };

  const saveBlogPost = async (draft: BlogPostDraft) => {
    const post = normalizeBlogPost(await saveBlogPostRequest(draft));

    if (!post) {
      throw new Error("The blog response was incomplete.");
    }

    setState((current) => ({
      ...current,
      blogPosts: upsertById(current.blogPosts, post),
    }));

    void refreshDashboard().catch(() => undefined);

    return post;
  };

  const deleteBlogPost = async (id: string) => {
    await deleteBlogPostRequest(id);
    setState((current) => ({
      ...current,
      blogPosts: current.blogPosts.filter((post) => post.id !== id),
    }));
  };

  const dismissNotification = async (id: string) => {
    await deleteNotificationRequest(id);
    setState((current) => ({
      ...current,
      notifications: current.notifications.filter((notification) => notification.id !== id),
    }));
  };

  const markNotificationsRead = async () => {
    await markNotificationsReadRequest();
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.read ? notification : { ...notification, read: true },
      ),
    }));
  };

  const updateTherapistProfile = async (profile: TherapistProfile) => {
    const therapist = normalizeTherapistProfile(await updateTherapistProfileRequest(profile));

    setState((current) => ({
      ...current,
      therapist,
      therapistSession: current.therapistSession
        ? {
            ...current.therapistSession,
            email: therapist.email,
            name: therapist.name,
          }
        : null,
    }));

    void refreshDashboard().catch(() => undefined);

    return therapist;
  };

  const verifyTherapistPassphrase = async (passphrase: string) => {
    try {
      await verifyTherapistPassphraseRequest(passphrase);
      return { success: true } as const;
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(error, "Unable to verify the therapist passphrase right now."),
      } as const;
    }
  };

  const loginTherapist = async (email: string, password: string) => {
    try {
      const payload = await loginTherapistRequest(email, password);

      setState((current) => ({
        ...current,
        therapist: normalizeTherapistProfile(payload.therapist),
        therapistSession: payload.therapistSession,
      }));

      try {
        await refreshDashboard();
      } catch {
        // Keep the authenticated session even if the dashboard snapshot fails to hydrate immediately.
      }

      return { success: true } as const;
    } catch (error) {
      clearStoredAuthTokens();
      resetAuthenticatedState();
      return {
        success: false,
        error: getApiErrorMessage(error, "Unable to log in to the therapist portal right now."),
      } as const;
    }
  };

  const updateTherapistPassword = async (
    currentPassword: string,
    nextPassword: string,
  ): Promise<ActionResult> => {
    if (!nextPassword.trim()) {
      return { success: false, error: "Please enter a new password." };
    }

    try {
      await updateTherapistPasswordRequest(currentPassword, nextPassword);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(error, "Unable to update the therapist password right now."),
      };
    }
  };

  const updateTherapistSecretPassphrase = async (
    currentSecretPassphrase: string,
    nextSecretPassphrase: string,
  ): Promise<ActionResult> => {
    if (!nextSecretPassphrase.trim()) {
      return { success: false, error: "Please enter a new secret passphrase." };
    }

    try {
      await updateTherapistSecretPassphraseRequest(currentSecretPassphrase, nextSecretPassphrase.trim());
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(error, "Unable to update the secret passphrase right now."),
      };
    }
  };

  const resetTherapistPassword = async (
    email: string,
    secretPassphrase: string,
    nextPassword: string,
  ): Promise<ActionResult> => {
    if (!nextPassword.trim()) {
      return { success: false, error: "Please enter a new password." };
    }

    try {
      await resetTherapistPasswordRequest(email, secretPassphrase, nextPassword);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(error, "Unable to reset the therapist password right now."),
      };
    }
  };

  const logoutTherapist = async () => {
    resetAuthenticatedState();
    clearStoredAuthTokens();

    void logoutTherapistRequest().catch(() => undefined);

    try {
      await refreshPublicContent();
    } catch {
      // Keep the latest public content already in memory if the refresh fails.
    }
  };

  const value: WellnessHubContextValue = {
    ...state,
    isInitializing,
    isTherapistAuthenticated: Boolean(state.therapistSession),
    refreshPublicContent,
    refreshDashboard,
    submitBooking,
    getBookingByToken,
    rescheduleBooking,
    cancelBooking,
    markBookingCompleted,
    deleteBooking,
    saveBlogPost,
    deleteBlogPost,
    dismissNotification,
    markNotificationsRead,
    updateTherapistProfile,
    verifyTherapistPassphrase,
    loginTherapist,
    updateTherapistPassword,
    updateTherapistSecretPassphrase,
    resetTherapistPassword,
    logoutTherapist,
  };

  return <WellnessHubContext.Provider value={value}>{children}</WellnessHubContext.Provider>;
};

export const useWellnessHub = () => {
  const context = useContext(WellnessHubContext);

  if (!context) {
    throw new Error("useWellnessHub must be used within WellnessHubProvider");
  }

  return context;
};
