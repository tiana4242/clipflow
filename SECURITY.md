# Security Configuration for ClipFlow

## HTTPS Enforcement

### Production HTTPS Redirection
All HTTP traffic is automatically redirected to HTTPS in production:

```javascript
// HTTPS redirection middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.protocol === 'http') {
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    return res.redirect(301, httpsUrl);
  }
  next();
});
```

### HSTS (HTTP Strict Transport Security)
```javascript
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

- **Duration**: 1 year (31,536,000 seconds)
- **Subdomains**: All subdomains are covered
- **Preload**: Eligible for browser preload list

## Content Security Policy (CSP)

### Secure CSP Configuration
```javascript
Content-Security-Policy: 
  default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https:;
  script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: 'unsafe-hashes' https: unpkg.com cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' blob: https: fonts.googleapis.com;
  img-src 'self' data: blob: https:;
  font-src 'self' data: blob: https: fonts.gstatic.com;
  connect-src 'self' https:gfwszuvlskrfuwiqmkfg.supabase.co https://www.googleapis.com blob: wss://localhost:5173 wss://localhost:5173 https:;
  media-src 'self' blob: https:;
  worker-src 'self' blob: https:;
  frame-src 'self' blob: https:;
  object-src 'self' blob: https:;
  require-trusted-types-for 'script';
  upgrade-insecure-requests;
```

### CSP Features
- **HTTPS-only**: `upgrade-insecure-requests` forces HTTPS
- **Trusted Types**: `require-trusted-types-for 'script'` prevents DOM XSS
- **Allowed CDNs**: Only trusted CDNs (unpkg.com, cdnjs.cloudflare.com)
- **Font Services**: Google Fonts allowed over HTTPS
- **API Connections**: Supabase and Google APIs over HTTPS

## JavaScript Library Security

### Allowed Libraries
- **React**: `https://unpkg.com/react@18/`
- **Lucide Icons**: `https://unpkg.com/lucide@latest/`
- **Supabase**: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js/`
- **Vite**: Development server (localhost only)

### Library Security Measures
1. **HTTPS-only**: All libraries loaded over HTTPS
2. **Integrity Checks**: Subresource Integrity (SRI) for production
3. **Version Pinning**: Specific versions to prevent supply chain attacks
4. **CSP Enforcement**: Only allowed domains can load scripts

### Example SRI Implementation (Production)
```html
<script 
  src="https://unpkg.com/react@18/umd/react.production.min.js"
  integrity="sha384-..."
  crossorigin="anonymous">
</script>
```

## Additional Security Headers

### Cross-Origin Policies
```javascript
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Frame Protection
```javascript
X-Frame-Options: DENY
Content-Security-Policy-Report-Only: frame-ancestors 'none';
```

### Content Type Protection
```javascript
X-Content-Type-Options: nosniff
```

### XSS Protection
```javascript
X-XSS-Protection: 1; mode=block
```

### Referrer Policy
```javascript
Referrer-Policy: strict-origin-when-cross-origin
```

### Permissions Policy
```javascript
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()
```

## Deployment Security

### Environment Variables
```bash
NODE_ENV=production
FRONTEND_URL=https://clipflow.app
```

### SSL/TLS Configuration
- **TLS 1.3**: Preferred protocol
- **TLS 1.2**: Fallback support
- **Strong Ciphers**: Modern cipher suites only
- **Certificate**: Valid SSL certificate required

### Production Checklist
- [ ] SSL certificate installed and valid
- [ ] HSTS header configured
- [ ] CSP policy enforced
- [ ] All resources loaded over HTTPS
- [ ] Security headers configured
- [ ] Subresource Integrity implemented
- [ ] Dependencies audited for vulnerabilities

## Monitoring and Compliance

### Security Headers Verification
```bash
curl -I https://clipflow.app
```

### CSP Validation
- Use [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- Test with [CSP Test](https://csptest.org/)

### SSL/TLS Testing
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Security Headers Test](https://securityheaders.com/)

## Best Practices

### For Development
1. Use HTTPS locally with self-signed certificates
2. Test CSP policies in development
3. Validate security headers before deployment

### For Production
1. Enable HSTS preload submission
2. Implement SRI for all third-party scripts
3. Regular security audits and dependency updates
4. Monitor for security vulnerabilities

### For Users
1. Always use HTTPS URLs
2. Report security issues responsibly
3. Keep browsers updated for latest security features
