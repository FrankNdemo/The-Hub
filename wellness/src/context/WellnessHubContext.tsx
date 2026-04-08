import { createContext, useContext, useEffect, useState } from "react";

import { seedBlogPosts } from "@/data/blogPosts";
import { primaryTherapist } from "@/data/siteData";
import {
  WELLNESS_STORAGE_KEY,
  THERAPIST_PORTAL_CREDENTIALS,
  estimateReadTime,
  formatDisplayDate,
  formatDisplayTime,
  makeId,
  makeMeetLink,
  makeToken,
  slugify,
  THERAPIST_SECRET_PASSPHRASE,
} from "@/lib/wellness";
import type {
  BlogPost,
  BlogPostDraft,
  BookingInput,
  BookingRecord,
  NotificationItem,
  RescheduleInput,
  TherapistPortalSecurity,
  TherapistProfile,
  WellnessHubState,
} from "@/types/wellness";

type SecurityActionResult = { success: true } | { success: false; error: string };

interface WellnessHubContextValue extends WellnessHubState {
  isTherapistAuthenticated: boolean;
  submitBooking: (input: BookingInput) => BookingRecord;
  getBookingByToken: (token: string) => BookingRecord | undefined;
  rescheduleBooking: (input: RescheduleInput) => BookingRecord | null;
  cancelBooking: (token: string) => BookingRecord | null;
  markBookingCompleted: (id: string) => BookingRecord | null;
  saveBlogPost: (draft: BlogPostDraft) => BlogPost;
  deleteBlogPost: (id: string) => void;
  dismissNotification: (id: string) => void;
  markNotificationsRead: () => void;
  updateTherapistProfile: (profile: TherapistProfile) => void;
  verifyTherapistPassphrase: (passphrase: string) => boolean;
  loginTherapist: (email: string, password: string) => boolean;
  updateTherapistPassword: (currentPassword: string, nextPassword: string) => SecurityActionResult;
  updateTherapistSecretPassphrase: (
    currentSecretPassphrase: string,
    nextSecretPassphrase: string,
  ) => SecurityActionResult;
  resetTherapistPassword: (email: string, secretPassphrase: string, nextPassword: string) => SecurityActionResult;
  logoutTherapist: () => void;
}

const WellnessHubContext = createContext<WellnessHubContextValue | null>(null);

const defaultState: WellnessHubState = {
  blogPosts: seedBlogPosts,
  bookings: [],
  notifications: [],
  therapist: primaryTherapist,
  therapistPortalSecurity: {
    password: THERAPIST_PORTAL_CREDENTIALS.password,
    secretPassphrase: THERAPIST_SECRET_PASSPHRASE,
  },
  therapistSession: null,
};

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

const normalizePassphrase = (value: string) => value.trim().toLowerCase();

