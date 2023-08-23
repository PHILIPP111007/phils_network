import os
import tomllib


env_file_path: str = ".env.toml"


def _set_args(env_file: str, app_part: dict, app_part_name: str = "") -> None:
	if app_part:
		for key, val in app_part.items():
			os.environ.setdefault(key, val)
	else:
		print(f"\"{env_file}\" file does not contain {app_part_name} variables.")


def read_and_set_env() -> None:
	"""Read env.toml file and set app settings variables."""

	if os.path.exists(env_file_path):
		with open(env_file_path, "rb") as file:
			toml_content: dict = tomllib.load(file)
			app: dict = toml_content.get("app", "")
			app_settings: dict = toml_content.get("app-settings", "")

		_set_args(env_file=env_file_path, app_part=app, app_part_name="app")
		_set_args(env_file=env_file_path, app_part=app_settings, app_part_name="app_settings")

	else:
		print(f"You do not have \"{env_file_path}\" file.")
