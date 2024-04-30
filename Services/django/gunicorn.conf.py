#!/usr/bin/env python
"""
#################################################
#
# env vars settings and
# gunicorn WSGI + uvicorn configuration.
#
#################################################

### Gunicorn + Uvicorn workers:
*	$ bash ./gunicorn.sh

### Close gunicorn daemon:
*	$ pkill -f gunicorn
"""

import signal


from settings.server_conf import (
	read_and_set_env,
	get_workers_count,
	get_threads_count,
)

from gunicorn.arbiter import Arbiter

from settings.workers import UvicornWorker


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


read_and_set_env()


#####################
# Gunicorn settings
#####################

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

wsgi_app: str = "settings.asgi"


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
#  - see `settings/workers.py`

worker_class: str = "settings.workers.UvicornWorker"
worker_connections: int = 1000
max_requests: int = 1000
timeout: int = 30

workers: int = get_workers_count()
threads: int = get_threads_count()
