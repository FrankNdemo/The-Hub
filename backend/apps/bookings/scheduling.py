from __future__ import annotations

from dataclasses import dataclass
from datetime import date as date_type
from datetime import datetime, time as time_type, timedelta
from zoneinfo import ZoneInfo

from django.conf import settings
from django.utils import timezone

from .models import Booking


WORKING_WEEKDAYS = {1, 2, 3, 4, 5}  # Tuesday to Saturday
SUGGESTION_LOOKAHEAD_DAYS = 21
MAX_SUGGESTED_SLOTS = 3


@dataclass(frozen=True)
class BookingSlotSuggestion:
    date: date_type
    time: time_type

    @property
    def label(self) -> str:
        return f"{format_date_for_humans(self.date)} at {format_time_for_humans(self.time)}"

    def serialize(self) -> dict[str, str]:
        return {
            "date": self.date.isoformat(),
            "time": self.time.strftime("%H:%M"),
            "label": self.label,
        }


class BookingAvailabilityError(ValueError):
    def __init__(
        self,
        detail: str,
        *,
        code: str,
        status_code: int = 400,
        suggested_slots: list[BookingSlotSuggestion] | None = None,
        day_fully_booked: bool = False,
    ) -> None:
        super().__init__(detail)
        self.detail = detail
        self.code = code
        self.status_code = status_code
        self.suggested_slots = suggested_slots or []
        self.day_fully_booked = day_fully_booked

    def as_response(self) -> dict[str, object]:
        payload: dict[str, object] = {
            "detail": self.detail,
            "code": self.code,
            "dayFullyBooked": self.day_fully_booked,
        }

        if self.suggested_slots:
            payload["suggestedDate"] = self.suggested_slots[0].date.isoformat()
            payload["suggestedTime"] = self.suggested_slots[0].time.strftime("%H:%M")
            payload["suggestedOptions"] = [slot.serialize() for slot in self.suggested_slots]

        return payload


def get_local_timezone() -> ZoneInfo:
    return ZoneInfo(settings.TIME_ZONE)


def get_open_time() -> time_type:
    return time_type(hour=settings.BOOKING_OPEN_HOUR, minute=0)


def get_close_time() -> time_type:
    return time_type(hour=settings.BOOKING_CLOSE_HOUR, minute=0)


def get_booking_duration() -> timedelta:
    return timedelta(minutes=settings.BOOKING_DURATION_MINUTES)


def get_slot_interval() -> timedelta:
    return timedelta(minutes=settings.BOOKING_SLOT_INTERVAL_MINUTES)


def get_slot_interval_seconds() -> int:
    return max(1, int(get_slot_interval().total_seconds()))


def as_local_datetime(day: date_type, slot_time: time_type) -> datetime:
    return datetime.combine(day, slot_time).replace(tzinfo=get_local_timezone())


def get_opening_datetime(day: date_type) -> datetime:
    return as_local_datetime(day, get_open_time())


def get_closing_datetime(day: date_type) -> datetime:
    return as_local_datetime(day, get_close_time())


def get_latest_start_datetime(day: date_type) -> datetime:
    return get_closing_datetime(day) - get_booking_duration()


def normalize_slot_time(slot_time: time_type) -> time_type:
    return slot_time.replace(second=0, microsecond=0)


def format_time_for_humans(slot_time: time_type) -> str:
    return normalize_slot_time(slot_time).strftime("%I:%M %p").lstrip("0")


def format_date_for_humans(day: date_type) -> str:
    return day.strftime("%A, %B %d, %Y").replace(" 0", " ")


def get_operating_hours_label() -> str:
    latest_start = get_latest_start_datetime(timezone.localdate()).time().replace(second=0, microsecond=0)
    return (
        f"Tuesday to Saturday between {format_time_for_humans(get_open_time())} and "
        f"{format_time_for_humans(get_close_time())}, with the last {settings.BOOKING_DURATION_MINUTES}-minute "
        f"session starting at {format_time_for_humans(latest_start)}"
    )


def is_booking_day_open(day: date_type) -> bool:
    return day.weekday() in WORKING_WEEKDAYS


def is_future_slot(start_at: datetime) -> bool:
    return start_at > timezone.localtime()


def align_to_slot_boundary(candidate: datetime) -> datetime:
    opening = get_opening_datetime(candidate.date())
    if candidate <= opening:
        return opening

    interval_seconds = get_slot_interval_seconds()
    elapsed_seconds = int((candidate - opening).total_seconds())
    remainder = elapsed_seconds % interval_seconds
    if remainder:
        candidate += timedelta(seconds=interval_seconds - remainder)

    return candidate.replace(second=0, microsecond=0)


def get_bookings_for_day(*, therapist, day: date_type, exclude_booking: Booking | None = None) -> list[Booking]:
    queryset = Booking.objects.filter(
        therapist=therapist,
        date=day,
        deleted_at__isnull=True,
    ).exclude(
        status__in=[
            Booking.Status.CANCELLED,
            Booking.Status.COMPLETED,
            Booking.Status.PAYMENT_FAILED,
        ]
    )

    if exclude_booking:
        queryset = queryset.exclude(pk=exclude_booking.pk)

    current_time = timezone.now()
    return [
        booking
        for booking in queryset
        if (
            booking.status == Booking.Status.PAYMENT_PENDING
            and booking.has_active_payment_hold(current_time)
        )
        or (
            booking.status != Booking.Status.PAYMENT_PENDING
            and booking.confirmed_at is not None
        )
    ]


