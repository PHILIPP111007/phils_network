FROM python:3.13.9-slim
WORKDIR /app

RUN pip install --upgrade pip

COPY ./Services/django/requirements.txt .
RUN pip install -r requirements.txt

COPY ./pyproject.toml .
COPY ./Services/django/ .

# do not put stdout and stderr in a buffer
ENV PYTHONUNBUFFERED=1