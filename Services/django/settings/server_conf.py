__all__ = ["read_and_set_env", "get_workers_count", "get_threads_count"]

import os
import tomllib


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


def get_workers_count() -> int:
	"""
	See gunicorn workers documentation:
	https://docs.gunicorn.org/en/stable/configure.html#:~:text=workers%20%3D%20multiprocessing.cpu_count()%20*%202%20%2B%201
	"""

	# return cpu_count() * 2 + 1
	return 1


def get_threads_count() -> int:
	"""2-4 x $(NUM_CORES)"""

	# return cpu_count() * 4
	return 4
