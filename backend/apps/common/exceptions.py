from __future__ import annotations

import logging

from django.db import DataError, DatabaseError, IntegrityError, InterfaceError, OperationalError, ProgrammingError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


logger = logging.getLogger(__name__)


def log_api_error(message: str, exc: Exception) -> None:
    logger.error(message, exc_info=(type(exc), exc, exc.__traceback__))


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        return response

    if isinstance(exc, ProgrammingError):
        log_api_error("Database schema error while handling API request", exc)
        return Response(
            {
                "detail": "The booking database schema is not up to date. Please run the latest migrations.",
                "code": "database_schema_error",
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    if isinstance(exc, (OperationalError, InterfaceError)):
        log_api_error("Database connection error while handling API request", exc)
        return Response(
            {
                "detail": "The booking service cannot reach the database right now. Please try again shortly.",
                "code": "database_unavailable",
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    if isinstance(exc, DataError):
        log_api_error("Database data error while handling API request", exc)
        return Response(
            {
                "detail": "The booking database needs the latest migration before this session can be saved.",
                "code": "database_data_error",
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    if isinstance(exc, IntegrityError):
        log_api_error("Database integrity error while handling API request", exc)
        return Response(
            {
                "detail": "The booking service could not save this session because the database rejected a required record.",
                "code": "database_integrity_error",
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    if isinstance(exc, DatabaseError):
        log_api_error("Database error while handling API request", exc)
        return Response(
            {
                "detail": "The booking service could not complete the database request.",
                "code": "database_error",
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    log_api_error("Unhandled API error", exc)
    return Response(
        {
            "detail": "The wellness API could not complete this request right now.",
            "code": "server_error",
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
