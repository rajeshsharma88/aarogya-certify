# Aarogya Certify - Migration to Coolify Checklist

**VPS:** 187.127.145.225  
**Platform:** Coolify + Supabase  
**Timeline:** ~1 hour

---

## Pre-Migration (Preparation)

- [ ] VPS access confirmed (SSH to 187.127.145.225)
- [ ] Coolify dashboard accessible
- [ ] Supabase running inside Coolify
- [ ] Git installed on VPS
- [ ] Docker available
- [ ] Node.js 18+ available

---

## Phase 1: Code Deployment (10 min)

```bash
# 1. SSH to VPS
ssh root@187.127.145.225

# 2. Navigate to applications
cd /opt/coolify/applications

# 3. Clone repository
git clone https://github.com/rajeshsharma88/aarogya-certify.git
cd aarogya-certify

# 4. Verify clone
ls -la
# Should see: app/, supabase/, DEPLOYMENT-COOLIFY.md, etc.
```

**Validation:** All files present ✓

---

## Phase 2: Database Migration (15 min)

```bash
# 1. Get Supabase credentials from Coolify
# - Project URL
# - Anon Key  
# - Database password

# 2. Connect to database
psql -U postgres -h localhost -d postgres -p 5432

# 3. Run migrations (in PostgreSQL)
\i supabase/migrations/0001_init.sql
\i supabase/migrations/0002_add_hindi_localization.sql
\i supabase/migrations/0003_add_payments.sql

# 4. Verify tables
\dt

# Expected: 13 tables including:
# - payment_orders ✓
# - payment_invoices ✓
# - linkedin_shares ✓

# 5. Exit
\q
```

**Validation:** All tables created ✓

---

## Phase 3: Environment Configuration (10 min)

```bash
# 1. Navigate to app directory
cd /opt/coolify/applications/aarogya-certify/app

# 2. Create .env.production
cat > .env.production << 'EOF'
NODE_ENV=production
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=http://supabase-service:3000
VITE_SUPABASE_ANON_KEY=<your_key>
VITE_RAZORPAY_KEY_ID=<your_key>
VITE_LINKEDIN_CLIENT_ID=<your_key>
VITE_LOG_PAYMENTS=true
EOF

# 3. Verify file
cat .env.production

# 4. Create .env.backend (secrets)
cat > .env.backend << 'EOF'
RAZORPAY_KEY_SECRET=<your_secret>
LINKEDIN_CLIENT_SECRET=<your_secret>
DATABASE_URL=postgresql://postgres:password@supabase-service:5432/postgres
EOF

chmod 600 .env.backend
```

**Validation:** Environment files created ✓

---

## Phase 4: Coolify Application Setup (15 min)

```bash
# 1. In Coolify Dashboard:
#    - Go to Applications → New Application
#    - Select: Docker Compose
#    - Repository: https://github.com/rajeshsharma88/aarogya-certify.git
#    - Branch: main
#    - Compose File: docker-compose.yml

# 2. Add Environment Variables in Coolify:
#    - NODE_ENV: production
#    - VITE_DATA_BACKEND: supabase
#    - VITE_SUPABASE_URL: http://supabase-service:3000
#    - VITE_SUPABASE_ANON_KEY: (from Supabase)
#    - VITE_RAZORPAY_KEY_ID: (from Razorpay)
#    - VITE_LINKEDIN_CLIENT_ID: (from LinkedIn)

# 3. Configure Ports:
#    - Container Port: 3000
#    - Host Port: 3000
#    - Public: Yes (HTTPS)

# 4. Click Deploy
```

**Validation:** Application deployed in Coolify ✓

---

## Phase 5: Domain & SSL (10 min)

```bash
# 1. In Coolify application settings:
#    - Go to Domains
#    - Add: aarogya.yourdomain.com
#    - Enable SSL: Yes (auto-generate)

# 2. Update DNS:
#    - aarogya.yourdomain.com A 187.127.145.225

# 3. Wait for DNS propagation (5-30 min)

# 4. Test:
curl -I https://aarogya.yourdomain.com
# Should return 200 OK
```

