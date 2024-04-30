FROM python:3.12.3-slim
WORKDIR /usr/src/app

# не создавать файлы кэша .pyc
ENV PYTHONDONTWRITEBYTECODE 1
# не помещать в буфер потоки stdout и stderr
ENV PYTHONUNBUFFERED 1


RUN pip install --upgrade pip

COPY ./Services/django/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./Services/django/ .

CMD bash gunicorn.sh