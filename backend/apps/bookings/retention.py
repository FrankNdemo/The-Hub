from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from apps.notifications.models import Notification

from .exploration import EXPLORATION_CALL_MARKER, LEGACY_EXPLORATION_PREFIX
from .models import Booking, BookingPayment


READ_NOTIFICATION_RETENTION = timedelta(hours=24)
EXPIRED_EXPLORATION_CALL_RETENTION = timedelta(days=7)
EXPIRED_SESSION_TRANSACTION_RETENTION = timedelta(days=30)


def _scheduled_before(prefix: str, cutoff):
    return Q(**{f"{prefix}date__lt": cutoff.date()}) | Q(
        **{f"{prefix}date": cutoff.date(), f"{prefix}time__lte": cutoff.time()}
    )


def _exploration_call_filter() -> Q:
    return Q(notes__istartswith=EXPLORATION_CALL_MARKER) | Q(notes__istartswith=LEGACY_EXPLORATION_PREFIX)


def delete_expired_exploration_calls(*, therapist=None, now=None) -> int:
    current_time = now or timezone.now()
    cutoff = timezone.localtime(current_time) - EXPIRED_EXPLORATION_CALL_RETENTION
    queryset = Booking.objects.filter(deleted_at__isnull=True).filter(_exploration_call_filter()).filter(_scheduled_before("", cutoff))

    if therapist is not None:
        queryset = queryset.filter(therapist=therapist)

    deleted_count, _ = queryset.delete()
    return deleted_count


def delete_expired_session_transactions(*, therapist=None, now=None) -> int:
    current_time = now or timezone.now()
    cutoff = timezone.localtime(current_time) - EXPIRED_SESSION_TRANSACTION_RETENTION
    queryset = (
        BookingPayment.objects.filter(booking__deleted_at__isnull=True)
        .exclude(booking__notes__istartswith=EXPLORATION_CALL_MARKER)
        .exclude(booking__notes__istartswith=LEGACY_EXPLORATION_PREFIX)
        .filter(_scheduled_before("booking__", cutoff))
    )

    if therapist is not None:
        queryset = queryset.filter(booking__therapist=therapist)

    deleted_count, _ = queryset.delete()
    return deleted_count


def delete_stale_read_notifications(*, therapist=None, now=None) -> int:
    current_time = now or timezone.now()
    cutoff = current_time - READ_NOTIFICATION_RETENTION
    queryset = Notification.objects.filter(read=True, updated_at__lte=cutoff)

    if therapist is not None:
        queryset = queryset.filter(therapist=therapist)

    deleted_count, _ = queryset.delete()
    return deleted_count


def run_dashboard_retention_cleanup(*, therapist=None, now=None) -> None:
    current_time = now or timezone.now()
    delete_expired_exploration_calls(therapist=therapist, now=current_time)
    delete_expired_session_transactions(therapist=therapist, now=current_time)
    delete_stale_read_notifications(therapist=therapist, now=current_time)
