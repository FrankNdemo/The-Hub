from django.db import DataError, OperationalError, ProgrammingError
from django.test import SimpleTestCase

from .exceptions import api_exception_handler


class ApiExceptionHandlerTests(SimpleTestCase):
    def test_database_connection_errors_return_json_response(self):
        with self.assertLogs("apps.common.exceptions", level="ERROR"):
            response = api_exception_handler(OperationalError("connection failed"), {})

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["code"], "database_unavailable")

    def test_database_schema_errors_return_json_response(self):
        with self.assertLogs("apps.common.exceptions", level="ERROR"):
            response = api_exception_handler(ProgrammingError("missing column"), {})

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["code"], "database_schema_error")

    def test_database_data_errors_return_migration_guidance(self):
        with self.assertLogs("apps.common.exceptions", level="ERROR"):
            response = api_exception_handler(DataError("value too long for type character varying(200)"), {})

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["code"], "database_data_error")
