# Production Deployment Guide

**Version:** 1.0  
**Date:** November 5, 2026  
**Status:** Ready for Production

---

## Pre-Deployment Checklist

### 1. Environment Configuration

- [ ] Set `VITE_DATA_BACKEND=supabase` (use database backend)
- [ ] Configure Supabase credentials:
  - [ ] `VITE_SUPABASE_URL` (project URL)
  - [ ] `VITE_SUPABASE_ANON_KEY` (anonymous key)
- [ ] Configure Razorpay:
  - [ ] `VITE_RAZORPAY_KEY_ID` (live key, not test)
  - [ ] Backend secret: `RAZORPAY_KEY_SECRET` (.env.local)
- [ ] Configure LinkedIn OAuth:
  - [ ] `VITE_LINKEDIN_CLIENT_ID` (LinkedIn app ID)
  - [ ] Backend secret: `LINKEDIN_CLIENT_SECRET` (.env.local)
- [ ] Configure logging:
  - [ ] `VITE_LOG_PAYMENTS=true`
  - [ ] `SENTRY_DSN` (error tracking)
- [ ] Set Node environment:
  - [ ] `NODE_ENV=production`
  - [ ] Enable gzip compression

### 2. Security Hardening

- [ ] **HTTPS/TLS Only**
  - [ ] SSL certificate configured
  - [ ] HSTS headers enabled
  - [ ] Redirect HTTP to HTTPS

- [ ] **API Security**
  - [ ] CORS configured (specify allowed origins)
  - [ ] Rate limiting enabled (5 req/min for payments)
  - [ ] Request signing (Razorpay webhook verification)

- [ ] **Data Protection**
  - [ ] Payment data encrypted at rest
  - [ ] Tokens encrypted in storage
  - [ ] Sensitive fields masked in logs
  - [ ] PII redacted from analytics

- [ ] **Authentication**
  - [ ] JWT tokens signed with strong key
  - [ ] Session timeout: 15 minutes
  - [ ] Refresh token rotation enabled

- [ ] **Compliance**
  - [ ] PCI DSS requirements met
  - [ ] GDPR data retention policies
  - [ ] Privacy policy published
  - [ ] Terms of service finalized

### 3. Database Setup

- [ ] Run all migrations:
  ```bash
  supabase db push --linked
  ```

- [ ] Verify all tables created:
  - [ ] `profiles`
  - [ ] `certificates`
  - [ ] `payment_orders`
  - [ ] `payment_invoices`
  - [ ] `linkedin_shares`

- [ ] Verify RLS policies enforced
  - [ ] `select` policies allow only owner
  - [ ] `insert` policies require auth
  - [ ] `update` policies restricted to admin

- [ ] Set up backups:
  - [ ] Daily automated backups
  - [ ] 30-day retention
  - [ ] Test restore procedure

### 4. Payment Gateway Setup

- [ ] **Razorpay Account**
  - [ ] Upgrade to live account
  - [ ] Complete merchant verification
  - [ ] Activate live mode
  - [ ] Generate live API keys

- [ ] **Webhook Configuration**
  - [ ] Set webhook URL: `https://api.yourdomain.com/webhooks/razorpay`
  - [ ] Enable events:
    - [ ] `payment.authorized`
    - [ ] `payment.failed`
    - [ ] `refund.created`

- [ ] **Settlement Setup**
  - [ ] Configure settlement account
  - [ ] Set settlement frequency
  - [ ] Review settlement fees

### 5. LinkedIn OAuth Setup

- [ ] **LinkedIn App Creation**
  - [ ] Create app at developer.linkedin.com
  - [ ] Get Client ID and Secret
  - [ ] Configure redirect URI: `https://yourdomain.com/auth/linkedin/callback`
  - [ ] Request `w_member_social` permission

- [ ] **OAuth Scopes**
  - [ ] `profile` (read profile data)
  - [ ] `w_member_social` (write social posts)
  - [ ] Request additional scopes if needed

- [ ] **Credential API Setup** (for verified badges)
  - [ ] Request access to Credentials API
  - [ ] Set up issuer account
  - [ ] Create credential schema
  - [ ] Configure badge imagery

### 6. Monitoring & Observability

- [ ] **Error Tracking**
  - [ ] Sentry account created
  - [ ] DSN configured
  - [ ] Alerts set for critical errors

- [ ] **Logging**
  - [ ] Structured logging configured
  - [ ] Log aggregation set up
  - [ ] PII masking verified

- [ ] **Monitoring**
  - [ ] Application performance monitoring
  - [ ] Uptime monitoring
  - [ ] Alert thresholds configured

