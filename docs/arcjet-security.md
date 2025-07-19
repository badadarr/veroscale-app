# Arcjet Security Implementation

## Overview
Arcjet telah diintegrasikan ke dalam Weight Management System untuk memberikan perlindungan keamanan berlapis terhadap berbagai ancaman web.

## Fitur Keamanan yang Diimplementasikan

### 1. Rate Limiting (Fixed Window)
- **Global Middleware**: 1000 requests per jam untuk semua routes
- **Auth Endpoints**: 5 requests per 15 menit untuk login/register
- **API Endpoints**: 200 requests per jam untuk operasi data
- **Default**: 100 requests per 15 menit untuk endpoint umum
- **Email Validation**: 10 requests per jam untuk registrasi

### 2. Bot Protection
- Deteksi dan pemblokiran bot otomatis
- Pengecualian untuk search engine pada endpoint umum
- Pemblokiran total bot pada endpoint sensitif (auth, API)

### 3. Shield Protection
- Perlindungan terhadap SQL injection
- Perlindungan terhadap XSS attacks
- Perlindungan terhadap common web vulnerabilities

### 4. Email Validation
- Pemblokiran email disposable
- Validasi format email
- Deteksi email invalid

## Arsitektur Implementasi

### 1. Global Middleware (`middleware.ts`)
- Perlindungan tingkat aplikasi untuk semua routes
- Rate limiting global (1000 req/hour)
- Bot detection dengan whitelist search engines
- Shield protection untuk semua requests

### 2. API-Level Protection
- Perlindungan spesifik per endpoint
- Rate limiting yang disesuaikan per fungsi
- Validasi email untuk registrasi

## Konfigurasi

### Environment Variables
Tambahkan ke `.env.local`:
```bash
ARCJET_KEY=your-arcjet-key-here
```

### Protection Levels
- `default`: Fixed window rate limiting + bot detection + shield
- `auth`: Strict rate limiting untuk login/register
- `email`: Email validation + rate limiting
- `api`: API-specific rate limiting

## Implementasi pada Endpoints

### Authentication Endpoints
```typescript
// Login & Register
const arcjetResult = await withArcjetProtection(req, res, "auth");
if (arcjetResult) return arcjetResult;
```

### API Data Endpoints
```typescript
// Weights, Dashboard, Users
const arcjetResult = await withArcjetProtection(req, res, "api");
if (arcjetResult) return arcjetResult;
```

### Email Registration
```typescript
// Register with email validation
const arcjetResult = await withArcjetProtection(req, res, "email");
if (arcjetResult) return arcjetResult;
```

## Error Responses

### Rate Limit Exceeded (429)
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": "2025-02-03T10:30:00Z"
}
```

### Bot Detected (403)
```json
{
  "error": "Bot detected",
  "message": "Automated requests are not allowed."
}
```

### Invalid Email (400)
```json
{
  "error": "Invalid email",
  "message": "Please provide a valid email address."
}
```

### Security Violation (403)
```json
{
  "error": "Security violation",
  "message": "Request blocked for security reasons."
}
```

## Monitoring & Analytics

### Arcjet Dashboard
- Login ke [Arcjet Dashboard](https://app.arcjet.com)
- Monitor real-time security events
- Analyze attack patterns
- Configure rules dan thresholds

### Key Metrics
- Request volume per endpoint
- Blocked requests by type
- Geographic distribution of threats
- False positive rates

## Best Practices

### 1. Rate Limit Tuning
- Monitor legitimate user patterns
- Adjust limits based on usage analytics
- Consider different limits for different user roles

### 2. Whitelist Management
- Whitelist known good IPs if needed
- Allow search engines for public endpoints
- Consider API clients and integrations

### 3. Alert Configuration
- Set up alerts for unusual attack patterns
- Monitor for false positives
- Configure escalation procedures

## Troubleshooting

### Common Issues

#### High False Positive Rate
- Review rate limits - may be too strict
- Check for legitimate automated tools
- Consider user behavior patterns

#### Performance Impact
- Monitor response times
- Consider caching for frequently accessed data
- Optimize Arcjet rule evaluation

#### Integration Issues
- Verify ARCJET_KEY is set correctly
- Check network connectivity to Arcjet services
- Review error logs for integration issues

### Debug Mode
For development, you can set rules to "DRY_RUN" mode:
```typescript
fixedWindow({
  mode: "DRY_RUN", // Won't block, only log
  window: "15m",
  max: 5,
})
```

### Middleware Configuration
The global middleware protects all routes except:
- API routes (handled individually)
- Static files (`_next/static`)
- Images (`_next/image`)
- Favicon and public assets

## Security Considerations

### 1. Key Management
- Store ARCJET_KEY securely
- Rotate keys periodically
- Use different keys for different environments

### 2. Logging
- Log security events for audit
- Don't log sensitive user data
- Implement log retention policies

### 3. Compliance
- Ensure GDPR compliance for EU users
- Consider data residency requirements
- Implement proper data handling procedures

## Future Enhancements

### Planned Features
- PII detection for sensitive data
- Custom rule sets per user role
- Advanced threat intelligence integration
- Automated response to security events

### Integration Opportunities
- SIEM system integration
- Slack/Teams notifications
- Custom webhook handlers
- Advanced analytics dashboard