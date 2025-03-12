from app.s3 import create_bucket, s3
from app.views.file import FileUploadAPIView, file_download
from django.conf import settings

for bucket in s3.list_buckets()["Buckets"]:
	if bucket["Name"] == settings.BUCKET_NAME:
		break
else:
	create_bucket()
