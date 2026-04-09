from __future__ import annotations

import os
from datetime import timedelta
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse


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


def env_list(key: str, default: str = "") -> list[str]:
    raw = env(key, default)
    return [value.strip() for value in raw.split(",") if value.strip()]


SECRET_KEY = env("DJANGO_SECRET_KEY", "django-insecure-the-wellness-hub-local-dev")
DEBUG = env("DJANGO_DEBUG", "True").lower() == "true"
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

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

DB_ENGINE = env("DB_ENGINE", "sqlite").lower()
DATABASE_URL = env("DATABASE_URL")

if DATABASE_URL:
    parsed_db = urlparse(DATABASE_URL)
    db_query = parse_qs(parsed_db.query)
    sslmode = db_query.get("sslmode", [env("DB_SSLMODE", "")])[0]
    database_config = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": unquote(parsed_db.path.lstrip("/")) or env("DB_NAME", "postgres"),
        "USER": unquote(parsed_db.username or env("DB_USER", "")),
        "PASSWORD": unquote(parsed_db.password or env("DB_PASSWORD", "")),
        "HOST": parsed_db.hostname or env("DB_HOST", "localhost"),
        "PORT": str(parsed_db.port or env("DB_PORT", "5432")),
    }

    if sslmode:
        database_config["OPTIONS"] = {"sslmode": sslmode}

    DATABASES = {"default": database_config}

elif DB_ENGINE == "postgres":
    sslmode = env("DB_SSLMODE", "")
    database_config = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("DB_NAME", "wellness_hub"),
        "USER": env("DB_USER", ""),
        "PASSWORD": env("DB_PASSWORD", ""),
        "HOST": env("DB_HOST", "localhost"),
        "PORT": env("DB_PORT", "5432"),
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
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Nairobi"
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
CSRF_TRUSTED_ORIGINS = env_list(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    "http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173",
)
FRONTEND_BASE_URL = env("FRONTEND_BASE_URL", "http://localhost:8080").rstrip("/")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}
