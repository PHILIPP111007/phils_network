import base64
import gzip
import os
import shutil
from io import BytesIO

from PIL import Image

from app.constants import (
	BUCKET_NAME,
	MAX_ALLOWED_FILE_SIZE_FOR_PREVIEW,
	MEDIA_ROOT,
)
from app.s3 import s3


async def get_file_content(file_name: str):
	try:
		file_path = file_name
		with open(file_path, "wb") as file:
			s3.download_fileobj(BUCKET_NAME, file_path, file)

		with open(file_path, "rb") as file:
			content = file.read()
			img = Image.open(BytesIO(content))
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

	file_path = os.path.join(MEDIA_ROOT, file_name)
	compressed_file_path = file_path + ".gz"
	uncompressed_file_path = file_path

	response = s3.head_object(Bucket=BUCKET_NAME, Key=file_path)
	file_size = response["ContentLength"]

	if file_size > MAX_ALLOWED_FILE_SIZE_FOR_PREVIEW:
		return {"path": file_name, "content": None}

	folders_to_create = file_path.split(os.path.sep)[:-1]
	folders_to_create = os.path.sep.join(folders_to_create)

	os.makedirs(folders_to_create, exist_ok=True)

	# Скачиваем файл
	with open(compressed_file_path, "wb") as file:
		s3.download_fileobj(BUCKET_NAME, file_path, file)

	# Разжимаем файл
	with gzip.open(compressed_file_path, "rb") as f_in:
		with open(uncompressed_file_path, "wb") as f_out:
			shutil.copyfileobj(f_in, f_out)

	# Читаем контент
	with open(uncompressed_file_path, "rb") as file:
		content = file.read()
		content_base64 = base64.b64encode(content).decode("utf-8")

	# Удаляем временные файлы
	os.remove(compressed_file_path)
	os.remove(uncompressed_file_path)

	return {"path": uncompressed_file_path, "content": content_base64}
