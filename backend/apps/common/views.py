from django.db import connection
from django.db.utils import DatabaseError
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        if request.query_params.get("database") not in {"1", "true"}:
            return Response({"status": "ok"})

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

        return Response({"status": "ok", "database": "ok"})
