import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-x#$^&*()_+{}|:"<>?')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['0.0.0.0', 'localhost', '127.0.0.1', '*']

# CSRF Trusted Origins - required for Replit
CSRF_TRUSTED_ORIGINS = [
    'https://*.repl.co',
    'https://*.replit.app',
    'https://*.repl.dev',
    'https://*.replit.co',
    'https://*.core.repl.co',
    'https://*.id.repl.co', 
    'https://*.*.repl.co',
    'https://e2a6f9c7-bdc8-4cd9-b795-f5e81376c7f5.id.repl.co',
    # HTTP versions for development
    'http://*.repl.co',
    'http://*.replit.app',
    'http://*.repl.dev',
    'http://*.replit.co',
    'http://*.core.repl.co',
    'http://*.id.repl.co',
    'http://*.*.repl.co',
    'http://e2a6f9c7-bdc8-4cd9-b795-f5e81376c7f5.id.repl.co',
]

# Also set this for better compatibility with Replit
CSRF_COOKIE_SAMESITE = None
SESSION_COOKIE_SAMESITE = None

# In development, we might not have HTTPS
if not DEBUG:
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'channels',
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'calculator_app.urls'

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

WSGI_APPLICATION = 'calculator_app.wsgi.application'
ASGI_APPLICATION = 'calculator_app.asgi.application'

# Channels Layer Configuration
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Ensure Django serves static files in development
if DEBUG:
    STATICFILES_DIRS = []
else:
    STATICFILES_DIRS = [
        os.path.join(BASE_DIR, 'static'),
    ]

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Login URL
LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/'