**Validation:** Domain accessible via HTTPS ✓

---

## Phase 6: Verification (10 min)

```bash
# 1. Check application is running
ssh root@187.127.145.225
docker ps | grep aarogya

# 2. Check logs
docker logs -f aarogya-certify | head -50
# Look for: "built in X ms"

# 3. Test homepage
curl -s https://aarogya.yourdomain.com | head -20
# Should contain: <!DOCTYPE html>

# 4. Test database connection
docker exec aarogya-certify npm run test:db

# 5. Test API
curl -X GET https://aarogya.yourdomain.com/api/health

# 6. Check Supabase connection
psql -U postgres -h localhost -d postgres \
  -c "SELECT count(*) as domains_count FROM domains;"
# Should return: 8 (pre-loaded domains)
```

**Validation:** Everything working ✓

---

## Post-Migration Configuration

```bash
# 1. Set up monitoring
# In Coolify: Application → Monitoring → Enable

# 2. Configure backups
cd /opt/coolify/applications/aarogya-certify
chmod +x backup.sh
# Add to crontab for daily backups

# 3. Configure email notifications
# Set up SendGrid or similar in environment

# 4. Test payment flow
# 1. Go to https://aarogya.yourdomain.com
# 2. Take a test assessment
# 3. Try payment checkout (use Razorpay sandbox)

# 5. Test LinkedIn sharing
# 1. Set up OAuth locally
# 2. Test share button
```

---

## Quick Troubleshooting

### Application not starting?
```bash
docker logs -f aarogya-certify
# Check for errors, rebuild: docker-compose build --no-cache
```

### Database not accessible?
```bash
docker exec aarogya-certify psql -U postgres -h supabase-service -d postgres -c "SELECT 1;"
# If fails, verify Supabase is running
docker ps | grep supabase
```

### Domain not resolving?
```bash
dig aarogya.yourdomain.com
# Should show: 187.127.145.225
# Wait for DNS TTL expiry if it shows old IP
```

### Payment gateway not working?
```bash
# Verify credentials in environment
docker exec aarogya-certify env | grep RAZORPAY
# Verify with Razorpay dashboard
```

---

## Success Criteria

✅ Application deployed and running  
✅ Domain accessible via HTTPS  
✅ Database migrations complete  
✅ Supabase connection verified  
✅ Payment gateway configured  
✅ LinkedIn OAuth ready  
✅ Monitoring active  
✅ Backups scheduled  

---

## What's Deployed

```
Frontend:
├─ React 18 + TypeScript application
├─ Vite build optimization
├─ Tailwind CSS styling
├─ Phase 1-4 features:
│  ├─ Payment system (Razorpay)
│  ├─ Invoice generation
│  ├─ LinkedIn sharing
│  └─ Refund workflow
└─ Running on port 3000

Backend:
├─ Supabase PostgreSQL database
├─ RLS policies for security
├─ Server-side scoring
├─ Certificate generation
├─ Payment processing RPCs
└─ 13 tables with full schema

Infrastructure:
├─ Coolify orchestration
├─ Docker containerization
├─ SSL/HTTPS via Coolify proxy
├─ Automatic backups
└─ Health monitoring
```

---

## URLs After Migration

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | https://aarogya.yourdomain.com | Main application |
| Admin | https://aarogya.yourdomain.com/admin | Admin dashboard |
| Dashboard | https://aarogya.yourdomain.com/dashboard | User dashboard |
| Payments | https://aarogya.yourdomain.com/dashboard/payments | Payment history |
| API | https://aarogya.yourdomain.com/api | Backend API |

---

## Next Steps

1. **Monitor** for 24 hours
2. **Test** all payment flows with real transactions
3. **Optimize** based on performance metrics
4. **Configure** email notifications
5. **Train** support team on refund process

---

**Estimated Total Time: 60 minutes** ⏱️

