# Docker Deploy To EC2 With Jenkins

This Docker setup runs:

- `postgres`: PostgreSQL 15
- `redis`: Redis 7
- `backend`: Spring Boot API
- `frontend`: Nginx serving the Vite build and proxying `/api` to the backend

## EC2 Setup

Install Docker on Amazon Linux 2023:

```bash
sudo dnf update -y
sudo dnf install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user
sudo usermod -aG docker jenkins
```

Log out and SSH back in so group changes apply.

If host Nginx is already using port 80, stop it before using Docker frontend:

```bash
sudo systemctl disable --now nginx
```

## Jenkins Job

Use a Pipeline job from SCM:

- Repository URL: `https://github.com/ducnm2412/KCPM.git`
- Branch: `*/master`
- Script Path: `Jenkinsfile.docker`

Build parameters:

- `EC2_HOST`: `localhost`
- `EC2_USER`: `ec2-user`
- `EC2_SSH_CREDENTIALS_ID`: `ec2-ssh-key`
- `APP_PATH`: `/opt/uth-confms-docker`

## Environment File

On first deploy, the script creates:

```bash
/opt/uth-confms-docker/.env.prod
```

Edit it before production use:

```bash
sudo nano /opt/uth-confms-docker/.env.prod
```

At minimum, set:

```env
POSTGRES_PASSWORD=your-strong-password
JWT_SECRET=your-secret-minimum-32-characters
FRONTEND_URL=http://52.65.141.96
CORS_ALLOWED_ORIGINS=http://52.65.141.96
```

Then redeploy from Jenkins or run:

```bash
cd /opt/uth-confms-docker
sudo docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## Useful Checks

```bash
cd /opt/uth-confms-docker
sudo docker compose -f docker-compose.prod.yml ps
sudo docker compose -f docker-compose.prod.yml logs -f backend
curl -i http://localhost/actuator/health
```
