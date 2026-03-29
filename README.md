# ☁️ Cloud Notes Pro

A premium, production-ready Django note-taking application with a dark glassmorphism UI — built for AWS EC2 + Gunicorn + Nginx deployments.

---

## 🚀 Quick Start (Local)

```bash
# 1. Clone / unzip the project
cd cloudnotes

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Apply migrations
python manage.py migrate

# 5. (Optional) Create a superuser for /admin
python manage.py createsuperuser

# 6. Run the development server
python manage.py runserver
```

Open http://127.0.0.1:8000 — register, log in, and start taking notes!

---

## 🗂️ Project Structure

```
cloudnotes/
├── cloudnotes_project/        # Django project config
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── notes/                     # Notes app
│   ├── models.py              # Note model
│   ├── views.py               # CRUD + dashboard views
│   ├── forms.py               # NoteForm
│   ├── admin.py
│   └── migrations/
├── accounts/                  # Auth app
│   ├── views.py               # Register / Login / Logout
│   └── urls.py
├── templates/
│   ├── base.html              # Shared layout w/ sidebar & footer
│   ├── landing.html           # Public landing page
│   ├── dashboard.html         # Notes dashboard
│   ├── note_form.html         # Create / Edit note
│   ├── note_detail.html       # Note viewer
│   ├── note_confirm_delete.html
│   ├── partials/
│   │   └── note_card.html     # Reusable note card
│   └── accounts/
│       ├── login.html
│       └── register.html
├── static/
│   ├── css/main.css           # Full design system
│   └── js/main.js             # Interactions & animations
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🔑 Features

| Feature | Details |
|---|---|
| Authentication | Register, Login, Logout via Django's built-in auth |
| Notes CRUD | Create, View, Edit, Delete notes |
| Categories | Personal, Work, Ideas, To-Do, Other |
| Pin Notes | Pin important notes to the top |
| Search | Full-text search across title & content |
| Filter | Filter by category |
| Instance Banner | Footer shows **hostname** for load balancer demos |
| Responsive | Mobile, tablet, desktop fully supported |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and set:

```env
SECRET_KEY=your-very-long-random-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-ec2-ip
```

---

## 🏭 Production Deployment on AWS EC2

### 1 — Server Setup (Ubuntu 22.04)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip python3-venv nginx -y
```

### 2 — Upload & Install App

```bash
# Upload cloudnotes/ to /home/ubuntu/cloudnotes
cd /home/ubuntu/cloudnotes
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3 — Environment & Database

```bash
cp .env.example .env
nano .env   # Set SECRET_KEY, DEBUG=False, ALLOWED_HOSTS

python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### 4 — Gunicorn Systemd Service

```bash
sudo nano /etc/systemd/system/cloudnotes.service
```

```ini
[Unit]
Description=Cloud Notes Pro — Gunicorn
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/cloudnotes
EnvironmentFile=/home/ubuntu/cloudnotes/.env
ExecStart=/home/ubuntu/cloudnotes/venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/run/cloudnotes.sock \
    cloudnotes_project.wsgi:application

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudnotes
sudo systemctl start cloudnotes
```

### 5 — Nginx Config

```bash
sudo nano /etc/nginx/sites-available/cloudnotes
```

```nginx
server {
    listen 80;
    server_name your-domain.com your-ec2-ip;

    location /static/ {
        alias /home/ubuntu/cloudnotes/staticfiles/;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/run/cloudnotes.sock;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/cloudnotes /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6 — Load Balancer Demo

Every page footer shows:

```
🖥 Served by instance: ip-10-0-1-42
```

This **hostname changes per EC2 instance** behind an ALB — perfect for demonstrating load balancing in action.

---

## 🔒 Security Checklist for Production

- [ ] `DEBUG=False` in `.env`
- [ ] Strong `SECRET_KEY` (50+ random chars)
- [ ] `ALLOWED_HOSTS` set to your domain/IP only
- [ ] HTTPS via AWS ACM + ALB or Let's Encrypt (Certbot)
- [ ] Security group: allow only 80/443 from internet
- [ ] Rotate `SECRET_KEY` if ever exposed

---

## 🛠️ Useful Commands

```bash
# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell

# Check deployment issues
python manage.py check --deploy

# Restart service after code changes
sudo systemctl restart cloudnotes
```
