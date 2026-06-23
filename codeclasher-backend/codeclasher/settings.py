"""
CodeClasher Django Settings
"""
from pathlib import Path
from decouple import config
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production-use-env-var')
DEBUG = config('DEBUG', default=True, cast=bool)


def _csv(name, default):
    """Comma-separated env var -> list, tolerant of spaces/trailing slashes/empties."""
    return [item.strip().rstrip('/') for item in config(name, default=default).split(',') if item.strip()]


ALLOWED_HOSTS = [h.strip() for h in config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',') if h.strip()]
CSRF_TRUSTED_ORIGINS = _csv('CSRF_TRUSTED_ORIGINS', 'http://localhost:5173')

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'django_filters',
    # Local
    'users',
    'problems',
    'battles',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'codeclasher.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ASGI for WebSockets (Daphne uses this; WSGI_APPLICATION satisfies Nixpacks detection)
WSGI_APPLICATION = 'codeclasher.wsgi.application'
ASGI_APPLICATION = 'codeclasher.asgi.application'

# Database — PostgreSQL in production, SQLite in dev
_DATABASE_URL = config('DATABASE_URL', default=None)
if _DATABASE_URL:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(default=_DATABASE_URL, conn_max_age=600, ssl_require=True)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Channel layers — Redis in production, in-memory in dev
_REDIS_URL = config('REDIS_URL', default=None)
if _REDIS_URL:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {'hosts': [_REDIS_URL]},
        },
    }
else:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS
CORS_ALLOWED_ORIGINS = _csv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173'
)
CORS_ALLOW_CREDENTIALS = True

# Game Constants
BATTLE_TIME_LIMIT = 30 * 60       # 30 minutes in seconds
XP_WIN_BASE = 100
XP_LOSS_BASE = 25
XP_PER_LEVEL = 500
HEALTH_PER_BATTLE = 100
DAMAGE_WRONG_SUBMISSION = 20
DAMAGE_HINT_USED = 10
