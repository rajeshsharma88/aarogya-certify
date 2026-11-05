# Aarogya Certify - Coolify Deployment Guide

**Target:** VPS 187.127.145.225  
**Platform:** Coolify + Supabase  
**Status:** Ready to Deploy

---

## Prerequisites

✅ VPS 187.127.145.225 with:
- [ ] Coolify installed and running
- [ ] Supabase installed inside Coolify
- [ ] Docker installed
- [ ] Node.js 18+ available
- [ ] Git installed

---

## Step 1: Clone Repository to VPS

```bash
# SSH into your VPS
ssh root@187.127.145.225

# Navigate to application directory
cd /opt/coolify/applications

# Clone the Aarogya Certify repository
git clone https://github.com/rajeshsharma88/aarogya-certify.git
cd aarogya-certify

# Checkout main branch
git checkout main
```

---

## Step 2: Configure Supabase Connection

### 2.1 Get Supabase Credentials from Coolify

```bash
# SSH into Coolify's Supabase container
docker exec -it supabase_postgres psql -U postgres

# Get the following details:
# - POSTGRES_HOST: localhost (or supabase container name)
# - POSTGRES_PORT: 5432
# - POSTGRES_DB: postgres
# - POSTGRES_PASSWORD: (from Coolify Supabase config)
# - POSTGRES_USER: postgres (or your configured user)
```

### 2.2 Create Supabase Project URL

In Coolify, find your Supabase instance:
- Project URL format: `http://supabase-service:3000` (internal) or `https://yourdomain.supabase.co` (external)
- Anon Key: Available in Supabase dashboard
- Service Role Key: Available in Supabase dashboard

### 2.3 Create .env.production file

```bash
cd /opt/coolify/applications/aarogya-certify/app

cat > .env.production << 'EOF'
# Deployment
NODE_ENV=production
VITE_DATA_BACKEND=supabase

# Supabase Configuration
VITE_SUPABASE_URL=http://supabase-service:3000
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Payment Gateway (Razorpay)
VITE_RAZORPAY_KEY_ID=YOUR_RAZORPAY_LIVE_KEY_ID

# LinkedIn OAuth
VITE_LINKEDIN_CLIENT_ID=YOUR_LINKEDIN_CLIENT_ID

# Logging & Monitoring
VITE_LOG_PAYMENTS=true
NODE_LOG_LEVEL=info
EOF
```

Replace `YOUR_*` values with actual credentials.

---

## Step 3: Run Database Migrations

### 3.1 Connect to Supabase Database

```bash
# From the VPS, connect to Supabase
cd /opt/coolify/applications/aarogya-certify

# Option A: Using Docker (if Supabase is containerized)
docker exec -it supabase_postgres psql \
  -U postgres \
  -d postgres \
  -h localhost

# Option B: Direct connection
psql -U postgres -h localhost -d postgres -p 5432
```

### 3.2 Run Migrations

```bash
# Once connected to PostgreSQL, run each migration in order:

# Migration 1: Initial schema
\i supabase/migrations/0001_init.sql

# Migration 2: Hindi localization
\i supabase/migrations/0002_add_hindi_localization.sql

# Migration 3: Payment system
\i supabase/migrations/0003_add_payments.sql

# Verify tables created
\dt

# Exit
\q
```

### 3.3 Verify Migrations

```bash
# Check tables exist
psql -U postgres -h localhost -d postgres -c "\dt"

# Should see:
# - domains
# - certifications
# - questions
# - question_options
# - attempts
# - results
# - certificates
# - payment_orders
# - payment_invoices
# - certificate_downloads
# - linkedin_shares
# - verification_logs
```

---

## Step 4: Create Coolify Application

### 4.1 Create Docker Build Configuration

```bash
# Create Dockerfile for the app
cat > /opt/coolify/applications/aarogya-certify/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY app/package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY app/ ./

# Copy Supabase migrations
COPY supabase/ ../supabase/

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "run", "preview"]
EOF
```

