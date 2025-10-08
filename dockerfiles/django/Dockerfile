FROM python:3.13.8-slim
WORKDIR /app

# do not put stdout and stderr in a buffer
ENV PYTHONUNBUFFERED 1

RUN pip install --upgrade pip

COPY ./Services/django/requirements.txt .
RUN pip install -r requirements.txt

COPY ./pyproject.toml .
COPY ./Services/django/ .