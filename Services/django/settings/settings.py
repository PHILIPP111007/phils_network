from os import environ
from pathlib import Path


# Build paths inside the project like this: BASE_DIR / "subdir".
BASE_DIR: Path = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY: str = environ.get("SECRET_KEY", default="")


# SECURITY WARNING: don"t run with debug turned on in production!
DEBUG: bool = not not int(environ.get("DEBUG", default="0"))


ALLOWED_HOSTS: list[str] = environ.get("ALLOWED_HOSTS", default="*").split(",")


# Application definition

DJANGO_APPS: list[str] = [
	"django.contrib.admin",
	"django.contrib.auth",
	"django.contrib.contenttypes",
	"django.contrib.sessions",
	"django.contrib.messages",
	"django.contrib.staticfiles",
]

THIRD_PARTY_APPS: list[str] = [
	# Servers
	"daphne",
	"gunicorn",
	"uvicorn",
	# REST API
	"corsheaders",
	"rest_framework",
	"rest_framework.authtoken",
	"djoser",
	"django_extensions",
]

LOCAL_APPS: list[str] = [
	"app",
]

INSTALLED_APPS = THIRD_PARTY_APPS + DJANGO_APPS + LOCAL_APPS


DJANGO_MIDDLEWARE: list[str] = [
	"django.middleware.security.SecurityMiddleware",
	"django.contrib.sessions.middleware.SessionMiddleware",
	"django.middleware.common.CommonMiddleware",
	"django.middleware.csrf.CsrfViewMiddleware",
	"django.contrib.auth.middleware.AuthenticationMiddleware",
	"django.contrib.messages.middleware.MessageMiddleware",
	"django.middleware.clickjacking.XFrameOptionsMiddleware",
]

THIRD_PARTY_MIDDLEWARE: list[str] = [
	"corsheaders.middleware.CorsMiddleware",  # for working Django REST
	"whitenoise.middleware.WhiteNoiseMiddleware",  # for servers to work with static files
]

MIDDLEWARE = DJANGO_MIDDLEWARE + THIRD_PARTY_MIDDLEWARE


ROOT_URLCONF: str = "settings.urls"

TEMPLATES: list[dict] = [
	{
		"BACKEND": "django.template.backends.django.DjangoTemplates",
		"DIRS": [BASE_DIR / "settings/templates"],
		"APP_DIRS": True,
		"OPTIONS": {
			"context_processors": [
				"django.template.context_processors.debug",
				"django.template.context_processors.request",
				"django.contrib.auth.context_processors.auth",
				"django.contrib.messages.context_processors.messages",
			],
		},
	},
]

WSGI_APPLICATION: str = "settings.wsgi.application"
ASGI_APPLICATION: str = "settings.asgi.application"

# If you need to use Redis:
CHANNEL_LAYERS = {
	"default": {
		"BACKEND": "channels_redis.core.RedisChannelLayer",
		"CONFIG": {
			"hosts": [
				(
					environ.get("CHANNEL_LAYERS_HOST", default="127.0.0.1"),
					int(environ.get("CHANNEL_LAYERS_PORT", default="6379")),
				)
			],
			"symmetric_encryption_keys": [SECRET_KEY],
		},
	},
}


# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases

DATABASES = {
	"default": {
		"ENGINE": "django.db.backends.postgresql_psycopg2",
		"NAME": environ.get("PG_NAME"),
		"USER": environ.get("PG_USER"),
		"HOST": environ.get("PG_HOST"),
		"PORT": int(environ.get("PG_PORT", default="5432")),
		"PASSWORD": environ.get("PG_PASSWORD"),
	},
}

CACHES = {
	"default": {
		"BACKEND": "django.core.cache.backends.redis.RedisCache",
		"LOCATION": "redis://127.0.0.1:6379",
	}
}


# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS: list[dict[str, str]] = [
	{
		"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
	},
	{
		"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
	},
	{
		"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
	},
	{
		"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
	},
]


# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE: str = "en-us"

TIME_ZONE: str = "UTC"

USE_I18N: bool = True

USE_TZ: bool = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

STATIC_URL: str = "static/"
STATIC_ROOT: str = "static"


STATICFILES_DIRS: list[Path] = [BASE_DIR / "settings/static"]


# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD: str = "django.db.models.BigAutoField"


######### My settings #########

# CORS settings

CORS_ORIGIN_ALLOW_ALL: bool = True


# REST FRAMEWORK settings

REST_FRAMEWORK: dict[str, list[str]] = {
	"DEFAULT_RENDERER_CLASSES": [
		"rest_framework.renderers.JSONRenderer",
	],
	"DEFAULT_AUTHENTICATION_CLASSES": [
		"rest_framework.authentication.BasicAuthentication",
		"rest_framework.authentication.SessionAuthentication",
		"rest_framework.authentication.TokenAuthentication",
	],
}

if DEBUG:
	REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"].append(
		"rest_framework.renderers.BrowsableAPIRenderer"
	)

# DJOSER settings
DJOSER: dict[str, str] = {
	"USER_ID_FIELD": "pk",
	"LOGIN_FIELD": "username",
}

# Lazy loading settings
POSTS_TO_LOAD: int = int(environ.get("POSTS_TO_LOAD", default="20"))
MESSAGES_TO_LOAD: int = int(environ.get("MESSAGES_TO_LOAD", default="30"))

# Date time format
DATETIME_FORMAT: str = environ.get("DATETIME_FORMAT", default="%Y-%m-%d %H:%M")
