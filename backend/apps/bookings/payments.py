from __future__ import annotations

import base64
import json
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from urllib import error as urllib_error
from urllib import request as urllib_request

from django.conf import settings
from django.utils import timezone

from .models import Booking, BookingPayment


SANDBOX_BASE_URL = "https://sandbox.safaricom.co.ke"
PRODUCTION_BASE_URL = "https://api.safaricom.co.ke"


class BookingPaymentError(Exception):
    def __init__(self, detail: str, *, code: str = "payment_error") -> None:
        super().__init__(detail)
        self.detail = detail
        self.code = code


@dataclass(frozen=True)
class MpesaStkPushResponse:
    merchant_request_id: str
    checkout_request_id: str
    raw: dict[str, object]


@dataclass(frozen=True)
class MpesaQueryResponse:
    is_final: bool
    result_code: str
    result_description: str
    raw: dict[str, object]
    metadata: dict[str, object]


def normalize_mpesa_phone_number(value: str) -> str:
    digits = "".join(character for character in value if character.isdigit())

    if digits.startswith("0") and len(digits) == 10:
        digits = f"254{digits[1:]}"
    elif digits.startswith(("1", "7")) and len(digits) == 9:
        digits = f"254{digits}"

    if len(digits) != 12 or not digits.startswith(("2541", "2547")):
        raise BookingPaymentError(
            "Enter a valid Safaricom M-Pesa number in the format 07XX XXX XXX or 01XX XXX XXX.",
            code="invalid_mpesa_phone",
        )

    return digits


def get_mpesa_base_url() -> str:
    configured_base_url = settings.MPESA_BASE_URL.strip()
    if configured_base_url:
        return configured_base_url.rstrip("/")

    if settings.MPESA_ENVIRONMENT == "production":
        return PRODUCTION_BASE_URL

    return SANDBOX_BASE_URL


def get_mpesa_timestamp(now=None) -> str:
    return timezone.localtime(now or timezone.now()).strftime("%Y%m%d%H%M%S")


def get_mpesa_password(timestamp: str) -> str:
    secret = f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}".encode("utf-8")
    return base64.b64encode(secret).decode("utf-8")


def get_account_reference(booking: Booking) -> str:
    configured_reference = settings.MPESA_ACCOUNT_REFERENCE.strip()
    if configured_reference:
        return configured_reference[:64]

    return f"THE HUB {booking.manage_token[:8]}".strip()[:64]


def get_transaction_description(booking: Booking) -> str:
    return (
        f"{booking.therapist_name_snapshot} booking fee for "
        f"{booking.date.isoformat()} at {booking.time.strftime('%H:%M')}"
    )[:180]


def build_request_headers(access_token: str) -> dict[str, str]:
    return {
        "Accept": "application/json",
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }


def parse_json_response(response) -> dict[str, object]:
    body = response.read().decode("utf-8")
    if not body.strip():
        return {}
    return json.loads(body)


def get_missing_mpesa_configuration_fields() -> list[str]:
    missing_fields: list[str] = []
    required_fields = [
        ("MPESA_CONSUMER_KEY", settings.MPESA_CONSUMER_KEY),
        ("MPESA_CONSUMER_SECRET", settings.MPESA_CONSUMER_SECRET),
        ("MPESA_SHORTCODE (or MPESA_BUSINESS_SHORTCODE)", settings.MPESA_SHORTCODE),
        ("MPESA_PASSKEY", settings.MPESA_PASSKEY),
        ("MPESA_CALLBACK_URL", settings.MPESA_CALLBACK_URL),
    ]

    for label, value in required_fields:
        if not str(value).strip():
            missing_fields.append(label)

    return missing_fields


def raise_for_missing_mpesa_configuration() -> None:
    missing_fields = get_missing_mpesa_configuration_fields()
    if not missing_fields:
        return

    raise BookingPaymentError(
        "M-Pesa is missing required Daraja configuration values: " + ", ".join(missing_fields) + ".",
        code="mpesa_not_configured",
    )


