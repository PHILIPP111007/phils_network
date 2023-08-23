#!/usr/bin/env python

"""
#################################################
#
# env vars settings and
# gunicorn WSGI + uvicorn server configuration.
#
#################################################

### Gunicorn + Uvicorn workers run:
gunicorn -c gunicorn.conf.py


### Gunicorn + Uvicorn workers run (directly):
gunicorn -c gunicorn.conf.py -k uvicorn.workers.UvicornWorker

gunicorn backend.asgi:application -k uvicorn.workers.UvicornWorker


### Close gunicorn daemon:
pkill -f gunicorn
"""

from os import environ
import logging
from multiprocessing import cpu_count

import django
from django.conf import settings

from set_env import read_and_set_env


def settings_and_django_setup() -> None:
	"""Run administrative tasks."""

	environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
	django.setup()


def get_workers_count() -> int:
	"""
	See gunicorn workers documentation:
	https://docs.gunicorn.org/en/stable/configure.html#:~:text=workers%20%3D%20multiprocessing.cpu_count()%20*%202%20%2B%201
	"""

	if settings.DEBUG:
		return 1
	return cpu_count() * 2 + 1


def print_server_info():
	"""Print server info. Called when gunicorn is starting."""

	url: str = environ.get("HOST", "") + ":" + environ.get("PORT", "")

	server: str = f"Starting ASGI/Gunicorn development server at {url}"
	app_ver: str = environ.get("version", "undefined")
	django_ver: str = f"Django version {django.get_version()}, using settings 'backend.settings'"
	workers_count: str = f"Workers count: {get_workers_count()}."
	quit_server: str = "Quit the server with "

	if settings.DEBUG:
		other = "DEBUG: True. Gunicorn daemon: OFF. Logging: console, tmp/server_debug.log"
		quit_server += "CONTROL-C."
	else:
		other = "DEBUG: False. Gunicorn daemon: ON. Logging: console, tmp/server_prod.log"
		quit_server += "`pkill -f gunicorn`."

	info: str = f"\n\nApp version {app_ver}\n{django_ver}\n{server}\n{other}\n{workers_count}\n{quit_server}\n"
	print(info)
	
	mouse_logger = logging.getLogger("Mouse")
	mouse_logger.info(info)


##########################
# Setting env and django #
##########################

read_and_set_env()
settings_and_django_setup()


#####################
# Gunicorn settings #
#####################

command: str = "venv/bin/gunicorn"
pythonpath: str = "venv"


#
# Process naming
#
#   proc_name - A base to use with setproctitle to change the way
#       that Gunicorn processes are reported in the system process
#       table. This affects things like 'ps' and 'top'. If you're
#       going to be running more than one instance of Gunicorn you'll
#       probably want to set a name to tell them apart. This requires
#       that you install the setproctitle module.
#
#       A string or None to choose a default of something like 'gunicorn'.
#

proc_name: str = "gunicorn"


#
# App
#

wsgi_app: str = "backend.asgi"


#
# Server socket
#

bind: str = environ.get("HOST", "0.0.0.0") + ":" + environ.get("PORT", "8000")


#
# Worker processes
#

reload: bool = True  # reload when file changes # TODO: reloading is not working with uvicorn workers 

# worker_class = "gevent"  # if using only gunicorn
worker_class: str = "uvicorn.workers.UvicornWorker"
worker_connections: int = 1000
max_requests: int = 1000
timeout: int = 30
workers: int = get_workers_count()


#
# Server mechanics
#
#   daemon - Detach the main Gunicorn process from the controlling
#       terminal with a standard fork/fork sequence.
#
#       True or False
#

daemon: bool = False if settings.DEBUG else True


#
# Print gunicorn config.
#
#	True or False
#

print_config: bool = False


print_server_info()
