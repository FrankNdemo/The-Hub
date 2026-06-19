import { describe, expect, it } from "vitest";

import { ApiError, clearStoredAuthTokens, getApiErrorMessage, getStoredAuthTokens, setStoredAuthTokens } from "./api";

describe("getApiErrorMessage", () => {
  it("shows a user-friendly network message", () => {
    expect(getApiErrorMessage(new Error("Failed to fetch"), "Fallback message.")).toBe(
      "Unable to reach our service. Please try again shortly.",
    );
  });

  it("hides frontend and backend implementation details", () => {
    const error = new ApiError(
      "This deployed frontend is missing VITE_API_BASE_URL. Point it to your backend /api/v1 URL, then confirm that origin is allowed in Django CORS.",
      500,
      {
        detail:
          "This deployed frontend is missing VITE_API_BASE_URL. Point it to your backend /api/v1 URL, then confirm that origin is allowed in Django CORS.",
      },
    );

    expect(getApiErrorMessage(error, "Fallback message.")).toBe(
      "Something went wrong while completing your request. Please try again shortly.",
    );
  });

  it("keeps useful validation messages from the backend", () => {
    const error = new ApiError("Please choose another available time.", 400, {
      detail: "Please choose another available time.",
    });

    expect(getApiErrorMessage(error, "Fallback message.")).toBe("Please choose another available time.");
  });

  it("uses the caller fallback for unexpected app errors", () => {
    expect(
      getApiErrorMessage(new Error("The booking response was incomplete."), "We could not confirm your booking."),
    ).toBe("We could not confirm your booking.");
  });
});

describe("therapist auth token storage", () => {
  it("keeps therapist tokens in memory only", () => {
    window.localStorage.setItem("wellness-auth-v1", "stale");
    window.sessionStorage.setItem("wellness-auth-v1", "stale");

    setStoredAuthTokens({ access: "access-token", refresh: "refresh-token" });

    expect(getStoredAuthTokens()).toEqual({ access: "access-token", refresh: "refresh-token" });
    expect(window.localStorage.getItem("wellness-auth-v1")).toBeNull();
    expect(window.sessionStorage.getItem("wellness-auth-v1")).toBeNull();

    clearStoredAuthTokens();

    expect(getStoredAuthTokens()).toBeNull();
  });
});
