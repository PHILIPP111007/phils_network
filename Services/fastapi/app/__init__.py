from app.constants import BUCKET_NAME
from app.s3 import create_bucket, s3

for bucket in s3.list_buckets()["Buckets"]:
	if bucket["Name"] == BUCKET_NAME:
		break
else:
	create_bucket()
