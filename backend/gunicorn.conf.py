#!/usr/bin/env python
"""
#################################################
#
# env vars settings and
# gunicorn WSGI + uvicorn server configuration.
#
#################################################

### Gunicorn + Uvicorn workers run:
*	$ gunicorn -c gunicorn.conf.py

or:

*	$ bash ./gunicorn_rc

### Close gunicorn daemon:
*	$ pkill -f gunicorn
"""

import os
import signal


from backend.server_conf import (
	get_workers_count,
	get_threads_count,
)

from gunicorn.arbiter import Arbiter

from backend.workers import UvicornWorker


#####################
# Gunicorn functions
#####################

Server: Arbiter | None = None


def when_ready(server: Arbiter):
	global Server

	Server = server


# Called just after a worker exited on SIGINT or SIGQUIT
# For example after file has changed
def worker_int(worker: UvicornWorker):
	# with open('tmp/gunicorn.pid', 'r') as f:
	# 	pid = int(f.read())

	# # Need some time to quit
	# os.kill(pid, signal.SIGQUIT)

	# while True:
	# 	exit_code = os.system('bash ./gunicorn_rc')
	# 	if exit_code == 0:
	# 		break

	Server.kill_worker(worker.pid, signal.SIGTERM)


#####################
# Gunicorn settings
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

bind: str = (
	os.environ.get("DJANGO_HOST", "0.0.0.0")
	+ ":"
	+ os.environ.get("DJANGO_PORT", "8000")
)


#
# Reloading
# - reload when file has changed
#

preload_app: bool = False
reload: bool = True


#
# Worker processes
#
# Custom uvicorn worker.
#  - see `backend/workers.py`

worker_class: str = "backend.workers.UvicornWorker"
worker_connections: int = 1000
max_requests: int = 1000
timeout: int = 30

workers: int = get_workers_count()
threads: int = get_threads_count()
