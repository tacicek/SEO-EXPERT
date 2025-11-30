# 🚀 Deployment Checklist

Quick reference guide for deploying SEO Expert AI to Coolify.

## ✅ Pre-Deployment Checklist

### 1. Repository Ready
- [ ] All code pushed to Git repository
- [ ] `.gitignore` includes `.env`
- [ ] `Dockerfile` exists in root
- [ ] `.dockerignore` configured
- [ ] `next.config.ts` has `output: 'standalone'`

### 2. Supabase Setup
- [ ] Supabase project created
- [ ] SQL schema executed (`supabase/schema.sql`)
- [ ] Tables created successfully (sites, analyses)
- [ ] View created (site_stats)
- [ ] RLS policies active
- [ ] API keys copied

### 3. API Keys Ready
- [ ] Anthropic API key obtained
- [ ] Serper.dev API key obtained
- [ ] OpenAI API key (optional) obtained
- [ ] Supabase URL and keys ready

## 📋 Coolify Deployment Steps

### Step 1: Create Application
1. Login to Coolify
2. Click "New Resource"
3. Select "Application"
4. Connect Git repository
5. Select branch (main/master)

### Step 2: Configure Build
- [ ] **Build Pack:** Dockerfile
- [ ] **Dockerfile Path:** `/Dockerfile`
- [ ] **Port:** 3000
- [ ] **Expose Port:** 80

### Step 3: Environment Variables

Copy these to Coolify Environment Variables section:

```bash
# AI Provider
ANTHROPIC_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
SUPABASE_SERVICE_ROLE_KEY=<your-key>

# App Config
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Serper
SERPER_API_KEY=<your-key>

# Limits
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW_MS=900000
MAX_CONTENT_LENGTH=50000
DEFAULT_ANALYSIS_TIMEOUT=120000
```

**Note:** Mark sensitive keys as "Secret" in Coolify.

### Step 4: Domain Setup
- [ ] Add custom domain in Coolify
- [ ] Configure DNS A record
- [ ] Enable Auto SSL
- [ ] Enable Force HTTPS

### Step 5: Deploy
- [ ] Click "Deploy" button
- [ ] Monitor build logs
- [ ] Wait for deployment to complete
- [ ] Check application status

## ✅ Post-Deployment Checklist

### 1. Basic Health Check
- [ ] Visit homepage - loads correctly
- [ ] No console errors
- [ ] UI displays properly
- [ ] Navigation works

### 2. Feature Testing
- [ ] Enter a URL for analysis
- [ ] Analysis completes successfully
- [ ] Results display correctly
- [ ] Editor page works
- [ ] `/analyses` page loads
- [ ] `/sites` page loads

### 3. Database Verification
- [ ] Check Supabase Dashboard
- [ ] Verify analysis saved to database
- [ ] Check site record created
- [ ] View statistics working

### 4. API Endpoints
Test with curl or Postman:

```bash
# Analyze endpoint
curl -X POST https://your-domain.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Serper scrape
curl -X POST https://your-domain.com/api/serper/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Serper search
curl -X POST https://your-domain.com/api/serper/search \
  -H "Content-Type: application/json" \
  -d '{"q":"SEO tips","num":5}'
```

### 5. Security Check
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS
- [ ] Environment variables not exposed
- [ ] Rate limiting active
- [ ] CORS configured properly

### 6. Performance Check
- [ ] Page load time < 3 seconds
- [ ] No memory leaks
- [ ] CPU usage normal
- [ ] API response times acceptable

## 🔧 Common Issues & Solutions

### Build Fails
```bash
# Check: package-lock.json exists
# Check: Node version compatibility
# Check: All dependencies installed
```

### Database Connection Error
```bash
# Verify: Supabase environment variables
# Verify: Database schema created
# Check: Network connectivity
```

### API Key Errors
```bash
# Verify: All keys in environment variables
# Check: Keys marked as "Secret"
# Test: API keys valid and active
```

## 📊 Monitoring Setup

### 1. Coolify Monitoring
- [ ] Check application logs
- [ ] Monitor CPU/Memory usage
- [ ] Set up alerts (if available)

### 2. External Monitoring
- [ ] Setup uptime monitoring (e.g., UptimeRobot)
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Set up performance monitoring

### 3. API Usage Tracking
- [ ] Monitor Anthropic API credits
- [ ] Track Serper.dev usage
- [ ] Check Supabase storage/bandwidth

## 🔄 Auto-Deploy Configuration

- [ ] Enable "Auto Deploy on Push"
- [ ] Set webhook (if needed)
- [ ] Test auto-deployment with commit
- [ ] Verify deployment triggers correctly

## 📝 Documentation

- [ ] Update README with production URL
- [ ] Document any custom configurations
- [ ] Note any deployment-specific settings
- [ ] Create runbook for team

## ✨ Final Steps

- [ ] Notify team of deployment
- [ ] Share production URL
- [ ] Update DNS if needed
- [ ] Create backup schedule
- [ ] Set calendar reminder for SSL renewal check

---

## 🎉 Deployment Complete!

Your application should now be live at:
**https://your-domain.com**

### Next Steps:
1. Monitor for 24 hours
2. Check error logs daily
3. Review API usage weekly
4. Plan for scaling if needed

### Support:
- Coolify Docs: https://coolify.io/docs
- Supabase Docs: https://supabase.com/docs
- Project Docs: See `/docs` folder

---

**Last Updated:** 30.11.2024  
**Version:** 1.0.0
