# k6 Stress Test Scripts

## Prerequisites

Install k6: https://k6.io/docs/get-started/installation/

## Usage

```bash
# Auth ratelimit (500 concurrent)
k6 run k6/auth-ratelimit.js

# Payment creation (200 concurrent, CSRF + race condition)
k6 run k6/payment-creation.js

# Download URL generation (100 concurrent)
k6 run k6/download-url.js

# Order lookup ratelimit (30 concurrent, 5 req/min enforce)
k6 run k6/order-lookup-ratelimit.js
```

## Environment Variables

- `BASE_URL` - Target URL (default: `https://keevanstore.in`)

```bash
k6 run -e BASE_URL=https://staging.keevanstore.in k6/auth-ratelimit.js
```
