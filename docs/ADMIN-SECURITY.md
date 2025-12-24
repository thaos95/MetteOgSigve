# Admin Security Checklist

## Authentication Model

### Current Implementation
- **Method**: Simple password comparison
- **Storage**: `ADMIN_PASSWORD` environment variable (server-only)
- **Transmission**: POST body `{ password: "..." }` for all endpoints
- **Session**: Password stored in React state, re-sent with each API call

### Security Properties
✅ Password never exposed in URLs/query strings (prevents log leakage)
✅ Password checked server-side on every request
✅ No client-side-only protection (all checks happen in route handlers)
✅ Password input is masked (`type="password"`)

## Environment Variables

| Variable | Purpose | Location |
|----------|---------|----------|
| `ADMIN_PASSWORD` | Admin authentication | Vercel/server env |
| `ADMIN_EMAIL` | Audit log attribution | Vercel/server env |
| `SMTP_*` | Email sending | Vercel/server env |

### Rotation Procedure
1. Update `ADMIN_PASSWORD` in Vercel environment variables
2. Redeploy the application
3. Notify authorized users of new password
4. Old password invalidated immediately on deploy

## API Endpoint Security

All `/api/admin/*` endpoints enforce:
```typescript
if (!password || password !== process.env.ADMIN_PASSWORD) {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}
```

### Protected Endpoints
| Endpoint | Method | Auth Check | Audit Logged |
|----------|--------|------------|--------------|
| `/api/admin/rsvps` | POST | ✅ | ❌ (read-only) |
| `/api/admin/edit-guest` | POST | ✅ | ✅ |
| `/api/admin/update-person` | POST | ✅ | ✅ |
| `/api/admin/export-rsvps` | POST | ✅ | ✅ |
| `/api/admin/email-rsvps` | POST | ✅ | ✅ |
| `/api/admin/audit-logs` | POST | ✅ | ❌ (read-only) |
| `/api/admin/clear-rsvps` | POST | ✅ + confirm | ✅ |
| `/api/admin/reset-rate-limits` | POST | ✅ | ✅ |
| `/api/admin/remove-sentinel` | POST | ✅ | ❌ |
| `/api/admin/alter-rsvps` | POST | ✅ | ❌ |
| `/api/admin/test-send-email` | POST | ✅ | ❌ |

## Audit Logging

### What's Logged
- Admin email (from `ADMIN_EMAIL` env)
- Action type (add-guest, update-guest, remove-guest, etc.)
- Target table and ID
- Before/after state (JSON)
- IP address
- Device ID (if provided)
- Timestamp

### Storage
Logs stored in `admin_audit_logs` table (Supabase).

### Retention
Logs persist indefinitely. Consider periodic archival for compliance.

## PII Protection

### Not Logged
- Passwords (never logged or stored)
- Raw tokens

### Logged (be aware)
- Email addresses (in RSVP data)
- Names
- IP addresses (for abuse prevention)

### Client Bundle Safety
- No secrets in client JavaScript
- Environment variables server-only (`ADMIN_PASSWORD` never exposed)
- `NEXT_PUBLIC_*` prefix required for client-exposed vars

## Rate Limiting

Admin endpoints are NOT rate-limited (to avoid lockout scenarios).
Consider adding admin-specific rate limits if abuse becomes an issue.

## Recommendations for Production

### Current
- ✅ Server-side auth on all endpoints
- ✅ Audit logging for mutations
- ✅ Confirmation dialogs for destructive actions
- ✅ Password masked in UI

### Future Enhancements
- [ ] Consider Supabase Auth or OAuth for admin login
- [ ] Add admin session tokens (avoid re-sending password)
- [ ] Implement admin IP allowlist
- [ ] Add admin activity notifications (email on sensitive actions)
- [ ] Consider 2FA for admin access
- [ ] Add rate limiting specifically for failed admin auth attempts
