# Jenkins Deploy To AWS EC2

This project can be deployed from Jenkins to EC2 by building:

- Backend: Spring Boot JAR from `backend/target/confms-1.0.0.jar`
- Frontend: Vite static files from `frontend/dist`

## EC2 Setup

Install runtime packages on the EC2 instance:

```bash
sudo apt update
sudo apt install -y openjdk-17-jre nginx rsync
```

Create the app directories:

```bash
sudo mkdir -p /opt/uth-confms /var/www/uth-confms /etc/uth-confms
sudo chown -R ubuntu:ubuntu /opt/uth-confms
```

Create `/etc/uth-confms/uth-confms.env`:

```env
SERVER_PORT=8080
DB_URL=jdbc:postgresql://your-db-host:5432/uth_confms
DB_USERNAME=postgres
DB_PASSWORD=change-me
JWT_SECRET=change-me-minimum-32-characters
REDIS_HOST=localhost
REDIS_PORT=6379
FRONTEND_URL=http://your-domain-or-ec2-ip
CORS_ALLOWED_ORIGINS=http://your-domain-or-ec2-ip
OAUTH2_ENABLED=false
AI_ENABLED=false
RATE_LIMITING_USE_REDIS=false
FILE_STORAGE_PATH=/data/uploads
STORAGE_BASE_DIR=/data/uploads
```

Install the systemd service and Nginx config:

```bash
sudo cp deploy/ec2/uth-confms.service /etc/systemd/system/uth-confms.service
sudo cp deploy/ec2/nginx.conf /etc/nginx/sites-available/uth-confms
sudo ln -s /etc/nginx/sites-available/uth-confms /etc/nginx/sites-enabled/uth-confms
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl daemon-reload
sudo systemctl enable uth-confms
sudo nginx -t
sudo systemctl restart nginx
```

Allow the Jenkins SSH user to restart the service and reload Nginx without a password:

```bash
sudo visudo
```

Add this line, adjusting the username if your EC2 user is not `ubuntu`:

```text
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/systemctl daemon-reload, /usr/bin/systemctl restart uth-confms, /usr/bin/systemctl reload nginx, /usr/bin/install, /usr/bin/mkdir, /usr/bin/tar, /usr/bin/rsync, /usr/bin/find, /usr/bin/rm
```

## Jenkins Setup

Install Jenkins plugins:

- Pipeline
- Git
- SSH Agent

Create a Jenkins credential:

- Kind: SSH Username with private key
- ID: `ec2-ssh-key`
- Username: `ubuntu`
- Private key: the EC2 key that can SSH into the instance

Create a Pipeline job from SCM and point it to this repository. The pipeline uses `Jenkinsfile`.

Set these build parameters:

- `EC2_HOST`: EC2 public IP or domain
- `EC2_USER`: `ubuntu` for Ubuntu AMIs, or your actual SSH user
- `EC2_SSH_CREDENTIALS_ID`: `ec2-ssh-key`
- `DEPLOY_PATH`: `/opt/uth-confms`
- `FRONTEND_PATH`: `/var/www/uth-confms`
- `SERVICE_NAME`: `uth-confms`

Deployment runs only on the `main` branch.

## AWS Security Group

Open inbound ports:

- `22`: SSH from Jenkins server IP only
- `80`: HTTP from users
- `443`: HTTPS if you add TLS later

Do not expose port `8080` publicly. Nginx proxies `/api` to the backend locally.
