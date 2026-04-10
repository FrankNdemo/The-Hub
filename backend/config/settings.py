from __future__ import annotations

import os
from datetime import timedelta
from email.utils import parseaddr
from pathlib import Path
from urllib.parse import parse_qs, unquote


BASE_DIR = Path(__file__).resolve().parent.parent


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()

        if not key or key in os.environ:
            continue

        cleaned = value.strip().strip('"').strip("'")
        os.environ[key] = cleaned


load_env_file(BASE_DIR / ".env")


def env(key: str, default: str = "") -> str:
    return os.getenv(key, default)


def env_any(*keys: str, default: str = "") -> str:
    for key in keys:
        value = os.getenv(key)
        if value:
            return value

    return default


def env_list(key: str, default: str = "") -> list[str]:
    raw = env(key, default)
    return [value.strip() for value in raw.split(",") if value.strip()]


def parse_database_url(value: str) -> dict[str, str]:
    raw = value.strip()
    _, separator, remainder = raw.partition("://")
    if not separator:
        remainder = raw

    userinfo = ""
    host_path_query = remainder
    if "@" in remainder:
        userinfo, _, host_path_query = remainder.rpartition("@")

    host_path, _, query = host_path_query.partition("?")
    hostinfo, _, path = host_path.partition("/")

    username = ""
    password = ""
    if userinfo:
        username, separator, password = userinfo.partition(":")
        if not separator:
            username = userinfo

    host = hostinfo
    port = ""
    if hostinfo.startswith("[") and "]" in hostinfo:
        closing_index = hostinfo.find("]")
        host = hostinfo[1:closing_index]
        remainder = hostinfo[closing_index + 1 :]
        if remainder.startswith(":"):
            port = remainder[1:]
    elif ":" in hostinfo:
        possible_host, possible_port = hostinfo.rsplit(":", 1)
        if possible_port.isdigit():
            host = possible_host
            port = possible_port

    return {
        "name": unquote(path.lstrip("/")),
        "user": unquote(username),
        "password": unquote(password),
        "host": host,
        "port": port,
        "query": query,
    }


SECRET_KEY = env("DJANGO_SECRET_KEY", "django-insecure-the-wellness-hub-local-dev")
DEBUG = env("DJANGO_DEBUG", "True").lower() == "true"
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,[::1],testserver")
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if DEBUG and "*" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS = [*ALLOWED_HOSTS, "0.0.0.0", "*"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "apps.common",
    "apps.therapists",
    "apps.bookings",
    "apps.blog",
    "apps.notifications",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

SUPABASE_DB_CONFIG_PRESENT = any(
    [
        env_any("SUPABASE_DB_NAME"),
        env_any("SUPABASE_DB_USER"),
        env_any("SUPABASE_DB_PASSWORD"),
        env_any("SUPABASE_DB_HOST"),
    ]
)
DB_ENGINE = env_any("DB_ENGINE", default="postgres" if SUPABASE_DB_CONFIG_PRESENT else "sqlite").lower()
DATABASE_URL = env_any("DATABASE_URL").strip()
DB_CONN_MAX_AGE = int(env_any("DB_CONN_MAX_AGE", default="0") or "0")

if DATABASE_URL:
    # Hosted providers often expose DB URLs with raw special characters in the password.
    parsed_db = parse_database_url(DATABASE_URL)
    db_query = parse_qs(parsed_db["query"])
    sslmode = db_query.get("sslmode", [env_any("DB_SSLMODE", "SUPABASE_DB_SSLMODE", default="")])[0]
    database_config = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": parsed_db["name"] or env_any("DB_NAME", "SUPABASE_DB_NAME", default="postgres"),
        "USER": parsed_db["user"] or env_any("DB_USER", "SUPABASE_DB_USER", default=""),
        "PASSWORD": parsed_db["password"] or env_any("DB_PASSWORD", "SUPABASE_DB_PASSWORD", default=""),
        "HOST": parsed_db["host"] or env_any("DB_HOST", "SUPABASE_DB_HOST", default="localhost"),
        "PORT": parsed_db["port"] or env_any("DB_PORT", "SUPABASE_DB_PORT", default="5432"),
        "CONN_MAX_AGE": DB_CONN_MAX_AGE,
    }

    if sslmode:
        database_config["OPTIONS"] = {"sslmode": sslmode}

    DATABASES = {"default": database_config}

