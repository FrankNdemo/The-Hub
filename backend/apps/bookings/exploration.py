from __future__ import annotations

from .models import Booking


EXPLORATION_CALL_MARKER = "[exploration-call]"
LEGACY_EXPLORATION_PREFIX = "exploration call request."
EXPLORATION_CALL_LABEL = "Exploration Call"
EXPLORATION_CALL_CLIENT_LOCATION_SUMMARY = (
    "The therapist will review your request and reach out directly using your phone number or email."
)


def is_exploration_call_notes(notes: str | None) -> bool:
    trimmed = (notes or "").strip().lower()
    return trimmed.startswith(EXPLORATION_CALL_MARKER) or trimmed.startswith(LEGACY_EXPLORATION_PREFIX)


def is_exploration_call(booking: Booking) -> bool:
    return is_exploration_call_notes(booking.notes)


def get_public_booking_notes(notes: str | None) -> str:
    trimmed = (notes or "").strip()

    if trimmed.lower().startswith(EXPLORATION_CALL_MARKER):
        trimmed = trimmed[len(EXPLORATION_CALL_MARKER) :].strip()

    return trimmed
