import os
import tomllib
from multiprocessing import cpu_count
import logging

import django
from django.conf import settings


ENV_FILE_PATH: str = "pyproject.toml"


def _set_args(env_file: str, app_part: dict, app_part_name: str = "") -> None:
	if app_part:
		for key, val in app_part.items():
			os.environ.setdefault(key, val)
	else:
		print(f'"{env_file}" file does not contain {app_part_name} variables.')


def read_and_set_env() -> None:
	"""Read env.toml file and set app settings variables."""

	if os.path.exists(ENV_FILE_PATH):
		with open(ENV_FILE_PATH, "rb") as file:
			toml_content: dict = tomllib.load(file)
			app: dict = toml_content.get("app", "")
			app_settings: dict = toml_content.get("app-settings", "")

		_set_args(env_file=ENV_FILE_PATH, app_part=app, app_part_name="app")
		_set_args(
			env_file=ENV_FILE_PATH, app_part=app_settings, app_part_name="app_settings"
		)

	else:
		print(f'You do not have "{ENV_FILE_PATH}" file.')


def settings_and_django_setup() -> None:
	"""Run administrative tasks."""

	os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
	django.setup()


def get_workers_count() -> int:
	"""
	See gunicorn workers documentation:
	https://docs.gunicorn.org/en/stable/configure.html#:~:text=workers%20%3D%20multiprocessing.cpu_count()%20*%202%20%2B%201
	"""

	return cpu_count() * 2 + 1


def get_threads_count() -> int:
	"""2-4 x $(NUM_CORES)"""

	return cpu_count() * 4


def make_reload_files_list() -> list[str]:
	"""Add to `reload_extra_files` recursively files.py"""

	reload_extra_files = []

	def recursive(path):
		for dist in os.listdir(path):
			full_dist: str = os.path.join(path, dist)
			if os.path.isfile(full_dist):
				if full_dist.endswith(".py"):
					reload_extra_files.append(full_dist)
			elif not full_dist.endswith("venv"):
				recursive(full_dist)

	recursive(path=settings.BASE_DIR)
	return reload_extra_files


def print_server_info(workers_count: int, threads_count: int):
	"""Print server info. Called when gunicorn is starting."""

	url: str = (
		os.environ.get("DJANGO_HOST", "") + ":" + os.environ.get("DJANGO_PORT", "")
	)

	server: str = f"Starting ASGI/Gunicorn development server at {url}"
	app_ver: str = os.environ.get("version", "undefined")
	django_ver: str = (
		f"Django version {django.get_version()}, " + "using settings 'backend.settings'"
	)
	workers_threads: str = (
		f"Workers count: {workers_count}. Threads count: {threads_count}"
	)
	quit_server: str = "Quit the server with "

	if settings.DEBUG:
		other = (
			"DEBUG: True. Gunicorn daemon: OFF. "
			+ "Logging: console, tmp/server_debug.log"
		)
		quit_server += "CONTROL-C."
	else:
		other = (
			"DEBUG: False. Gunicorn daemon: ON. "
			+ "Logging: console, tmp/server_prod.log"
		)
		quit_server += "`pkill -f gunicorn`."

	info: str = (
		f"\n\nApp version {app_ver}\n{django_ver}\n{server}\n{other}\n"
		+ f"{workers_threads}\n{quit_server}\n"
	)

	mouse_logger = logging.getLogger("Mouse")

	print(info)
	mouse_logger.info(info)