def overlaps_existing_booking(
    *,
    therapist,
    day: date_type,
    slot_time: time_type,
    exclude_booking: Booking | None = None,
    day_bookings: list[Booking] | None = None,
) -> bool:
    requested_start = as_local_datetime(day, normalize_slot_time(slot_time))
    requested_end = requested_start + get_booking_duration()
    bookings = day_bookings if day_bookings is not None else get_bookings_for_day(
        therapist=therapist,
        day=day,
        exclude_booking=exclude_booking,
    )

    for existing in bookings:
        existing_start = as_local_datetime(existing.date, existing.time)
        existing_end = existing_start + get_booking_duration()
        if requested_start < existing_end and requested_end > existing_start:
            return True

    return False


def find_live_booking_for_client(*, client_email: str, exclude_booking: Booking | None = None) -> Booking | None:
    queryset = (
        Booking.objects.select_related("therapist")
        .filter(
            client_email__iexact=client_email.strip(),
            deleted_at__isnull=True,
            status__in=[
                Booking.Status.UPCOMING,
                Booking.Status.RESCHEDULED,
                Booking.Status.PAYMENT_PENDING,
            ],
        )
        .order_by("date", "time")
    )

    if exclude_booking:
        queryset = queryset.exclude(pk=exclude_booking.pk)

    now_local = timezone.localtime()
    for booking in queryset:
        if booking.status == Booking.Status.PAYMENT_PENDING:
            if booking.has_active_payment_hold():
                return booking
            continue

        if booking.confirmed_at is None:
            continue

        booking_end = as_local_datetime(booking.date, booking.time) + get_booking_duration()
        if booking_end > now_local:
            return booking

    return None


def ensure_client_can_book(*, client_email: str, exclude_booking: Booking | None = None) -> None:
    existing_booking = find_live_booking_for_client(client_email=client_email, exclude_booking=exclude_booking)
    if not existing_booking:
        return

    raise BookingAvailabilityError(
        (
            "You already have an active session booked for "
            f"{format_date_for_humans(existing_booking.date)} at {format_time_for_humans(existing_booking.time)}. "
            "Please use the private link from your confirmation email to reschedule it, or wait until it has ended "
            "before booking another session."
        ),
        code="active_session_exists",
        status_code=409,
    )


def get_suggested_slots(
    *,
    therapist,
    requested_date: date_type,
    requested_time: time_type,
    exclude_booking: Booking | None = None,
    limit: int = MAX_SUGGESTED_SLOTS,
) -> list[BookingSlotSuggestion]:
    suggestions: list[BookingSlotSuggestion] = []
    requested_start = as_local_datetime(requested_date, normalize_slot_time(requested_time))

    for day_offset in range(SUGGESTION_LOOKAHEAD_DAYS):
        day = requested_date + timedelta(days=day_offset)
        if not is_booking_day_open(day):
            continue

        opening = get_opening_datetime(day)
        latest_start = get_latest_start_datetime(day)
        candidate = opening if day_offset else align_to_slot_boundary(max(requested_start, opening))
        day_bookings = get_bookings_for_day(therapist=therapist, day=day, exclude_booking=exclude_booking)

        while candidate <= latest_start:
            slot_time = candidate.time().replace(tzinfo=None, second=0, microsecond=0)
            if is_future_slot(candidate) and not overlaps_existing_booking(
                therapist=therapist,
                day=day,
                slot_time=slot_time,
                exclude_booking=exclude_booking,
                day_bookings=day_bookings,
            ):
                suggestions.append(BookingSlotSuggestion(date=day, time=slot_time))
                if len(suggestions) >= limit:
                    return suggestions

            candidate += get_slot_interval()

    return suggestions


def ensure_slot_is_available(*, therapist, day: date_type, slot_time: time_type, exclude_booking: Booking | None = None) -> None:
    cleaned_time = normalize_slot_time(slot_time)
    requested_start = as_local_datetime(day, cleaned_time)
    requested_end = requested_start + get_booking_duration()
    suggestions = get_suggested_slots(
        therapist=therapist,
        requested_date=day,
        requested_time=cleaned_time,
        exclude_booking=exclude_booking,
    )
    suggestion_text = f" The next available session is {suggestions[0].label}." if suggestions else ""

    if day < timezone.localdate() or not is_future_slot(requested_start):
        raise BookingAvailabilityError(
            f"Please choose a future session time.{suggestion_text}",
            code="past_slot",
            suggested_slots=suggestions,
        )

    if not is_booking_day_open(day):
        raise BookingAvailabilityError(
            f"We schedule sessions {get_operating_hours_label()}.{suggestion_text}",
            code="closed_day",
            suggested_slots=suggestions,
        )

    if requested_start < get_opening_datetime(day) or requested_end > get_closing_datetime(day):
        raise BookingAvailabilityError(
            f"Please choose a session time within {get_operating_hours_label()}.{suggestion_text}",
            code="outside_hours",
            suggested_slots=suggestions,
        )

    if overlaps_existing_booking(
        therapist=therapist,
        day=day,
        slot_time=cleaned_time,
        exclude_booking=exclude_booking,
    ):
        same_day_suggestions = [slot for slot in suggestions if slot.date == day]
        day_fully_booked = not same_day_suggestions
        detail = (
            f"{format_date_for_humans(day)} is fully booked.{suggestion_text}"
            if day_fully_booked
            else f"{format_time_for_humans(cleaned_time)} on {format_date_for_humans(day)} is already booked.{suggestion_text}"
        )
        raise BookingAvailabilityError(
            detail,
            code="day_full" if day_fully_booked else "slot_unavailable",
            status_code=409,
            suggested_slots=suggestions,
            day_fully_booked=day_fully_booked,
        )