def request_json(url: str, *, method: str = "GET", headers: dict[str, str] | None = None, payload=None) -> dict[str, object]:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib_request.Request(url, data=body, headers=headers or {}, method=method)

    try:
        with urllib_request.urlopen(request, timeout=settings.MPESA_TIMEOUT_SECONDS) as response:
            return parse_json_response(response)
    except urllib_error.HTTPError as exc:
        try:
            payload = parse_json_response(exc)
        except Exception:
            payload = {"detail": exc.reason}

        message = payload.get("errorMessage") or payload.get("detail") or payload.get("ResponseDescription") or str(exc)
        raise BookingPaymentError(str(message), code="mpesa_http_error") from exc
    except urllib_error.URLError as exc:
        raise BookingPaymentError("M-Pesa is temporarily unavailable. Please check your connection and try again.") from exc


def get_access_token() -> str:
    raise_for_missing_mpesa_configuration()
    consumer_key = settings.MPESA_CONSUMER_KEY.strip()
    consumer_secret = settings.MPESA_CONSUMER_SECRET.strip()

    token_url = f"{get_mpesa_base_url()}/oauth/v1/generate?grant_type=client_credentials"
    credentials = base64.b64encode(f"{consumer_key}:{consumer_secret}".encode("utf-8")).decode("utf-8")
    payload = request_json(
        token_url,
        headers={
            "Accept": "application/json",
            "Authorization": f"Basic {credentials}",
        },
    )
    access_token = payload.get("access_token")

    if not isinstance(access_token, str) or not access_token:
        raise BookingPaymentError("M-Pesa did not return an access token.", code="mpesa_auth_failed")

    return access_token


def simulate_checkout_request_id() -> str:
    return f"ws_CO_{secrets.token_hex(10)}"


def simulate_merchant_request_id() -> str:
    return f"mr_{secrets.token_hex(8)}"


def initiate_simulated_stk_push(booking: Booking, phone_number: str) -> MpesaStkPushResponse:
    checkout_request_id = simulate_checkout_request_id()
    merchant_request_id = simulate_merchant_request_id()
    response = {
        "MerchantRequestID": merchant_request_id,
        "CheckoutRequestID": checkout_request_id,
        "ResponseCode": "0",
        "ResponseDescription": "Success. Request accepted for processing",
        "CustomerMessage": "Success. Request accepted for processing",
        "mode": "simulation",
        "phoneNumber": phone_number,
    }
    return MpesaStkPushResponse(
        merchant_request_id=merchant_request_id,
        checkout_request_id=checkout_request_id,
        raw=response,
    )


def get_simulated_outcome(phone_number: str) -> tuple[str, str]:
    if phone_number.endswith("111"):
        return BookingPayment.Status.CANCELLED, "Payment cancelled on the phone."
    if phone_number.endswith("222"):
        return BookingPayment.Status.TIMED_OUT, "The STK prompt timed out before completion."
    if phone_number.endswith("333"):
        return BookingPayment.Status.INSUFFICIENT_FUNDS, "The M-Pesa wallet has insufficient funds."
    return BookingPayment.Status.SUCCESS, "The transaction completed successfully."


def build_simulated_metadata(payment: BookingPayment) -> dict[str, object]:
    return {
        "Amount": float(payment.amount),
        "MpesaReceiptNumber": f"THB{timezone.now().strftime('%H%M%S')}{payment.phone_number[-3:]}",
        "PhoneNumber": payment.phone_number,
        "TransactionDate": int(timezone.localtime().strftime("%Y%m%d%H%M%S")),
    }


def query_simulated_stk_push(payment: BookingPayment) -> MpesaQueryResponse:
    elapsed = timezone.now() - payment.created_at

    if elapsed < timedelta(seconds=6):
        return MpesaQueryResponse(
            is_final=False,
            result_code="",
            result_description="The payment is still awaiting customer action.",
            raw={
                "ResponseCode": "0",
                "ResponseDescription": "The transaction is being processed.",
                "CheckoutRequestID": payment.checkout_request_id or "",
                "ResultCode": "",
                "mode": "simulation",
            },
            metadata={},
        )

    status, description = get_simulated_outcome(payment.phone_number)
    result_code_map = {
        BookingPayment.Status.SUCCESS: "0",
        BookingPayment.Status.CANCELLED: "1032",
        BookingPayment.Status.TIMED_OUT: "1037",
        BookingPayment.Status.INSUFFICIENT_FUNDS: "1",
    }
    metadata = build_simulated_metadata(payment) if status == BookingPayment.Status.SUCCESS else {}

    return MpesaQueryResponse(
        is_final=True,
        result_code=result_code_map.get(status, "9999"),
        result_description=description,
        raw={
            "ResponseCode": "0",
            "ResponseDescription": "The transaction status has been received.",
            "MerchantRequestID": payment.merchant_request_id,
            "CheckoutRequestID": payment.checkout_request_id,
            "ResultCode": result_code_map.get(status, "9999"),
            "ResultDesc": description,
            "mode": "simulation",
        },
        metadata=metadata,
    )


