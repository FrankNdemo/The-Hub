from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.therapists.permissions import IsTherapistAuthenticated

from .models import Booking
from .serializers import BookingCreateSerializer, BookingDetailSerializer, BookingRescheduleSerializer
from .services import cancel_booking, complete_booking, create_booking, reschedule_booking


class PublicBookingCreateView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = create_booking(
            therapist=serializer.validated_data["therapist"],
            data=serializer.validated_data,
        )
        return Response(BookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED)


class BookingManageDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        booking = generics.get_object_or_404(
            Booking.objects.select_related("therapist").prefetch_related("emails", "history"),
            manage_token=token,
        )
        return Response(BookingDetailSerializer(booking).data)


class BookingManageRescheduleView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, token):
        serializer = BookingRescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = generics.get_object_or_404(
            Booking.objects.select_related("therapist").prefetch_related("emails", "history"),
            manage_token=token,
        )
        try:
            updated_booking = reschedule_booking(
                booking=booking,
                date=serializer.validated_data["date"],
                time=serializer.validated_data["time"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(BookingDetailSerializer(updated_booking).data)


class BookingManageCancelView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, token):
        booking = generics.get_object_or_404(
            Booking.objects.select_related("therapist").prefetch_related("emails", "history"),
            manage_token=token,
        )
        try:
            updated_booking = cancel_booking(booking=booking)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(BookingDetailSerializer(updated_booking).data)


class TherapistBookingListView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    def get(self, request):
        bookings = (
            Booking.objects.filter(therapist=request.user.therapist_profile)
            .select_related("therapist")
            .prefetch_related("emails", "history")
        )
        return Response(BookingDetailSerializer(bookings, many=True).data)


class TherapistBookingCompleteView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    def post(self, request, pk):
        booking = generics.get_object_or_404(
            Booking.objects.select_related("therapist").prefetch_related("emails", "history"),
            pk=pk,
            therapist=request.user.therapist_profile,
        )
        try:
            updated_booking = complete_booking(booking=booking)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(BookingDetailSerializer(updated_booking).data)
