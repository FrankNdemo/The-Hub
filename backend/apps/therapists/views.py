import logging

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import ClientStory, TherapistProfile
from .permissions import IsTherapistAuthenticated
from .serializers import (
    ChangePasswordSerializer,
    ChangeSecretPassphraseSerializer,
    ClientStoryCreateSerializer,
    ClientStorySerializer,
    ClientStoryUpdateSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    TherapistProfilePublicSerializer,
    TherapistProfileUpdateSerializer,
    TherapistSessionSerializer,
    VerifyPassphraseSerializer,
    build_therapist_session,
)
from .password_reset import send_therapist_password_reset_email


logger = logging.getLogger(__name__)
PASSWORD_RESET_REQUEST_MESSAGE = (
    "If this email is registered, a password reset link has been sent. Please check your inbox."
)


def get_primary_therapist() -> TherapistProfile:
    return TherapistProfile.objects.select_related("user").filter(is_primary=True).first() or TherapistProfile.objects.select_related("user").first()


def can_review_client_stories(therapist: TherapistProfile) -> bool:
    return therapist.public_id == "caroline-gichia" or therapist.name.strip().lower() == "caroline gichia"


class PublicTherapistProfileView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        therapist = get_primary_therapist()
        if not therapist:
            return Response({"detail": "Therapist profile has not been created yet."}, status=status.HTTP_404_NOT_FOUND)
        return Response(TherapistProfilePublicSerializer(therapist).data)


class PublicTherapistListView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        therapists = TherapistProfile.objects.select_related("user").all()
        return Response(TherapistProfilePublicSerializer(therapists, many=True).data)


class PublicClientStoryListView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        stories = ClientStory.objects.filter(status=ClientStory.Status.PUBLISHED).select_related("therapist")
        return Response(ClientStorySerializer(stories, many=True).data)


