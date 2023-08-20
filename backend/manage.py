#!/usr/bin/env python
"""Django"s command-line utility for administrative tasks."""
import os
import sys
import tomllib


def read_env(env_file: str) -> None:
	"""Read env.toml file and set app settings variables."""

	
	if os.path.exists(env_file):
		with open(env_file, "rb") as file:
			toml_content: dict = tomllib.load(file)
			app_settings: dict = toml_content.get("app-settings", "")

		if app_settings:
			for key, val in app_settings.items():
				os.environ.setdefault(key, val)
		else:
			print("\"env.toml\" file does not contain app-settings variables.")

	else:
		print("You do not have \"env.toml\" file.")


def main() -> None:
	"""Run administrative tasks."""

	os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
	try:
		from django.core.management import execute_from_command_line
	except ImportError as exc:
		raise ImportError(
			"Couldn't import Django. Are you sure it's installed and "
			"available on your PYTHONPATH environment variable? Did you "
			"forget to activate a virtual environment?"
		) from exc
	execute_from_command_line(sys.argv)


if __name__ == "__main__":
	env_file: str = ".env.toml"
	read_env(env_file=env_file)
	main()