elif DB_ENGINE == "postgres":
    sslmode = env_any("DB_SSLMODE", "SUPABASE_DB_SSLMODE", default="")
    database_config = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env_any("DB_NAME", "SUPABASE_DB_NAME", default="wellness_hub"),
        "USER": env_any("DB_USER", "SUPABASE_DB_USER", default=""),
        "PASSWORD": env_any("DB_PASSWORD", "SUPABASE_DB_PASSWORD", default=""),
        "HOST": env_any("DB_HOST", "SUPABASE_DB_HOST", default="localhost"),
        "PORT": env_any("DB_PORT", "SUPABASE_DB_PORT", default="5432"),
        "CONN_MAX_AGE": DB_CONN_MAX_AGE,
    }

    if sslmode:
        database_config["OPTIONS"] = {"sslmode": sslmode}

    DATABASES = {
        "default": database_config
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / env("DB_NAME", "db.sqlite3"),
            "CONN_MAX_AGE": DB_CONN_MAX_AGE,
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = env_any("DJANGO_TIME_ZONE", default="Africa/Nairobi")
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = env_list(
    "DJANGO_CORS_ALLOWED_ORIGINS",
    "http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173",
)
CORS_ALLOWED_ORIGIN_REGEXES = (
    [
        r"^https?://localhost(?::\d+)?$",
        r"^https?://127\.0\.0\.1(?::\d+)?$",
        r"^https?://\[::1\](?::\d+)?$",
        r"^https?://0\.0\.0\.0(?::\d+)?$",
        r"^https?://10(?:\.\d{1,3}){3}(?::\d+)?$",
        r"^https?://192\.168(?:\.\d{1,3}){2}(?::\d+)?$",
        r"^https?://172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}(?::\d+)?$",
    ]
    if DEBUG
    else []
)
CSRF_TRUSTED_ORIGINS = env_list(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    "http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173",
)
FRONTEND_BASE_URL = env("FRONTEND_BASE_URL", "http://localhost:8080").rstrip("/")

EMAIL_BACKEND = env("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", "")
EMAIL_PORT = int(env("EMAIL_PORT", "587") or "587")
EMAIL_HOST_USER = env("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env("EMAIL_USE_TLS", "False").lower() == "true"
EMAIL_USE_SSL = env("EMAIL_USE_SSL", "False").lower() == "true"
EMAIL_TIMEOUT = int(env("EMAIL_TIMEOUT", "30") or "30")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", "The Wellness Hub <no-reply@wellnesshub.local>")
SERVER_EMAIL = env("SERVER_EMAIL", DEFAULT_FROM_EMAIL)
parsed_reply_to = parseaddr(DEFAULT_FROM_EMAIL)[1]
WELLNESS_HUB_REPLY_TO = env("WELLNESS_HUB_REPLY_TO", parsed_reply_to)
BOOKING_DURATION_MINUTES = int(env("BOOKING_DURATION_MINUTES", "60") or "60")
BOOKING_OPEN_HOUR = int(env("BOOKING_OPEN_HOUR", "10") or "10")
BOOKING_CLOSE_HOUR = int(env("BOOKING_CLOSE_HOUR", "19") or "19")
BOOKING_SLOT_INTERVAL_MINUTES = int(env("BOOKING_SLOT_INTERVAL_MINUTES", "15") or "15")
BOOKING_CALENDAR_UID_DOMAIN = env("BOOKING_CALENDAR_UID_DOMAIN", "wellnesshub.local")
BOOKING_CALENDAR_ORGANIZER_NAME = env("BOOKING_CALENDAR_ORGANIZER_NAME", "The Wellness Hub")
BREVO_API_KEY = env("BREVO_API_KEY", "")
BREVO_API_URL = env("BREVO_API_URL", "https://api.brevo.com/v3/smtp/email")
BREVO_API_TIMEOUT = int(env("BREVO_API_TIMEOUT", "30") or "30")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "EXCEPTION_HANDLER": "apps.common.exceptions.api_exception_handler",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}
