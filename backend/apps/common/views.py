from django.db import connection
from django.db.utils import DatabaseError
from rest_framework.response import Response
from rest_framework.views import APIView


def build_health_payload() -> dict[str, object]:
    return {"status": "ok"}


class HealthCheckView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        payload = build_health_payload()

        if request.query_params.get("database") not in {"1", "true"}:
            return Response(payload)

        try:
            with connection.cursor() as cursor:
                cursor.execute("select 1")
                cursor.fetchone()
        except DatabaseError:
            return Response(
                {
                    "status": "degraded",
                    "database": "unavailable",
                    "detail": "The API is running, but the database connection failed.",
                },
                status=503,
            )

        payload["database"] = "ok"
        return Response(payload)
