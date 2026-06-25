# API Specification

All mutating APIs validate input with Zod, return structured JSON errors, and enforce authentication/authorization where required.

## Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/reset-password`

## Stores

- `POST /api/stores`
- `PATCH /api/stores/[id]`
- `DELETE /api/stores/[id]`

## Products

- `POST /api/products`
- `PATCH /api/products/[id]`
- `DELETE /api/products/[id]`
- `GET /api/products/[id]`

## Payments

- `POST /api/payments/create`
- `POST /api/payments/verify`
- `POST /api/webhooks/pesapal`

## Downloads

- `GET /api/downloads/[token]`

## Withdrawals

- `POST /api/withdrawals`
- `POST /api/admin/withdrawals/[id]/approve`
- `POST /api/admin/withdrawals/[id]/reject`
- `POST /api/admin/withdrawals/[id]/mark-paid`

## Admin Moderation

- `POST /api/admin/products/[id]/disable`
- `POST /api/admin/stores/[id]/suspend`
- `POST /api/admin/stores/[id]/reactivate`

## Analytics

- `POST /api/analytics/events`
- `GET /api/analytics/summary`

Required cross-cutting behavior:

- Authentication
- Authorization
- Validation
- Rate limiting
- Error handling
- Admin audit logging
