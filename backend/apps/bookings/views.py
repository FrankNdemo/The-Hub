from django.conf import settings
from django.utils.crypto import constant_time_compare
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.therapists.permissions import IsTherapistAuthenticated

from .models import Booking
from .serializers import (
    BookingAccessSerializer,
    BookingCreateSerializer,
    BookingDeleteSerializer,
    BookingDetailSerializer,
    BookingJoinSerializer,
    BookingRescheduleSerializer,
)
from .delivery import BookingDeliveryError
from .services import (
    cancel_booking,
    complete_booking,
    create_booking,
    delete_booking,
    reschedule_booking,
    send_upcoming_session_reminders,
)
from .scheduling import BookingAvailabilityError


def normalize_email(value: str) -> str:
    return value.strip().lower()


def client_email_matches(booking: Booking, email: str) -> bool:
    return normalize_email(booking.client_email) == normalize_email(email)


def access_denied_response() -> Response:
    return Response(
        {
            "detail": "Please enter the email address used to book this session.",
            "code": "booking_email_required",
        },
        status=status.HTTP_403_FORBIDDEN,
    )


def get_public_booking(token: str) -> Booking:
    return generics.get_object_or_404(
        Booking.objects.select_related("therapist").prefetch_related("emails", "history"),
        manage_token=token,
        deleted_at__isnull=True,
    )


class PublicBookingCreateView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            booking = create_booking(
                therapist=serializer.validated_data["therapist"],
                data=serializer.validated_data,
            )
        except BookingAvailabilityError as exc:
            return Response(exc.as_response(), status=exc.status_code)
        except BookingDeliveryError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response(BookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED)


class BookingManageDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        get_public_booking(token)
        return access_denied_response()

    def post(self, request, token):
        serializer = BookingAccessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = get_public_booking(token)

        if not client_email_matches(booking, serializer.validated_data["email"]):
            return access_denied_response()

        return Response(BookingDetailSerializer(booking).data)


class BookingJoinDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        get_public_booking(token)
        return access_denied_response()

    def post(self, request, token):
        serializer = BookingAccessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = get_public_booking(token)

        if not client_email_matches(booking, serializer.validated_data["email"]):
            return access_denied_response()

        return Response(BookingJoinSerializer(booking, context={"access_verified": True}).data)


class BookingManageRescheduleView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, token):
        serializer = BookingRescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = get_public_booking(token)

        if not client_email_matches(booking, serializer.validated_data["clientEmail"]):
            return access_denied_response()

        try:
            updated_booking = reschedule_booking(
                booking=booking,
                date=serializer.validated_data["date"],
                time=serializer.validated_data["time"],
            )
        except BookingAvailabilityError as exc:
            return Response(exc.as_response(), status=exc.status_code)
        except BookingDeliveryError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(BookingDetailSerializer(updated_booking).data)


class BookingManageCancelView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, token):
        serializer = BookingAccessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = get_public_booking(token)

        if not client_email_matches(booking, serializer.validated_data["email"]):
            return access_denied_response()

        try:
            updated_booking = cancel_booking(booking=booking)
        except BookingDeliveryError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(BookingDetailSerializer(updated_booking).data)


class TherapistBookingListView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    def get(self, request):
        bookings = (
            Booking.objects.filter(therapist=request.user.therapist_profile, deleted_at__isnull=True)
            .select_related("therapist")
            .prefetch_related("emails", "history")
        )
        return Response(
            BookingDetailSerializer(
                bookings,
                many=True,
                context={
                    "include_meet_link": True,
                    "include_therapist_links": True,
                    "include_email_records": True,
                },
            ).data
        )


class TherapistBookingCompleteView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    def post(self, request, pk):
        booking = generics.get_object_or_404(
            Booking.objects.select_related("therapist").prefetch_related("emails", "history"),
            pk=pk,
            therapist=request.user.therapist_profile,
            deleted_at__isnull=True,
        )
        try:
            updated_booking = complete_booking(booking=booking)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(BookingDetailSerializer(updated_booking).data)


class TherapistBookingDeleteView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    def post(self, request, pk):
        serializer = BookingDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking = generics.get_object_or_404(
            Booking.objects.select_related("therapist").prefetch_related("emails", "history"),
            pk=pk,
            therapist=request.user.therapist_profile,
            deleted_at__isnull=True,
        )
        try:
            delete_booking(booking=booking, reason=serializer.validated_data["reason"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"success": True}, status=status.HTTP_200_OK)


class BookingReminderRunView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        expected = f"Bearer {settings.CRON_SECRET}" if settings.CRON_SECRET else ""
        provided = request.headers.get("Authorization", "")

        if not expected or not constant_time_compare(provided, expected):
            return Response({"detail": "Unauthorized reminder run."}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(send_upcoming_session_reminders())
