FROM python:3.13.2-slim
WORKDIR /usr/src/app

# do not create files .pyc
ENV PYTHONDONTWRITEBYTECODE 1
# do not put stdout and stderr in a buffer
ENV PYTHONUNBUFFERED 1


RUN pip install --upgrade pip

COPY ./Services/django/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./Services/django/ .