const normalizeTherapistPortalSecurity = (
  security?: Partial<TherapistPortalSecurity> | null,
): TherapistPortalSecurity => ({
  password:
    typeof security?.password === "string" && security.password.trim()
      ? security.password
      : THERAPIST_PORTAL_CREDENTIALS.password,
  secretPassphrase:
    typeof security?.secretPassphrase === "string" && security.secretPassphrase.trim()
      ? security.secretPassphrase.trim()
      : THERAPIST_SECRET_PASSPHRASE,
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

const readStoredState = (): WellnessHubState => {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const raw = window.localStorage.getItem(WELLNESS_STORAGE_KEY);

    if (!raw) {
      return defaultState;
    }

    const parsed = JSON.parse(raw) as Partial<WellnessHubState>;

    return {
      blogPosts: Array.isArray(parsed.blogPosts) && parsed.blogPosts.length ? parsed.blogPosts : seedBlogPosts,
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      notifications: Array.isArray(parsed.notifications)
        ? parsed.notifications
            .map((notification) => normalizeNotification(notification))
            .filter((notification): notification is NotificationItem => Boolean(notification))
        : [],
      therapist: normalizeTherapistProfile(parsed.therapist),
      therapistPortalSecurity: normalizeTherapistPortalSecurity(parsed.therapistPortalSecurity),
      therapistSession: parsed.therapistSession ?? null,
    };
  } catch {
    return defaultState;
  }
};

const buildManageUrl = (token: string) => {
  if (typeof window === "undefined") {
    return `/manage/${token}`;
  }

  return `${window.location.origin}/manage/${token}`;
};

const buildNotification = (
  type: NotificationItem["type"],
  title: string,
  description: string,
): NotificationItem => ({
  id: makeId("notification"),
  type,
  title,
  description,
  createdAt: new Date().toISOString(),
  read: false,
});

const dedupeSlug = (value: string, posts: BlogPost[], currentId?: string) => {
  let slug = slugify(value);
  let counter = 1;

  while (posts.some((post) => post.slug === slug && post.id !== currentId)) {
    counter += 1;
    slug = `${slugify(value)}-${counter}`;
  }

  return slug;
};

const buildEmailHtml = (
  booking: BookingRecord,
  kind: "confirmation" | "reschedule" | "cancellation",
) => {
  const headingMap = {
    confirmation: "Your session is confirmed",
    reschedule: "Your session has been rescheduled",
    cancellation: "Your session has been cancelled",
  };

  const introMap = {
    confirmation:
      "Thank you for booking with The Wellness Hub. Here is your session summary and your private booking management link.",
    reschedule:
      "Your updated session details are below. Your private management link remains active if you need to make another change.",
    cancellation:
      "This message confirms that your session has been cancelled. If you would like to book again, we would be honored to support you.",
  };

  const sessionLocation =
    booking.sessionType === "virtual"
      ? booking.meetLink ?? "Google Meet link will be shared shortly."
      : booking.locationSummary;

  return `<!DOCTYPE html>
  <html lang="en">
    <body style="margin:0;padding:24px;background:#f5f3ec;font-family:Inter,Arial,sans-serif;color:#23483d;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(35,72,61,0.08);">
        <tr>
          <td style="padding:28px 32px;background:linear-gradient(135deg,#edf4ef,#f9f7f0);">
            <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.35em;text-transform:uppercase;color:#6f8f82;">The Wellness Hub</p>
            <h1 style="margin:0;font-size:30px;line-height:1.2;color:#23483d;">${headingMap[kind]}</h1>
            <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#4c695f;">${introMap[kind]}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 12px;">
              <tr>
                <td style="width:180px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Client</td>
                <td style="font-size:15px;color:#23483d;">${booking.clientName}</td>
              </tr>
              <tr>
                <td style="width:180px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Therapist</td>
                <td style="font-size:15px;color:#23483d;">${booking.therapistName}</td>
              </tr>
              <tr>
                <td style="width:180px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Date</td>
                <td style="font-size:15px;color:#23483d;">${formatDisplayDate(booking.date)}</td>
              </tr>
              <tr>
                <td style="width:180px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Time</td>
                <td style="font-size:15px;color:#23483d;">${formatDisplayTime(booking.time)}</td>
              </tr>
              <tr>
                <td style="width:180px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Session Type</td>
                <td style="font-size:15px;color:#23483d;text-transform:capitalize;">${booking.sessionType}</td>
              </tr>
              <tr>
                <td style="width:180px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Details</td>
                <td style="font-size:15px;color:#23483d;line-height:1.6;">${sessionLocation}</td>
              </tr>
            </table>

            <div style="margin-top:28px;padding:24px;border-radius:20px;background:#f7fbf8;border:1px solid rgba(35,72,61,0.08);">
              <p style="margin:0 0 8px;font-size:13px;color:#6f8f82;text-transform:uppercase;letter-spacing:0.12em;">Manage Your Session</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#4c695f;">Use your private link below to reschedule or cancel your session without logging in.</p>
              <a href="${booking.manageUrl}" style="display:inline-block;padding:13px 20px;border-radius:999px;background:#4e7c68;color:#ffffff;text-decoration:none;font-weight:600;">Reschedule or Cancel</a>
            </div>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
};

export const WellnessHubProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<WellnessHubState>(() => readStoredState());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== WELLNESS_STORAGE_KEY || !event.newValue) {
        return;
      }

      setState(readStoredState());
    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const submitBooking = (input: BookingInput) => {
    const createdAt = new Date().toISOString();
    const token = makeToken();
    const meetLink = input.sessionType === "virtual" ? makeMeetLink() : undefined;
    const therapist = state.therapist;

    const booking: BookingRecord = {
      id: makeId("booking"),
      token,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientPhone: input.clientPhone,
      therapistId: input.therapistId,
      therapistName: therapist.name,
      sessionType: input.sessionType,
      date: input.date,
      time: input.time,
      status: "upcoming",
      locationSummary:
        input.sessionType === "physical"
          ? therapist.location.join(", ")
          : "Online via Google Meet",
      calendarEventId: makeId("gcal"),
      meetLink,
      manageUrl: buildManageUrl(token),
      createdAt,
      updatedAt: createdAt,
      notes: input.notes,
      history: [
        {
          id: makeId("history"),
          type: "created",
          title: "Booking confirmed",
          description: `${input.clientName} booked a ${input.sessionType} session with ${therapist.name}.`,
          createdAt,
        },
      ],
      emails: [],
    };

    const confirmationEmail = {
      id: makeId("email"),
      kind: "confirmation" as const,
      subject: `Session Confirmation | The Wellness Hub`,
      recipients: [booking.clientEmail, therapist.email],
      html: buildEmailHtml(booking, "confirmation"),
      createdAt,
    };

    booking.emails = [confirmationEmail];

    setState((current) => ({
      ...current,
      bookings: [booking, ...current.bookings],
      notifications: [
        buildNotification(
          "booking",
          "New booking confirmed",
          `${booking.clientName} booked a ${booking.sessionType} session for ${formatDisplayDate(booking.date)} at ${formatDisplayTime(booking.time)}.`,
        ),
        ...current.notifications,
      ].slice(0, 20),
    }));

    return booking;
  };

  const getBookingByToken = (token: string) => state.bookings.find((booking) => booking.token === token);

  const rescheduleBooking = ({ token, date, time }: RescheduleInput) => {
    const existing = state.bookings.find((booking) => booking.token === token);
    const therapist = state.therapist;

    if (!existing || existing.status === "cancelled") {
      return null;
    }

    const updatedAt = new Date().toISOString();
    const meetLink = existing.sessionType === "virtual" ? makeMeetLink() : undefined;
    const baseBooking: BookingRecord = {
      ...existing,
      date,
      time,
      meetLink,
      status: "rescheduled",
      updatedAt,
      history: [
        {
          id: makeId("history"),
          type: "rescheduled",
          title: "Session rescheduled",
          description: `${existing.clientName} moved the session to ${formatDisplayDate(date)} at ${formatDisplayTime(time)}.`,
          createdAt: updatedAt,
        },
        ...existing.history,
      ],
      emails: existing.emails,
    };
    const updatedBooking: BookingRecord = {
      ...baseBooking,
      emails: [
        {
          id: makeId("email"),
          kind: "reschedule",
          subject: `Session Rescheduled | The Wellness Hub`,
          recipients: [existing.clientEmail, therapist.email],
          html: buildEmailHtml(baseBooking, "reschedule"),
          createdAt: updatedAt,
        },
        ...existing.emails,
      ],
    };

    setState((current) => ({
      ...current,
      bookings: current.bookings.map((booking) => (booking.id === updatedBooking.id ? updatedBooking : booking)),
      notifications: [
        buildNotification(
          "reschedule",
          "Session rescheduled",
          `${updatedBooking.clientName} selected ${formatDisplayDate(date)} at ${formatDisplayTime(time)}.`,
        ),
        ...current.notifications,
      ].slice(0, 20),
    }));

    return updatedBooking;
  };

  const cancelBooking = (token: string) => {
    const existing = state.bookings.find((booking) => booking.token === token);
    const therapist = state.therapist;

    if (!existing || existing.status === "cancelled") {
      return null;
    }

    const updatedAt = new Date().toISOString();
    const baseBooking: BookingRecord = {
      ...existing,
      status: "cancelled",
      updatedAt,
      history: [
        {
          id: makeId("history"),
          type: "cancelled",
          title: "Session cancelled",
          description: `${existing.clientName} cancelled the session scheduled for ${formatDisplayDate(existing.date)}.`,
          createdAt: updatedAt,
        },
        ...existing.history,
      ],
      emails: existing.emails,
    };
    const updatedBooking: BookingRecord = {
      ...baseBooking,
      emails: [
        {
          id: makeId("email"),
          kind: "cancellation",
          subject: `Session Cancelled | The Wellness Hub`,
          recipients: [existing.clientEmail, therapist.email],
          html: buildEmailHtml(baseBooking, "cancellation"),
          createdAt: updatedAt,
        },
        ...existing.emails,
      ],
    };

    setState((current) => ({
      ...current,
      bookings: current.bookings.map((booking) => (booking.id === updatedBooking.id ? updatedBooking : booking)),
      notifications: [
        buildNotification(
          "cancel",
          "Session cancelled",
          `${updatedBooking.clientName} cancelled a ${updatedBooking.sessionType} session.`,
        ),
        ...current.notifications,
      ].slice(0, 20),
    }));

    return updatedBooking;
  };

  const markBookingCompleted = (id: string) => {
    const existing = state.bookings.find((booking) => booking.id === id);

    if (!existing || existing.status === "cancelled" || existing.status === "completed") {
      return null;
    }

    const updatedAt = new Date().toISOString();
    const updatedBooking: BookingRecord = {
      ...existing,
      status: "completed",
      updatedAt,
      history: [
        {
          id: makeId("history"),
          type: "completed",
          title: "Session completed",
          description: `${existing.clientName}'s session was marked as completed.`,
          createdAt: updatedAt,
        },
        ...existing.history,
      ],
    };

    setState((current) => ({
      ...current,
      bookings: current.bookings.map((booking) => (booking.id === updatedBooking.id ? updatedBooking : booking)),
      notifications: [
        buildNotification(
          "completion",
          "Session completed",
          `${updatedBooking.clientName}'s session with ${updatedBooking.therapistName} is now complete.`,
        ),
        ...current.notifications,
      ].slice(0, 20),
    }));

    return updatedBooking;
  };

  const saveBlogPost = (draft: BlogPostDraft) => {
    const now = new Date().toISOString();
    const slug = dedupeSlug(draft.title, state.blogPosts, draft.id);
    const normalizedTags = draft.tags.map((tag) => tag.trim()).filter(Boolean);
    const therapist = state.therapist;
    const nextPost: BlogPost = {
      id: draft.id ?? makeId("blog"),
      slug,
      title: draft.title,
      category: draft.category,
      publishDate:
        state.blogPosts.find((post) => post.id === draft.id)?.publishDate ?? now.slice(0, 10),
      author: draft.author || therapist.name,
      readTime: estimateReadTime(draft.contentHtml),
      excerpt: draft.excerpt,
      featuredImage: draft.featuredImage,
      contentHtml: draft.contentHtml,
      tags: normalizedTags,
    };

    const isEdit = Boolean(draft.id);

    setState((current) => ({
      ...current,
      blogPosts: isEdit
        ? current.blogPosts.map((post) => (post.id === nextPost.id ? nextPost : post))
        : [nextPost, ...current.blogPosts],
      notifications: [
        buildNotification(
          "blog",
          isEdit ? "Blog post updated" : "Blog post published",
          `${nextPost.title} is now available in the blog section.`,
        ),
        ...current.notifications,
      ].slice(0, 20),
    }));

    return nextPost;
  };

  const deleteBlogPost = (id: string) => {
    setState((current) => ({
      ...current,
      blogPosts: current.blogPosts.filter((post) => post.id !== id),
    }));
  };

  const dismissNotification = (id: string) => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.filter((notification) => notification.id !== id),
    }));
  };

  const markNotificationsRead = () => {
    setState((current) => {
      if (!current.notifications.some((notification) => !notification.read)) {
        return current;
      }

      return {
        ...current,
        notifications: current.notifications.map((notification) =>
          notification.read ? notification : { ...notification, read: true },
        ),
      };
    });
  };

  const updateTherapistProfile = (profile: TherapistProfile) => {
    const normalizedProfile = normalizeTherapistProfile(profile);
    const updatedAt = new Date().toISOString();

    setState((current) => ({
      ...current,
      therapist: normalizedProfile,
      therapistPortalSecurity: current.therapistPortalSecurity,
      blogPosts: current.blogPosts.map((post) =>
        post.author === current.therapist.name ? { ...post, author: normalizedProfile.name } : post,
      ),
      bookings: current.bookings.map((booking) => ({
        ...booking,
        therapistId: normalizedProfile.id,
        therapistName: normalizedProfile.name,
        locationSummary:
          booking.sessionType === "physical" ? normalizedProfile.location.join(", ") : booking.locationSummary,
        updatedAt,
      })),
      therapistSession: current.therapistSession
        ? {
            ...current.therapistSession,
            email: normalizedProfile.email,
            name: normalizedProfile.name,
          }
        : null,
    }));
  };

  const verifyTherapistPassphrase = (passphrase: string) =>
    normalizePassphrase(passphrase) === normalizePassphrase(state.therapistPortalSecurity.secretPassphrase);

  const loginTherapist = (email: string, password: string) => {
    const isValid =
      email.trim().toLowerCase() === state.therapist.email.trim().toLowerCase() &&
      password === state.therapistPortalSecurity.password;

    if (!isValid) {
      return false;
    }

    setState((current) => ({
      ...current,
      therapistSession: {
        email: current.therapist.email,
        name: current.therapist.name,
        loggedInAt: new Date().toISOString(),
      },
    }));

    return true;
  };

  const updateTherapistPassword = (currentPassword: string, nextPassword: string): SecurityActionResult => {
    if (currentPassword !== state.therapistPortalSecurity.password) {
      return { success: false, error: "Your current password is incorrect." };
    }

    if (!nextPassword.trim()) {
      return { success: false, error: "Please enter a new password." };
    }

    setState((current) => ({
      ...current,
      therapistPortalSecurity: {
        ...current.therapistPortalSecurity,
        password: nextPassword,
      },
    }));

    return { success: true };
  };

  const updateTherapistSecretPassphrase = (
    currentSecretPassphrase: string,
    nextSecretPassphrase: string,
  ): SecurityActionResult => {
    if (!verifyTherapistPassphrase(currentSecretPassphrase)) {
      return { success: false, error: "Your current secret passphrase is incorrect." };
    }

    if (!nextSecretPassphrase.trim()) {
      return { success: false, error: "Please enter a new secret passphrase." };
    }

    setState((current) => ({
      ...current,
      therapistPortalSecurity: {
        ...current.therapistPortalSecurity,
        secretPassphrase: nextSecretPassphrase.trim(),
      },
    }));

    return { success: true };
  };

  const resetTherapistPassword = (
    email: string,
    secretPassphrase: string,
    nextPassword: string,
  ): SecurityActionResult => {
    if (email.trim().toLowerCase() !== state.therapist.email.trim().toLowerCase()) {
      return { success: false, error: "That email does not match the therapist account." };
    }

    if (!verifyTherapistPassphrase(secretPassphrase)) {
      return { success: false, error: "Secret passphrase not recognized." };
    }

    if (!nextPassword.trim()) {
      return { success: false, error: "Please enter a new password." };
    }

    setState((current) => ({
      ...current,
      therapistPortalSecurity: {
        ...current.therapistPortalSecurity,
        password: nextPassword,
      },
    }));

    return { success: true };
  };

  const logoutTherapist = () => {
    setState((current) => ({
      ...current,
      therapistSession: null,
    }));
  };

  const value: WellnessHubContextValue = {
    ...state,
    isTherapistAuthenticated: Boolean(state.therapistSession),
    submitBooking,
    getBookingByToken,
    rescheduleBooking,
    cancelBooking,
    markBookingCompleted,
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
