__all__ = ["s3", "create_bucket"]


import boto3

from django.conf import settings

s3 = boto3.client(
	"s3",
	endpoint_url=settings.AWS_S3_ENDPOINT_URL,
	aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
	aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
)


def create_bucket():
	s3.create_bucket(Bucket=settings.BUCKET_NAME)
