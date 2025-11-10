from app.constants import BUCKET_NAME, DEVELOPMENT, TESTING
from app.s3 import create_bucket, s3

if TESTING != "1" and DEVELOPMENT != "1":
	try:
		for bucket in s3.list_buckets()["Buckets"]:
			if bucket["Name"] == BUCKET_NAME:
				break
		else:
			create_bucket()
	except Exception:
		pass
