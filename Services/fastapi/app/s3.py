__all__ = ["s3", "create_bucket"]


import boto3

from app.constants import (
	AWS_ACCESS_KEY_ID,
	AWS_S3_ENDPOINT_URL,
	AWS_SECRET_ACCESS_KEY,
	BUCKET_NAME,
)

s3 = boto3.client(
	"s3",
	endpoint_url=AWS_S3_ENDPOINT_URL,
	aws_access_key_id=AWS_ACCESS_KEY_ID,
	aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
)


def create_bucket():
	s3.create_bucket(Bucket=BUCKET_NAME)
