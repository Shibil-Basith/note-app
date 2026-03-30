FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY . .

# Collect static files at build time
RUN mkdir -p /app/staticfiles && \
    SECRET_KEY=dummy-build-key \
    DEBUG=False \
    HTTPS_ENABLED=False \
    DB_HOST=localhost \
    DB_NAME=dummy \
    DB_USER=dummy \
    DB_PASSWORD=dummy \
    python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "cloudnotes_project.wsgi:application"]
