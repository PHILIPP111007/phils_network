import base64
import gzip
import io
import os

from PIL import Image

from app.constants import (
	BUCKET_NAME,
	MAX_ALLOWED_FILE_SIZE_FOR_PREVIEW,
	MEDIA_ROOT,
)
from app.s3 import s3


async def get_image_file_content(file_name: str):
	try:
		file_path = file_name
		with open(file_path, "wb") as file:
			s3.download_fileobj(BUCKET_NAME, file_path, file)

		with open(file_path, "rb") as file:
			content = file.read()
			img = Image.open(io.BytesIO(content))
			img = img.resize((30, 30))
			img.save(file_path, "PNG")

		with open(file_path, "rb") as file:
			content = file.read()
			content_base64 = base64.b64encode(content).decode("utf-8")
	except Exception:
		content_base64 = None

	return content_base64


async def get_file_content_gzip(file_name: str):
	if not file_name:
		return {"path": file_name, "content": None}

	try:
		file_path = os.path.join(MEDIA_ROOT, file_name)

		# Check file size first
		response = s3.head_object(Bucket=BUCKET_NAME, Key=file_path)
		file_size = response["ContentLength"]

		if file_size > MAX_ALLOWED_FILE_SIZE_FOR_PREVIEW:
			return {"path": file_name, "content": None}

		# Download compressed data directly to memory
		compressed_stream = io.BytesIO()
		s3.download_fileobj(BUCKET_NAME, file_path, compressed_stream)
		compressed_stream.seek(0)

		# Decompress in memory
		with gzip.GzipFile(fileobj=compressed_stream, mode="rb") as f_in:
			decompressed_content = f_in.read()

		# Encode to base64
		content_base64 = base64.b64encode(decompressed_content).decode("utf-8")

		return {"path": file_path, "content": content_base64}

	except Exception:
		return {"path": file_name, "content": None}