class ClientStorySubmitView(APIView):
    permission_classes = []
    authentication_classes = []

    @transaction.atomic
    def post(self, request):
        serializer = ClientStoryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        therapist = get_primary_therapist()
        if not therapist:
            return Response({"detail": "Therapist profile has not been created yet."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        story = ClientStory.objects.create(therapist=therapist, **serializer.validated_data)

        from apps.notifications.models import Notification

        Notification.objects.create(
            therapist=therapist,
            type="inquiry",
            title=f"New story from {story.display_name}",
            description="You have a new client story ready to review.",
        )

        return Response(ClientStorySerializer(story).data, status=status.HTTP_201_CREATED)


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

        from apps.bookings.models import Booking
        from apps.bookings.serializers import BookingDetailSerializer

        therapist = authenticated_user.therapist_profile
        bookings = (
            Booking.objects.filter(
                therapist=therapist,
                deleted_at__isnull=True,
                status__in=[
                    Booking.Status.UPCOMING,
                    Booking.Status.PAYMENT_PENDING,
                    Booking.Status.RESCHEDULED,
                ],
            )
            .select_related("therapist")
            .prefetch_related("emails", "history", "payments")
        )

        refresh = RefreshToken.for_user(authenticated_user)
        response_payload = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "therapist": TherapistProfilePublicSerializer(therapist).data,
            "therapistSession": TherapistSessionSerializer(build_therapist_session(authenticated_user)).data,
            "bookings": BookingDetailSerializer(
                bookings,
                many=True,
                context={
                    "include_meet_link": True,
                    "include_therapist_links": True,
                    "include_email_records": True,
                },
            ).data,
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
        passphrase = serializer.validated_data["passphrase"]
        secret_matches = TherapistProfile.objects.filter(secret_passphrase_hash__gt="").iterator()
        if not any(profile.check_secret_passphrase(passphrase) for profile in secret_matches):
            return Response({"detail": "Passphrase not recognized."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"success": True, "email": therapist.email if therapist else ""})


class PasswordResetRequestView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].strip().lower()
        therapist = TherapistProfile.objects.select_related("user").filter(email__iexact=email).first()
        if therapist:
            try:
                send_therapist_password_reset_email(therapist)
            except Exception:
                logger.exception("Unable to send therapist password reset email.")

        return Response({"success": True, "detail": PASSWORD_RESET_REQUEST_MESSAGE})


class PasswordResetConfirmView(APIView):
    permission_classes = []
    authentication_classes = []

    @transaction.atomic
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_id = force_str(urlsafe_base64_decode(serializer.validated_data["uid"]))
            user = User.objects.select_related("therapist_profile").get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        token = serializer.validated_data["token"]
        if not user or not hasattr(user, "therapist_profile") or not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "This password reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        next_password = serializer.validated_data["nextPassword"]
        try:
            validate_password(next_password, user=user)
        except ValidationError as exc:
            return Response({"nextPassword": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(next_password)
        user.save(update_fields=["password"])
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
        from apps.bookings.models import Booking, BookingPayment
        from apps.bookings.retention import run_dashboard_retention_cleanup
        from apps.bookings.serializers import BookingDetailSerializer, BookingPaymentSerializer
        from apps.notifications.models import Notification
        from apps.notifications.serializers import NotificationSerializer

        therapist = request.user.therapist_profile
        run_dashboard_retention_cleanup(therapist=therapist)
        bookings = (
            Booking.objects.filter(
                therapist=therapist,
                deleted_at__isnull=True,
                status__in=[
                    Booking.Status.UPCOMING,
                    Booking.Status.PAYMENT_PENDING,
                    Booking.Status.RESCHEDULED,
                    Booking.Status.COMPLETED,
                ],
            )
            .select_related("therapist")
            .prefetch_related("emails", "history", "payments")
        )
        transactions = BookingPayment.objects.filter(booking__therapist=therapist, booking__deleted_at__isnull=True).select_related("booking")
        blog_posts = BlogPost.objects.select_related("author").all()
        client_stories = ClientStory.objects.filter(therapist=therapist) if can_review_client_stories(therapist) else []
        notifications = Notification.objects.filter(therapist=therapist)
        therapists = TherapistProfile.objects.select_related("user").all()

        return Response(
            {
                "blogPosts": BlogPostSerializer(blog_posts, many=True).data,
                "clientStories": ClientStorySerializer(client_stories, many=True).data,
                "bookings": BookingDetailSerializer(
                    bookings,
                    many=True,
                    context={
                        "include_meet_link": True,
                        "include_therapist_links": True,
                        "include_email_records": True,
                    },
                ).data,
                "transactions": BookingPaymentSerializer(transactions, many=True).data,
                "notifications": NotificationSerializer(notifications, many=True).data,
                "therapist": TherapistProfilePublicSerializer(therapist).data,
                "therapists": TherapistProfilePublicSerializer(therapists, many=True).data,
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


class TherapistProfileImageUploadView(APIView):
    permission_classes = [IsAuthenticated, IsTherapistAuthenticated]

    def post(self, request):
        image_file = request.FILES.get("image")
        
        if not image_file:
            return Response(
                {"detail": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file is an image
        if not image_file.content_type.startswith("image/"):
            return Response(
                {"detail": "Uploaded file must be an image."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert image to data URL
        import base64
        image_data = image_file.read()
        image_base64 = base64.b64encode(image_data).decode("utf-8")
        image_url = f"data:{image_file.content_type};base64,{image_base64}"
        
        # Update therapist profile with new image
        therapist = request.user.therapist_profile
        therapist.image_url = image_url
        therapist.save(update_fields=["image_url"])
        
        return Response({"image": image_url})


class DashboardClientStoryDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTherapistAuthenticated]

    def get_story(self, request, pk):
        if not can_review_client_stories(request.user.therapist_profile):
            return None

        story = ClientStory.objects.filter(
            therapist=request.user.therapist_profile,
            pk=pk,
        ).first()

        if not story:
            return None

        return story

    def patch(self, request, pk):
        if not can_review_client_stories(request.user.therapist_profile):
            return Response({"detail": "Story review is only available for Caroline Gichia."}, status=status.HTTP_403_FORBIDDEN)

        story = self.get_story(request, pk)
        if not story:
            return Response({"detail": "Story not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ClientStoryUpdateSerializer(story, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ClientStorySerializer(story).data)

    def delete(self, request, pk):
        if not can_review_client_stories(request.user.therapist_profile):
            return Response({"detail": "Story review is only available for Caroline Gichia."}, status=status.HTTP_403_FORBIDDEN)

        story = self.get_story(request, pk)
        if not story:
            return Response({"detail": "Story not found."}, status=status.HTTP_404_NOT_FOUND)

        story.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DashboardClientStoryPublishView(APIView):
    permission_classes = [IsAuthenticated, IsTherapistAuthenticated]

    def post(self, request, pk):
        if not can_review_client_stories(request.user.therapist_profile):
            return Response({"detail": "Story review is only available for Caroline Gichia."}, status=status.HTTP_403_FORBIDDEN)

        story = ClientStory.objects.filter(
            therapist=request.user.therapist_profile,
            pk=pk,
        ).first()

        if not story:
            return Response({"detail": "Story not found."}, status=status.HTTP_404_NOT_FOUND)

        story.status = ClientStory.Status.PUBLISHED
        story.published_at = timezone.now()
        story.save(update_fields=["status", "published_at", "updated_at"])
        return Response(ClientStorySerializer(story).data)


class DashboardClientStorySeenView(APIView):
    permission_classes = [IsAuthenticated, IsTherapistAuthenticated]

    def post(self, request, pk):
        if not can_review_client_stories(request.user.therapist_profile):
            return Response({"detail": "Story review is only available for Caroline Gichia."}, status=status.HTTP_403_FORBIDDEN)

        story = ClientStory.objects.filter(
            therapist=request.user.therapist_profile,
            pk=pk,
        ).first()

        if not story:
            return Response({"detail": "Story not found."}, status=status.HTTP_404_NOT_FOUND)

        if story.status != ClientStory.Status.PUBLISHED:
            story.status = ClientStory.Status.REVIEWED
            story.save(update_fields=["status", "updated_at"])

        return Response(ClientStorySerializer(story).data)


class DashboardClientStoryUnpublishView(APIView):
    permission_classes = [IsAuthenticated, IsTherapistAuthenticated]

    def post(self, request, pk):
        if not can_review_client_stories(request.user.therapist_profile):
            return Response({"detail": "Story review is only available for Caroline Gichia."}, status=status.HTTP_403_FORBIDDEN)

        story = ClientStory.objects.filter(
            therapist=request.user.therapist_profile,
            pk=pk,
        ).first()

        if not story:
            return Response({"detail": "Story not found."}, status=status.HTTP_404_NOT_FOUND)

        story.status = ClientStory.Status.REVIEWED
        story.published_at = None
        story.save(update_fields=["status", "published_at", "updated_at"])
        return Response(ClientStorySerializer(story).data)


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
