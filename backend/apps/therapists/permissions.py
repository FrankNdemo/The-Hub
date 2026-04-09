from rest_framework.permissions import BasePermission


class IsTherapistAuthenticated(BasePermission):
    message = "Therapist authentication is required."

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and hasattr(request.user, "therapist_profile"))
