from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import TherapistProfile
from .permissions import IsTherapistAuthenticated
from .serializers import (
    ChangePasswordSerializer,
    ChangeSecretPassphraseSerializer,
    LoginSerializer,
    ResetPasswordSerializer,
    TherapistProfilePublicSerializer,
    TherapistProfileUpdateSerializer,
    TherapistSessionSerializer,
    VerifyPassphraseSerializer,
    build_therapist_session,
)


def get_primary_therapist() -> TherapistProfile:
    return TherapistProfile.objects.select_related("user").filter(is_primary=True).first() or TherapistProfile.objects.select_related("user").first()


class PublicTherapistProfileView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        therapist = get_primary_therapist()
        if not therapist:
            return Response({"detail": "Therapist profile has not been created yet."}, status=status.HTTP_404_NOT_FOUND)
        return Response(TherapistProfilePublicSerializer(therapist).data)


class TherapistLoginView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].strip().lower()
        password = serializer.validated_data["password"]

        try:
            user = User.objects.select_related("therapist_profile").get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"detail": "Incorrect therapist credentials."}, status=status.HTTP_400_BAD_REQUEST)

        authenticated_user = authenticate(request=request, username=user.username, password=password)
        if not authenticated_user or not hasattr(authenticated_user, "therapist_profile"):
            return Response({"detail": "Incorrect therapist credentials."}, status=status.HTTP_400_BAD_REQUEST)

        authenticated_user.last_login = timezone.now()
        authenticated_user.save(update_fields=["last_login"])

        refresh = RefreshToken.for_user(authenticated_user)
        response_payload = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "therapist": TherapistProfilePublicSerializer(authenticated_user.therapist_profile).data,
            "therapistSession": TherapistSessionSerializer(build_therapist_session(authenticated_user)).data,
        }
        return Response(response_payload, status=status.HTTP_200_OK)


class TherapistLogoutView(APIView):
    permission_classes = [IsAuthenticated, IsTherapistAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VerifyPassphraseView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        serializer = VerifyPassphraseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        therapist = get_primary_therapist()
        if not therapist or not therapist.check_secret_passphrase(serializer.validated_data["passphrase"]):
            return Response({"detail": "Passphrase not recognized."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"success": True, "email": therapist.email})


class ResetPasswordView(APIView):
    permission_classes = []
    authentication_classes = []

    @transaction.atomic
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].strip().lower()
        secret = serializer.validated_data["secretPassphrase"]
        next_password = serializer.validated_data["nextPassword"]

        try:
            therapist = TherapistProfile.objects.select_related("user").get(email__iexact=email)
        except TherapistProfile.DoesNotExist:
            return Response({"detail": "That email does not match the therapist account."}, status=status.HTTP_400_BAD_REQUEST)

        if not therapist.check_secret_passphrase(secret):
            return Response({"detail": "Secret passphrase not recognized."}, status=status.HTTP_400_BAD_REQUEST)

        therapist.user.set_password(next_password)
        therapist.user.save(update_fields=["password"])
        return Response({"success": True})


class TherapistMeView(APIView):
    permission_classes = [IsAuthenticated, IsTherapistAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                "therapist": TherapistProfilePublicSerializer(user.therapist_profile).data,
                "therapistSession": TherapistSessionSerializer(build_therapist_session(user)).data,
            }
        )


class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsTherapistAuthenticated]

    def get(self, request):
        from apps.blog.models import BlogPost
        from apps.blog.serializers import BlogPostSerializer
        from apps.bookings.models import Booking
        from apps.bookings.serializers import BookingDetailSerializer
        from apps.notifications.models import Notification
        from apps.notifications.serializers import NotificationSerializer

        therapist = request.user.therapist_profile
        bookings = (
            Booking.objects.filter(therapist=therapist)
            .select_related("therapist")
            .prefetch_related("emails", "history")
        )
        blog_posts = BlogPost.objects.select_related("author").all()
        notifications = Notification.objects.filter(therapist=therapist)

        return Response(
            {
                "blogPosts": BlogPostSerializer(blog_posts, many=True).data,
                "bookings": BookingDetailSerializer(bookings, many=True).data,
                "notifications": NotificationSerializer(notifications, many=True).data,
                "therapist": TherapistProfilePublicSerializer(therapist).data,
                "therapistSession": TherapistSessionSerializer(build_therapist_session(request.user)).data,
            }
        )


class TherapistProfileDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTherapistAuthenticated]

    def get(self, request):
        return Response(TherapistProfilePublicSerializer(request.user.therapist_profile).data)

    def patch(self, request):
        serializer = TherapistProfileUpdateSerializer(
            request.user.therapist_profile,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TherapistProfilePublicSerializer(request.user.therapist_profile).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated, IsTherapistAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        current_password = serializer.validated_data["currentPassword"]
        next_password = serializer.validated_data["nextPassword"]

        if not request.user.check_password(current_password):
            return Response({"detail": "Your current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(next_password)
        request.user.save(update_fields=["password"])
        return Response({"success": True})


class ChangeSecretPassphraseView(APIView):
    permission_classes = [IsAuthenticated, IsTherapistAuthenticated]

    def post(self, request):
        serializer = ChangeSecretPassphraseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        therapist = request.user.therapist_profile
        current_secret = serializer.validated_data["currentSecretPassphrase"]
        next_secret = serializer.validated_data["nextSecretPassphrase"]

        if not therapist.check_secret_passphrase(current_secret):
            return Response({"detail": "Your current secret passphrase is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        therapist.set_secret_passphrase(next_secret)
        therapist.save(update_fields=["secret_passphrase_hash", "updated_at"])
        return Response({"success": True})


class TherapistTokenRefreshView(TokenRefreshView):
    permission_classes = []
    authentication_classes = []
