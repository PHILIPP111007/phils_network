FROM python:3.13.9-slim
WORKDIR /app

RUN pip install --upgrade pip

COPY ./Services/fastapi/requirements.txt .
RUN pip install -r requirements.txt

COPY ./pyproject.toml .
COPY ./Services/fastapi/ .

# do not put stdout and stderr in a buffer
ENV PYTHONUNBUFFERED=1