def initiate_stk_push(booking: Booking, phone_number: str) -> MpesaStkPushResponse:
    if settings.MPESA_SIMULATE_PAYMENTS:
        return initiate_simulated_stk_push(booking, phone_number)

    raise_for_missing_mpesa_configuration()
    access_token = get_access_token()
    timestamp = get_mpesa_timestamp()
    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": get_mpesa_password(timestamp),
        "Timestamp": timestamp,
        "TransactionType": settings.MPESA_TRANSACTION_TYPE,
        "Amount": int(Decimal(booking.booking_fee_amount)),
        "PartyA": phone_number,
        "PartyB": settings.MPESA_PARTYB or settings.MPESA_SHORTCODE,
        "PhoneNumber": phone_number,
        "CallBackURL": settings.MPESA_CALLBACK_URL,
        "AccountReference": get_account_reference(booking),
        "TransactionDesc": get_transaction_description(booking),
    }
    response = request_json(
        f"{get_mpesa_base_url()}/mpesa/stkpush/v1/processrequest",
        method="POST",
        headers=build_request_headers(access_token),
        payload=payload,
    )

    checkout_request_id = response.get("CheckoutRequestID")
    merchant_request_id = response.get("MerchantRequestID")
    response_code = str(response.get("ResponseCode", ""))

    if response_code != "0" or not isinstance(checkout_request_id, str) or not isinstance(merchant_request_id, str):
        raise BookingPaymentError(
            str(response.get("ResponseDescription") or response.get("errorMessage") or "M-Pesa could not start the payment."),
            code="mpesa_initiation_failed",
        )

    return MpesaStkPushResponse(
        merchant_request_id=merchant_request_id,
        checkout_request_id=checkout_request_id,
        raw=response,
    )


def query_stk_push_status(payment: BookingPayment) -> MpesaQueryResponse:
    if settings.MPESA_SIMULATE_PAYMENTS:
        return query_simulated_stk_push(payment)

    if not payment.checkout_request_id:
        raise BookingPaymentError("This payment is missing the checkout request identifier.", code="missing_checkout_request")

    access_token = get_access_token()
    timestamp = get_mpesa_timestamp()
    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": get_mpesa_password(timestamp),
        "Timestamp": timestamp,
        "CheckoutRequestID": payment.checkout_request_id,
    }
    response = request_json(
        f"{get_mpesa_base_url()}/mpesa/stkpushquery/v1/query",
        method="POST",
        headers=build_request_headers(access_token),
        payload=payload,
    )

    result_code = response.get("ResultCode")
    result_description = response.get("ResultDesc") or response.get("ResponseDescription") or "The payment is still being processed."

    if result_code in (None, ""):
        return MpesaQueryResponse(
            is_final=False,
            result_code="",
            result_description=str(result_description),
            raw=response,
            metadata={},
        )

    return MpesaQueryResponse(
        is_final=True,
        result_code=str(result_code),
        result_description=str(result_description),
        raw=response,
        metadata={},
    )


def parse_callback_metadata(payload: dict[str, object]) -> dict[str, object]:
    callback = payload.get("Body", {}).get("stkCallback", {}) if isinstance(payload.get("Body"), dict) else {}
    metadata = callback.get("CallbackMetadata", {})
    items = metadata.get("Item", []) if isinstance(metadata, dict) else []
    parsed: dict[str, object] = {}

    if isinstance(items, list):
        for item in items:
            if not isinstance(item, dict):
                continue
            name = item.get("Name")
            value = item.get("Value")
            if isinstance(name, str):
                parsed[name] = value

    return parsed