- [ ] **Analytics**
  - [ ] Google Analytics configured
  - [ ] Privacy-compliant tracking
  - [ ] Goal tracking set up

### 7. Testing

- [ ] **E2E Testing**
  - [ ] Complete payment flow tested
  - [ ] LinkedIn sharing tested
  - [ ] Refund flow tested
  - [ ] Edge cases covered

- [ ] **Performance Testing**
  - [ ] Load testing (1000+ concurrent users)
  - [ ] Payment processing latency < 500ms
  - [ ] API response time < 200ms

- [ ] **Security Testing**
  - [ ] Penetration testing completed
  - [ ] SQL injection tests passed
  - [ ] XSS vulnerability tests passed
  - [ ] CSRF protection verified

### 8. Deployment

- [ ] **Code Deployment**
  - [ ] All changes committed to main
  - [ ] Build passes: `npm run build`
  - [ ] No TypeScript errors
  - [ ] Bundle size reviewed

- [ ] **Infrastructure**
  - [ ] CDN configured for static assets
  - [ ] Load balancer configured
  - [ ] Database replicas set up
  - [ ] Backup systems verified

- [ ] **DNS & Certificates**
  - [ ] DNS records updated
  - [ ] SSL certificate installed
  - [ ] Certificate auto-renewal configured

### 9. Documentation

- [ ] **User Documentation**
  - [ ] Payment guide written
  - [ ] LinkedIn sharing guide written
  - [ ] FAQ section completed
  - [ ] Help center updated

- [ ] **Developer Documentation**
  - [ ] API documentation complete
  - [ ] Webhook handling documented
  - [ ] Environment variables documented
  - [ ] Deployment procedure documented

- [ ] **Support Documentation**
  - [ ] Refund policy documented
  - [ ] Terms of service finalized
  - [ ] Privacy policy finalized
  - [ ] Support email configured

### 10. Go-Live

- [ ] **Final Verification**
  - [ ] All payment transactions working
  - [ ] All certificates generating correctly
  - [ ] LinkedIn sharing functional
  - [ ] Email notifications working

- [ ] **Monitoring**
  - [ ] Dashboards set up
  - [ ] Alerts active
  - [ ] On-call rotation established

- [ ] **Communication**
  - [ ] User announcement ready
  - [ ] Support team briefed
  - [ ] Documentation published

---

## Post-Deployment

### Week 1
- Monitor error logs hourly
- Track payment success rate (target: > 98%)
- Monitor API latency (target: < 200ms)
- Respond to user feedback

### Week 2-4
- Monitor weekly metrics
- Identify optimization opportunities
- Plan Phase 4.5 features

### Ongoing
- Daily health checks
- Weekly metric review
- Monthly security audit
- Quarterly performance review

---

## Rollback Procedure

If critical issues occur:

1. **Immediate (< 5 min)**
   - Page all on-call engineers
   - Roll back to previous version
   - Disable new features if needed

2. **Investigation (< 30 min)**
   - Identify root cause
   - Check error logs
   - Verify database state

3. **Communication (ongoing)**
   - Update status page
   - Notify affected users
   - Provide ETA

4. **Resolution (< 4 hours)**
   - Fix identified issue
   - Test thoroughly
   - Redeploy with monitoring

---

## Monitoring Dashboard

**Key Metrics to Watch:**

```
Payment Processing
├─ Success Rate: Target > 98%
├─ Average Latency: Target < 500ms
├─ Failed Orders: Alert if > 1%
└─ Revenue: Daily revenue tracking

LinkedIn Sharing
├─ Share Success Rate: Target > 95%
├─ Average Response Time: Target < 2s
└─ Share Volume: Daily share count

System Health
├─ API Response Time: Alert if > 1s
├─ Error Rate: Alert if > 0.5%
├─ Database Connection Pool: Monitor
└─ Memory Usage: Alert if > 80%
```

---

## Security Review Checklist

- [ ] SSL/TLS encryption enabled
- [ ] OWASP Top 10 vulnerabilities assessed
- [ ] Rate limiting implemented
- [ ] Input validation enforced
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Secure headers configured
- [ ] Sensitive data masked
- [ ] Audit logging enabled

---

## Success Criteria

✅ All metrics within target  
✅ Zero critical errors in first week  
✅ User satisfaction > 95%  
✅ Payment processing > 98% success  
✅ System uptime > 99.9%  
✅ LinkedIn sharing > 30% adoption  

---

**Deployment Ready: ✅ Proceed with confidence!**

