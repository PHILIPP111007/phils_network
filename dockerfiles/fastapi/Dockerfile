FROM python:3.13.2-slim
WORKDIR /app

# do not put stdout and stderr in a buffer
ENV PYTHONUNBUFFERED 1

RUN pip install --upgrade pip

COPY ./Services/fastapi/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./Services/fastapi/ .