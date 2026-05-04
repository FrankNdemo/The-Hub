import { describe, expect, it } from "vitest";

import { ApiError, getApiErrorMessage } from "./api";

describe("getApiErrorMessage", () => {
  it("shows a user-friendly network message", () => {
    expect(getApiErrorMessage(new Error("Failed to fetch"), "Fallback message.")).toBe(
      "Unable to reach our service. Check your internet connection and try again.",
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
