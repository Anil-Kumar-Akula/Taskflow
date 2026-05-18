# TaskFlow — Deployment Guide (For DevOps Engineers)

## What You're Deploying

| Service     | Tech           | Role                                      |
|-------------|----------------|-------------------------------------------|
| `mongo`     | MongoDB 7      | Database                                  |
| `backend`   | Node.js/Express | REST API + Email + Cron job              |
| `frontend`  | React + Nginx  | Web UI (also proxies /api → backend)     |

---

## Step 1 — Server Requirements

- **OS:** Ubuntu 22.04 LTS (recommended)
- **RAM:** Minimum 1 GB (2 GB recommended)
- **CPU:** 1 vCPU minimum
- **Port 80 open** in your firewall/security group

```bash
# Install Docker & Docker Compose on Ubuntu
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker --now
sudo usermod -aG docker $USER
# Log out and back in
```

---

## Step 2 — Transfer the Project

**Option A: From your local machine**
```bash
scp -r taskflow/ user@YOUR_SERVER_IP:/home/user/
```

**Option B: Git (recommended)**
```bash
# On server:
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
```

---

## Step 3 — Configure Email (REQUIRED)

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://mongo:27017/taskflow
JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_STRING_32_CHARS

# Gmail SMTP (recommended for teams)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourteam@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx   # <-- Gmail App Password (NOT your regular password)
EMAIL_FROM=TaskFlow <yourteam@gmail.com>

FRONTEND_URL=http://YOUR_SERVER_IP
```

### How to get Gmail App Password:
1. Go to myaccount.google.com
2. Security → 2-Step Verification (enable it)
3. Security → App passwords
4. Create one named "TaskFlow"
5. Copy the 16-char password → paste as SMTP_PASS

> **Use a company Gmail account**, not your personal one.

---

## Step 4 — Deploy

```bash
cd taskflow
docker compose up -d --build
```

This will:
- Build frontend React app into static files
- Build backend Node.js app
- Start MongoDB with persistent volume
- Start everything connected

**Check it's running:**
```bash
docker compose ps
docker compose logs -f backend   # watch backend logs
```

---

## Step 5 — Create Manager Account (First Time Only)

Open browser: `http://YOUR_SERVER_IP/setup`

Fill in:
- Your name
- Your work email
- Password

This creates the first manager account. This page **auto-disables** after first use.

---

## Step 6 — Verify Everything Works

1. Login at `http://YOUR_SERVER_IP/login`
2. Go to **Team → Add Employee** — creates employee + sends welcome email
3. Go to **Tasks → Assign Task** — sends email notification to employee
4. Login as employee, pick up the task, complete it
5. Login as manager, approve it
6. Go to **Reports → Send to My Email** — sends weekly report

---

## Useful Commands

```bash
# View running containers
docker compose ps

# See backend logs (email sending, errors)
docker compose logs -f backend

# Restart everything
docker compose restart

# Stop everything
docker compose down

# Stop and DELETE all data (careful!)
docker compose down -v

# Update after code changes
docker compose up -d --build
```

---

## Optional: HTTPS with Let's Encrypt

If you have a domain name (e.g., taskflow.yourcompany.com):

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d taskflow.yourcompany.com

# Then update frontend/nginx.conf to add SSL config
# and update FRONTEND_URL in .env to https://taskflow.yourcompany.com
```

---

## Optional: Run on Port 8080 Instead of 80

Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:80"
```

Then access at `http://YOUR_SERVER_IP:8080`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Can't connect to site | Check `docker compose ps`, ensure frontend is running, port 80 open in firewall |
| Emails not sending | Check `docker compose logs backend` for SMTP errors; verify Gmail App Password |
| Setup page says "already done" | Normal — account already created, just login |
| Database data lost | It's stored in Docker volume `mongo_data`. Never run `docker compose down -v` in production |
| Backend can't reach mongo | Wait 10 sec and retry; mongo needs time to start |

---

## How Weekly Reports Work

- **Automatic:** Every Monday at 8:00 AM, the system emails a full weekly report to all managers automatically.
- **Manual:** Manager can go to **Reports** page and click **"Send to My Email"** anytime.
- The report includes: tasks assigned, completed, approved per employee, completion rates.

---

## Application Flow Summary

```
Manager creates employee (welcome email sent)
         ↓
Manager assigns task (email sent to employee)
         ↓
Employee logs in → Picks up task (Pending → In Progress)
         ↓
Employee marks task Complete (adds completion note)
         ↓
Manager reviews → Approves ✅ or Sends Back ↩
         ↓
Task marked Approved → used in yearly increment dashboard
         ↓
Weekly report auto-sent every Monday (or manually any time)
```
