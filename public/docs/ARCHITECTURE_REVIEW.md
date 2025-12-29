# 🗺️ Quiz App Architecture Deficits

## Rate Limiting for Logins

**Priority:** 🔴 VERY HIGH
**Effort:** ~1 hour
**Impact:** Prevents Brute-Force + DoS
**Status:** Not yet implemented

---

## Health-Check Endpoint
**Priority:** 🟢 LOW
**Effort:** ~5 minutes
**Impact:** Monitoring, Load-Balancer

**What:**
```javascript
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
```

**Why needed:** For production monitoring, Kubernetes health checks

---

## 🎯 Long-term Roadmap (later)

1. **Unit Tests** (2-3h)
   - Jest Setup
   - InputValidator Tests
   - Service Tests

2. **E2E Tests** (3-4h)
   - Cypress Setup
   - Quiz-Creation Flow
   - Session-Flow

3. **Performance Monitoring** (1h)
   - Slow-Query-Logging
   - Response-Time-Tracking

4. **Error Monitoring** (1h)
   - Sentry Integration
   - Automatic Alerting

5. **Database Migrations** (2h)
   - Better-SQLite3 Migrations
   - Schema-Versioning

6. **API Documentation** (2h)
   - OpenAPI/Swagger
   - Auto-generated Docs
