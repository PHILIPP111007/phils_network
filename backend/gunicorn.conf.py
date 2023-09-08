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

### Close gunicorn daemon:
pkill -f gunicorn
"""

import os
import logging

import django
from django.conf import settings

from conf import (
	read_and_set_env,
	settings_and_django_setup,
	get_workers_count
)

from gunicorn.arbiter import Arbiter


Server: Arbiter | None = None


def when_ready(server):
	global Server

	Server = server

def on_reload(server):
	global Server

	Server = server
	# Server.manage_workers()

	# Server.reexec()
	# Server.murder_workers()
	# Server.reap_workers()
	# Server.manage_workers()

def pre_fork(server, worker):
	print('pre_fork')

def post_fork(server, worker):
	print('post_fork')

# TODO: gunicorn does not reboot uvicorn workers on file change
def worker_int(worker): # Called just after a worker exited on SIGINT or SIGQUIT
	print('worker_int')

	# print(type(worker)) # <class 'backend.workers.UvicornWorker'>
	# os.system('sudo kill -SIGHUP')

	# Server.murder_workers()
	# Server.reap_workers()
	

	# Server.reexec()
	# os.system('pkill gunicorn')


	# Server.murder_workers()
	# Server.stop()
	# os.system('gunicorn -c gunicorn.conf.py')
	# Server.manage_workers()

	# print(Server.cfg.workers)

	# w = Server.WORKERS # {18106: <backend.workers.UvicornWorker object at 0x1093f9010>}

	# print(Server)

	# workers = list(Server.WORKERS.items())

	# for i in workers:
	# 	pid = i[0]
	# 	obj = i[1]
	# 	print(pid)
	# 	print(obj.cfg)

def worker_abort(worker):
	print('worker_abort')

def child_exit(server, worker):
	print('child_exit')


def print_server_info():
	"""Print server info. Called when gunicorn is starting."""

	url: str = os.environ.get("DJANGO_HOST", "") + ":" + os.environ.get("DJANGO_PORT", "")

	server: str = f"Starting ASGI/Gunicorn development server at {url}"
	app_ver: str = os.environ.get("version", "undefined")
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
	mouse_logger = logging.getLogger("Mouse")
	
	print(info)
	mouse_logger.info(info)


def add_to_reload_list(path) -> None:
	"""Add to `reload_extra_files` recursively files.py"""

	for name in os.listdir(path):
		name = os.path.join(path, name)
		if os.path.isfile(name):
			if name.endswith('.py'):
				reload_extra_files.append(name)
		else:
			add_to_reload_list(name)


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

bind: str = os.environ.get("DJANGO_HOST", "0.0.0.0") + \
	":" + os.environ.get("DJANGO_PORT", "8000")


#
# Reloading
#

# TODO: reloading does not work with uvicorn workers 
reload: bool = True  # reload when file changes
reload_extra_files = []
add_to_reload_list(settings.BASE_DIR)


#
# Worker processes
#
# Custom uvicorn worker.
# See `backend/workers.py`

worker_class: str = "backend.workers.UvicornWorker"
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
