const BOOKING_ACCESS_STORAGE_KEY = "wellness-latest-booking-access-v1";

interface StoredBookingAccess {
  token: string;
  email: string;
  savedAt: string;
}

export const rememberBookingAccess = (token: string, email: string) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredBookingAccess = {
    token,
    email,
    savedAt: new Date().toISOString(),
  };

  try {
    window.sessionStorage.setItem(BOOKING_ACCESS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore browser storage failures and fall back to manual email entry.
  }
};

export const getRememberedBookingAccess = (token: string): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(BOOKING_ACCESS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredBookingAccess>;
    if (parsed.token !== token || typeof parsed.email !== "string" || !parsed.email) {
      return null;
    }

    return parsed.email;
  } catch {
    return null;
  }
};

export const clearRememberedBookingAccess = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(BOOKING_ACCESS_STORAGE_KEY);
  } catch {
    // Ignore browser storage failures.
  }
};
