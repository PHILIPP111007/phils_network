import os
from os import environ

DATETIME_FORMAT: str = environ.get("DATETIME_FORMAT", "%Y-%m-%d %H:%M")
POSTS_TO_LOAD: int = int(environ.get("POSTS_TO_LOAD", "20"))
MESSAGES_TO_LOAD: int = int(environ.get("MESSAGES_TO_LOAD", "30"))

PG_HOST = environ.get("PG_HOST", "db")
PG_PORT = environ.get("PG_PORT", "5432")
PG_NAME = environ.get("PG_NAME", "postgres")
PG_USER = environ.get("PG_USER", "postgres")
PG_PASSWORD = environ.get("PG_PASSWORD", "postgres")

BUCKET_NAME: str = "philsnetwork"
AWS_ACCESS_KEY_ID = environ.get("AWS_ACCESS_KEY_ID", "minio")
AWS_SECRET_ACCESS_KEY = environ.get("AWS_SECRET_ACCESS_KEY", "minio123")
AWS_S3_ENDPOINT_URL = environ.get("AWS_S3_ENDPOINT_URL", "http://s3:9000")

MEDIA_ROOT = os.path.join("/app", "media")

MAX_ALLOWED_FILE_SIZE_FOR_PREVIEW = 30 * 1024 * 1024  # 30 Mb
USER_IMAGE_PATH = "user_{}"
