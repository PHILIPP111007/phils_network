#!/usr/bin/env python

from gunicorn.app.wsgiapp import run

from conf import read_and_set_env, settings_and_django_setup


read_and_set_env()
settings_and_django_setup()

from django.conf import settings

path = settings.BASE_DIR

run()
