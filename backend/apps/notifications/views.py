from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.therapists.permissions import IsTherapistAuthenticated

from .models import Notification
from .serializers import NotificationSerializer


class TherapistNotificationListView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(therapist=request.user.therapist_profile)
        return Response(NotificationSerializer(notifications, many=True).data)


class MarkNotificationsReadView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    def post(self, request):
        Notification.objects.filter(therapist=request.user.therapist_profile, read=False).update(read=True)
        return Response({"success": True})


class NotificationDeleteView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    def delete(self, request, pk):
        notification = Notification.objects.filter(
            therapist=request.user.therapist_profile,
            pk=pk,
        ).first()
        if not notification:
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
