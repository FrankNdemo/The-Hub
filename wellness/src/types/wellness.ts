export type SessionType = "virtual" | "physical";

export type BookingStatus = "upcoming" | "rescheduled" | "cancelled" | "completed";

export type BookingEventType = "created" | "rescheduled" | "cancelled" | "completed";

export interface TherapistProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  qualifications: string;
  approach: string;
  experience: string;
  focusAreas: string;
  specialties: string[];
  email: string;
  phone: string;
  location: string[];
  image: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  publishDate: string;
  author: string;
  readTime: string;
  excerpt: string;
  featuredImage: string;
  contentHtml: string;
  tags: string[];
}

export interface BlogPostDraft {
  id?: string;
  title: string;
  category: string;
  author: string;
  excerpt: string;
  featuredImage: string;
  contentHtml: string;
  tags: string[];
}

export interface EmailRecord {
  id: string;
  kind: "confirmation" | "reschedule" | "cancellation";
  subject: string;
  recipients: string[];
  html: string;
  createdAt: string;
}

export interface BookingHistoryEvent {
  id: string;
  type: BookingEventType;
  title: string;
  description: string;
  createdAt: string;
}

export interface BookingRecord {
  id: string;
  token: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  therapistId: string;
  therapistName: string;
  sessionType: SessionType;
  date: string;
  time: string;
  status: BookingStatus;
  locationSummary: string;
  calendarEventId: string;
  meetLink?: string;
  manageUrl: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  emails: EmailRecord[];
  history: BookingHistoryEvent[];
}

export interface NotificationItem {
  id: string;
  type: "booking" | "reschedule" | "cancel" | "completion" | "blog";
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
}

export interface TherapistSession {
  email: string;
  name: string;
  loggedInAt: string;
}

export interface TherapistPortalSecurity {
  password: string;
  secretPassphrase: string;
}

export interface WellnessHubState {
  blogPosts: BlogPost[];
  bookings: BookingRecord[];
  notifications: NotificationItem[];
  therapist: TherapistProfile;
  therapistPortalSecurity: TherapistPortalSecurity;
  therapistSession: TherapistSession | null;
}

export interface BookingInput {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  therapistId: string;
  date: string;
  time: string;
  sessionType: SessionType;
  notes?: string;
}

export interface RescheduleInput {
  token: string;
  date: string;
  time: string;
}
