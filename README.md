# ☁️ Cloud Notes Pro — Full DevOps Documentation

A production-grade Django note-taking application deployed on AWS with a complete CI/CD pipeline using Jenkins, Docker, ECR, and Auto Scaling Groups.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Application Features](#application-features)
- [Project Structure](#project-structure)
- [Local Development Setup](#local-development-setup)
- [Docker Setup](#docker-setup)
- [AWS Infrastructure](#aws-infrastructure)
- [Jenkins CI/CD Pipeline](#jenkins-cicd-pipeline)
- [GitHub Webhook Setup](#github-webhook-setup)
- [Environment Variables & SSM Parameter Store](#environment-variables--ssm-parameter-store)
- [EC2 Launch Template & User Data](#ec2-launch-template--user-data)
- [Custom AMI (Pre-baked)](#custom-ami-pre-baked)
- [Troubleshooting](#troubleshooting)
- [Security Checklist](#security-checklist)

---

## Project Overview

Cloud Notes Pro is a full-stack Django web application that allows users to create, organise, pin, search, and delete personal notes. It is containerised with Docker, pushed to DockerHub, and deployed automatically to AWS EC2 instances behind an Application Load Balancer via an Auto Scaling Group — all triggered by a GitHub webhook on every push to `main`.

---

## Architecture

```
Developer (git push)
        │
        ▼
  GitHub (main branch)
        │  webhook
        ▼
  Jenkins (EC2 t2.micro)
        │  docker build + push
        ▼
  DockerHub (shibilbasithcp/noteapp)
        │  ASG instance refresh
        ▼
  AWS Auto Scaling Group
  ┌─────────────────────────────────┐
  │  EC2 Instance (Ubuntu 24.04)    │
  │  ┌─────────┐   ┌─────────────┐ │
  │  │  Nginx  │──▶│  Gunicorn   │ │
  │  │  :80    │   │  :8000      │ │
  │  └─────────┘   └─────────────┘ │
  │         Docker Container        │
  └─────────────────────────────────┘
        │
        ▼
  Application Load Balancer (:80)
        │
        ▼
  Users (internet)
```

**Secrets flow:**
- All credentials stored in AWS SSM Parameter Store
- EC2 instances fetch secrets at boot via IAM instance role (no hardcoded credentials anywhere)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Application | Django 4.2, Python 3.12 |
| Web server | Gunicorn + Nginx |
| Database | AWS RDS (MySQL via PyMySQL) |
| Containerisation | Docker |
| Container registry | DockerHub |
| CI/CD | Jenkins |
| Source control | GitHub |
| Cloud | AWS (EC2, ALB, ASG, RDS, SSM, IAM) |
| OS | Ubuntu 24.04 LTS |
| Static files | WhiteNoise |

---

## Application Features

| Feature | Details |
|---|---|
| Authentication | Register, Login, Logout (Django built-in auth) |
| Notes CRUD | Create, View, Edit, Delete |
| Categories | Personal, Work, Ideas, To-Do, Other |
| Pin Notes | Pin important notes to the top |
| Search | Full-text search across title and content |
| Filter | Filter by category |
| Instance Banner | Footer shows hostname — useful for ALB demo |
| Responsive | Mobile, tablet, desktop |

---

## Project Structure

```
note-app/
├── cloudnotes_project/
│   ├── settings.py          # Env-driven settings
│   ├── urls.py
│   └── wsgi.py
├── notes/
│   ├── models.py            # Note model
│   ├── views.py             # CRUD + dashboard
│   └── forms.py
├── accounts/
│   ├── views.py             # Register / Login / Logout
│   └── urls.py
├── templates/
│   ├── base.html
│   ├── landing.html
│   ├── dashboard.html
│   ├── note_form.html
│   ├── note_detail.html
│   ├── note_confirm_delete.html
│   ├── partials/note_card.html
│   └── accounts/
│       ├── login.html
│       └── register.html
├── static/
│   ├── css/main.css
│   └── js/main.js
├── Dockerfile
├── Jenkinsfile
├── requirements.txt
└── manage.py
```

---

## Local Development Setup

```bash
# 1. Clone the repo
git clone https://github.com/Shibil-Basith/note-app.git
cd note-app

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set environment variables
export SECRET_KEY=your-secret-key
export DEBUG=True
export DB_NAME=cloudnotes
export DB_USER=root
export DB_PASSWORD=yourpassword
export DB_HOST=localhost
export DB_PORT=3306

# 5. Run migrations
python manage.py migrate

# 6. Run development server
python manage.py runserver
```

Open `http://127.0.0.1:8000`

---

## Docker Setup

### Dockerfile

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc default-libmysqlclient-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY . .

RUN mkdir -p /app/staticfiles && \
    SECRET_KEY=dummy-build-key \
    DEBUG=False \
    HTTPS_ENABLED=False \
    DB_HOST=localhost DB_NAME=dummy \
    DB_USER=dummy DB_PASSWORD=dummy \
    python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "cloudnotes_project.wsgi:application"]
```

### Build and run locally

```bash
docker build -t cloudnotes .

docker run -d \
  -p 8000:8000 \
  -e SECRET_KEY=your-secret-key \
  -e DEBUG=False \
  -e DB_HOST=your-db-host \
  -e DB_NAME=cloudnotes \
  -e DB_USER=dbuser \
  -e DB_PASSWORD=dbpassword \
  cloudnotes
```

---

## AWS Infrastructure

### Components

| Component | Details |
|---|---|
| Jenkins EC2 | t2.micro, Ubuntu, runs Jenkins in Docker |
| ASG EC2 instances | Ubuntu 24.04, pre-baked AMI |
| Application Load Balancer | HTTP :80, forwards to target group |
| Target Group | Port 80, health check path `/`, success codes `200-302` |
| RDS | MySQL, private subnet |
| SSM Parameter Store | All secrets stored as SecureString |

### IAM Role (attached to ASG EC2 instances)

The instance role must have these policies:
- `AmazonSSMReadOnlyAccess` — to fetch secrets from Parameter Store
- `AmazonEC2FullAccess` — EC2 operations
- `AutoScalingFullAccess` — ASG refresh

---

## Jenkins CI/CD Pipeline

### Jenkinsfile

```groovy
pipeline {
    agent any
    environment {
        IMAGE_NAME = "shibilbasithcp/noteapp"
        IMAGE_TAG  = "build-${env.BUILD_NUMBER}"
    }
    stages {
        stage('Clone Repo') {
            steps {
                git branch: 'main', url: 'https://github.com/Shibil-Basith/note-app.git'
            }
        }
        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest ."
            }
        }
        stage('Login to DockerHub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'USER',
                    passwordVariable: 'PASS'
                )]) {
                    sh 'echo $PASS | docker login -u $USER --password-stdin'
                }
            }
        }
        stage('Push Image') {
            steps {
                sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${IMAGE_NAME}:latest"
            }
        }
        stage('Deploy (ASG Refresh)') {
            steps {
                sh '''
                aws autoscaling start-instance-refresh \
                  --auto-scaling-group-name noteapp-server-asg \
                  --region ap-south-1
                '''
            }
        }
    }
    post {
        always {
            sh "docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true"
            sh "docker rmi ${IMAGE_NAME}:latest || true"
            sh 'docker logout'
        }
        failure {
            echo 'Pipeline failed — check logs above.'
        }
    }
}
```

### Jenkins Docker Setup

Jenkins runs inside Docker on a dedicated EC2 instance. The Docker socket is mounted so Jenkins can build images:

```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /usr/bin/docker:/usr/bin/docker \
  jenkins/jenkins:lts
```

Fix socket permissions if needed:

```bash
docker exec -u root -it jenkins chmod 666 /var/run/docker.sock
```

### Jenkins Credentials Required

| Credential ID | Type | Purpose |
|---|---|---|
| `dockerhub-creds` | Username/Password | Push image to DockerHub |

---

## GitHub Webhook Setup

Webhook enables automatic pipeline trigger on every `git push`.

### Steps

**1. In GitHub:**
- Go to repo → **Settings → Webhooks → Add webhook**

| Field | Value |
|---|---|
| Payload URL | `http://3.6.86.187:8080/github-webhook/` |
| Content type | `application/json` |
| Which events | Just the push event |
| Active | ✅ |

**2. In Jenkins:**
- Pipeline job → **Configure**
- Under **Build Triggers** → tick **GitHub hook trigger for GITScm polling**
- Save

**3. Test:**
```bash
git commit --allow-empty -m "Test webhook"
git push origin main
```

Check GitHub → Settings → Webhooks → Recent Deliveries for a green tick.

---

## Environment Variables & SSM Parameter Store

All secrets are stored in AWS SSM Parameter Store as `SecureString`:

| Parameter Name | Description |
|---|---|
| `/secret/key` | Django SECRET_KEY |
| `/db/host` | RDS endpoint |
| `/db/name` | Database name |
| `/db/user` | Database username |
| `/db/password` | Database password |
| `/db/port` | Database port (3306) |

### Settings.py key variables

```python
SECRET_KEY    = os.environ.get('SECRET_KEY')
DEBUG         = os.environ.get('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')
HTTPS_ENABLED = os.environ.get('HTTPS_ENABLED', 'False') == 'True'

SESSION_COOKIE_SECURE = HTTPS_ENABLED
CSRF_COOKIE_SECURE    = HTTPS_ENABLED
```

---

## EC2 Launch Template & User Data

Every new ASG instance runs this User Data script on boot:

```bash
#!/bin/bash
set -e

# Fetch secrets from SSM
SECRET_KEY=$(aws ssm get-parameter --name "/secret/key" --with-decryption --region ap-south-1 --query Parameter.Value --output text)
DB_HOST=$(aws ssm get-parameter --name "/db/host" --with-decryption --region ap-south-1 --query Parameter.Value --output text)
DB_NAME=$(aws ssm get-parameter --name "/db/name" --with-decryption --region ap-south-1 --query Parameter.Value --output text)
DB_USER=$(aws ssm get-parameter --name "/db/user" --with-decryption --region ap-south-1 --query Parameter.Value --output text)
DB_PASSWORD=$(aws ssm get-parameter --name "/db/password" --with-decryption --region ap-south-1 --query Parameter.Value --output text)
DB_PORT=$(aws ssm get-parameter --name "/db/port" --with-decryption --region ap-south-1 --query Parameter.Value --output text)

# Pull latest image
docker pull shibilbasithcp/noteapp:latest

# Stop old container if running
docker stop noteapp 2>/dev/null || true
docker rm noteapp 2>/dev/null || true

# Run new container
docker run -d \
  --name noteapp \
  --restart always \
  -p 8000:8000 \
  -e SECRET_KEY="$SECRET_KEY" \
  -e DEBUG="False" \
  -e HTTPS_ENABLED="False" \
  -e ALLOWED_HOSTS="*" \
  -e DB_HOST="$DB_HOST" \
  -e DB_NAME="$DB_NAME" \
  -e DB_USER="$DB_USER" \
  -e DB_PASSWORD="$DB_PASSWORD" \
  -e DB_PORT="$DB_PORT" \
  shibilbasithcp/noteapp:latest

systemctl restart nginx
```

> **Note:** Docker, Nginx, and AWS CLI are pre-installed in the custom AMI, so boot time is ~2-3 minutes instead of ~15 minutes.

---

## Custom AMI (Pre-baked)

To avoid installing Docker/Nginx/AWS CLI on every boot, a custom AMI is used.

### Baking the AMI

On a fresh Ubuntu 24.04 EC2:

```bash
# Install AWS CLI
sudo apt-get install -y ca-certificates curl nginx python3-pip unzip
sudo pip3 install awscli --break-system-packages

# Install Docker CE
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker

# Configure Nginx reverse proxy
sudo tee /etc/nginx/sites-available/noteapp <<'NGINXCONF'
server {
    listen 80;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXCONF
sudo ln -s /etc/nginx/sites-available/noteapp /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl enable --now nginx

# Pre-pull Docker image
sudo docker pull shibilbasithcp/noteapp:latest

# Cleanup
sudo apt-get clean
sudo cloud-init clean
```

Then create the AMI:

```bash
aws ec2 create-image \
  --instance-id <instance-id> \
  --name "noteapp-ami-v1" \
  --description "Pre-baked AMI with Docker, Nginx, AWS CLI" \
  --no-reboot \
  --region ap-south-1
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `docker: not found` in Jenkins | Docker socket not mounted | Remount Jenkins with `-v /var/run/docker.sock:/var/run/docker.sock` |
| `permission denied` on Docker socket | Jenkins user lacks permission | `docker exec -u root -it jenkins chmod 666 /var/run/docker.sock` |
| `Dockerfile not found` | Missing from repo root | Add `Dockerfile` to project root |
| `ModuleNotFoundError: pymysql` | Missing from requirements.txt | Add `pymysql>=1.1.0` to `requirements.txt` |
| `collectstatic` fails in Docker build | `SECRET_KEY` not set at build time | Pass dummy env vars in `RUN` step |
| `502 Bad Gateway` from ALB | App not running or wrong port | Check target group health check port matches app port |
| Instances unhealthy in target group | Health check returning non-2xx | Set success codes to `200-302` in target group |
| `aws: not found` on EC2 | AWS CLI not installed | Use pre-baked AMI or install via pip |
| Login/register not working | `CSRF_COOKIE_SECURE=True` over HTTP | Set `HTTPS_ENABLED=False` in docker run env vars |
| `500 Server Error` | Missing `staticfiles/` directory | Add `collectstatic` to Dockerfile build step |
| Slow ASG boot (~15 min) | Installing tools from scratch | Use pre-baked custom AMI |

---

## Security Checklist

- [x] `DEBUG=False` in production
- [x] `SECRET_KEY` stored in SSM Parameter Store, never in code
- [x] Database credentials in SSM, fetched at runtime
- [x] No AWS access keys hardcoded — IAM instance role used
- [x] DockerHub credentials stored in Jenkins credential store
- [x] RDS in private subnet, not publicly accessible
- [x] Security group: EC2 instances only accept traffic from ALB
- [x] `HTTPS_ENABLED` flag to toggle secure cookies when HTTPS is ready
- [ ] HTTPS via AWS ACM + ALB (pending domain setup)
- [ ] `SECURE_SSL_REDIRECT=True` (enable after HTTPS)
- [ ] Rotate `SECRET_KEY` periodically

---

## CI/CD Flow Summary

```
git push origin main
       │
       ▼ (webhook)
Jenkins pulls latest code
       │
       ▼
docker build (two tags: latest + build-N)
       │
       ▼
docker push to DockerHub
       │
       ▼
aws autoscaling start-instance-refresh
       │
       ▼
New EC2 instance launches from pre-baked AMI
       │
       ▼
User Data: fetches secrets from SSM → docker pull → docker run
       │
       ▼
Nginx proxies :80 → Gunicorn :8000
       │
       ▼
ALB health check passes → traffic routes to new instance
       │
       ▼
Old instance terminated
```

Total time from `git push` to live: **~5-8 minutes** with pre-baked AMI.

---

*Built by Shibil Basith CP — M.Sc. Computer Science*