### 4.2 Create docker-compose.yml

```bash
cat > /opt/coolify/applications/aarogya-certify/docker-compose.yml << 'EOF'
version: '3.8'

services:
  aarogya-certify:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      VITE_DATA_BACKEND: supabase
      VITE_SUPABASE_URL: http://supabase-service:3000
      VITE_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      VITE_RAZORPAY_KEY_ID: ${RAZORPAY_KEY_ID}
      VITE_LINKEDIN_CLIENT_ID: ${LINKEDIN_CLIENT_ID}
    depends_on:
      - supabase-service
    networks:
      - coolify-network
    restart: always

  supabase-service:
    external: true
    networks:
      - coolify-network

networks:
  coolify-network:
    external: true
EOF
```

---

## Step 5: Deploy via Coolify Dashboard

### 5.1 Create New Application in Coolify

1. Open Coolify Dashboard: `https://coolify.yourdomain.com`
2. Go to **Applications** → **New Application**
3. Select **Docker Compose**
4. Fill in details:
   - **Name:** Aarogya Certify
   - **Repository URL:** `https://github.com/rajeshsharma88/aarogya-certify.git`
   - **Branch:** main
   - **Base Directory:** `.`
   - **Compose File:** `docker-compose.yml`

### 5.2 Set Environment Variables in Coolify

In Coolify application settings, add:

```
NODE_ENV=production
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=http://supabase-service:3000
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key
VITE_LINKEDIN_CLIENT_ID=your_linkedin_id
VITE_LOG_PAYMENTS=true
```

### 5.3 Configure Port Binding

- **Container Port:** 3000
- **Host Port:** 3000
- **Public Port:** 443 (HTTPS via Coolify proxy)

### 5.4 Deploy

1. Click **Deploy**
2. Monitor logs in Coolify dashboard
3. Wait for build to complete

---

## Step 6: Configure Domain & SSL

### 6.1 Set Custom Domain in Coolify

1. In application settings, go to **Domains**
2. Add your domain: `aarogya.yourdomain.com`
3. Enable **SSL Certificate** (Coolify auto-generates)
4. Save

### 6.2 Update DNS Records

Add DNS record:
```
aarogya.yourdomain.com  A  187.127.145.225
```

Wait for DNS propagation (5-30 minutes).

---

## Step 7: Configure Payment Gateway (Supabase Backend)

### 7.1 Create Backend Environment File

```bash
cat > /opt/coolify/applications/aarogya-certify/.env.backend << 'EOF'
# Razorpay (Production)
RAZORPAY_KEY_SECRET=your_razorpay_secret

# LinkedIn OAuth
LINKEDIN_CLIENT_SECRET=your_linkedin_secret

# Email Service
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@aarogya.yourdomain.com

# Database (Supabase)
DATABASE_URL=postgresql://postgres:password@supabase-service:5432/postgres

# Logging
SENTRY_DSN=your_sentry_dsn
EOF

chmod 600 .env.backend
```

### 7.2 Set as Secret in Coolify

1. Go to application → **Secrets**
2. Upload `.env.backend` as secret variables
3. Or manually add each variable:
   - `RAZORPAY_KEY_SECRET`
   - `LINKEDIN_CLIENT_SECRET`
   - `SENDGRID_API_KEY`

---

## Step 8: Verify Deployment

### 8.1 Check Application Status

```bash
# SSH into VPS
ssh root@187.127.145.225

# Check Docker containers
docker ps | grep aarogya

# Check logs
docker logs -f aarogya-certify
```

### 8.2 Test Application

```bash
# From your local machine
curl -I https://aarogya.yourdomain.com

# Should return 200 OK

# Test API endpoint
curl -X GET https://aarogya.yourdomain.com/api/health
```

### 8.3 Verify Database Connection

```bash
# SSH to VPS, check Supabase connection
docker exec aarogya-certify npm run test:db

# Or from Node console
docker exec -it aarogya-certify node -e "
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );
  supabase.from('domains').select('*').then(r => console.log(r));
"
```

