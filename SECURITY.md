# Security Policy

AirWise is committed to ensuring the security and privacy of our users. We appreciate and encourage responsible disclosure of vulnerabilities.

## Supported Versions

Only the current version running on the `main` branch is supported with security updates.

| Version | Supported |
| :--- | :---: |
| 0.1.x (`main`) | :white_check_mark: |
| < 0.1.0 | :x: |

## Reporting a Vulnerability

If you discover a security vulnerability or privacy flaw in AirWise, please disclose it responsibly:

- **Contact Email:** [ambatijagadiswarreddy@gmail.com](mailto:ambatijagadiswarreddy@gmail.com)
- **Subject:** `[AirWise Vulnerability Report] <Brief Title>`
- **Report Details:**
  - Description of the vulnerability and its potential impact
  - Step-by-step instructions or minimal proof of concept to reproduce
  - Affected components or endpoints
  - Any proposed fix or remediation (optional)

Please **do not** open public GitHub issues or public pull requests for undisclosed security vulnerabilities.

## Expected Response Time

We aim to acknowledge vulnerability reports within 48 hours and provide a substantive assessment and remediation timeline within 5 business days.

## Scope

### In Scope
- Serverless API routes (`/api/air`, `/api/geocode`, `/api/health`, `/api/plan`)
- Client-side data minimization, LocalStorage data protection (`HouseholdProfile`), and data export/deletion mechanisms
- HTTP security headers, CORS origin enforcement, and Content Security Policy (CSP)
- Input validation (Zod schemas), token-bucket rate limiting, and output validation safeguards
- Repository supply-chain configs, dependency audits, and automated security checks

### Out of Scope
- Third-party infrastructure and external upstream APIs (e.g. Open-Meteo)
- Volumetric Denial of Service (DoS/DDoS) attacks against public web endpoints
- Social engineering, phishing, or physical attacks
- Security vulnerabilities in outdated, unsupported, or end-of-life client browsers
- Theoretical issues without demonstrable security or privacy impact