---

## Step 9: Configure Monitoring & Backups

### 9.1 Enable Coolify Monitoring

1. Go to application → **Monitoring**
2. Enable:
   - [ ] CPU monitoring
   - [ ] Memory monitoring
   - [ ] Disk monitoring
   - [ ] Network monitoring

### 9.2 Configure Backups

```bash
# Set up daily backups
cd /opt/coolify/applications/aarogya-certify

# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/aarogya-certify"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
pg_dump -U postgres -h supabase-service postgres > \
  $BACKUP_DIR/db_backup_$TIMESTAMP.sql

# Compress
gzip $BACKUP_DIR/db_backup_$TIMESTAMP.sql

# Keep only 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $TIMESTAMP"
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /opt/coolify/applications/aarogya-certify/backup.sh" | crontab -
```

---

## Step 10: Post-Deployment Checklist

- [ ] Application deployed and running
- [ ] Domain accessible via HTTPS
- [ ] SSL certificate valid
- [ ] Database migrations completed
- [ ] Supabase connection verified
- [ ] Razorpay credentials configured
- [ ] LinkedIn OAuth configured
- [ ] Monitoring enabled
- [ ] Backups scheduled
- [ ] Error tracking configured
- [ ] Email service configured
- [ ] Logging active

---

## Troubleshooting

### Issue: Application won't start

```bash
# Check logs
docker logs -f aarogya-certify

# Rebuild without cache
docker-compose build --no-cache

# Restart
docker-compose restart aarogya-certify
```

### Issue: Database connection fails

```bash
# Verify Supabase is running
docker ps | grep supabase

# Check network connectivity
docker exec aarogya-certify ping supabase-service

# Verify credentials
docker exec aarogya-certify env | grep SUPABASE
```

### Issue: Migrations didn't run

```bash
# Manually run migrations
docker exec -it supabase_postgres psql -U postgres -d postgres << 'EOF'
\i /path/to/supabase/migrations/0001_init.sql
\i /path/to/supabase/migrations/0002_add_hindi_localization.sql
\i /path/to/supabase/migrations/0003_add_payments.sql
EOF
```

### Issue: HTTPS not working

```bash
# Verify SSL certificate
docker exec aarogya-certify ls -la /etc/letsencrypt/live/

# Check Coolify reverse proxy
docker logs coolify-reverse-proxy | grep aarogya
```

---

## Performance Tuning

### 8.1 Enable Caching Headers

Add to Coolify environment:
```
CACHE_CONTROL_ASSETS=public, max-age=31536000
CACHE_CONTROL_PAGES=public, max-age=3600
```

### 8.2 Enable Gzip Compression

In Coolify reverse proxy settings:
- [ ] Enable gzip compression
- [ ] Set compression level: 6
- [ ] Compression types: `text/*, application/json`

### 8.3 Database Connection Pooling

Configure in Supabase:
- Connection timeout: 30s
- Max connections: 100
- Min connections: 10

---

## Accessing Application

**Frontend:** `https://aarogya.yourdomain.com`

**Default Test User (if using demo data):**
```
Email: candidate@example.com
Password: (check LocalProvider demo setup)
```

**Admin Panel:** `https://aarogya.yourdomain.com/admin`

**Dashboard:** `https://aarogya.yourdomain.com/dashboard`

---

## Next Steps

1. **Monitor:** Check application health daily
2. **Test:** Run through payment flow to verify
3. **Configure:** Set up email notifications
4. **Optimize:** Monitor performance and adjust as needed
5. **Promote:** Tell users about the new payment system!

---

## Support

For issues:
1. Check Coolify logs: `docker logs -f aarogya-certify`
2. Check database: `psql` query errors
3. Test Razorpay: Use their sandbox
4. Review: `PRODUCTION-DEPLOYMENT.md` checklist

---

**Deployment Complete!** 🚀

Application is running on: `https://aarogya.yourdomain.com`

