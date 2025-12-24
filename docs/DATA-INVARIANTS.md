# Data Invariants

## RSVP Table (`rsvps`)

### Required Fields
- `id`: UUID, primary key, auto-generated
- `email`: String, required, used for guest identification
- `attending`: Boolean, required

### Optional Fields
- `first_name` / `last_name`: Guest name (may be stored in `name` legacy field)
- `party`: JSON array of party members
- `notes`: Guest-provided notes
- `verified`: Boolean, default false
- `cancelled`: Boolean, default false

### Party Member Structure
```json
{
  "firstName": "string (required)",
  "lastName": "string (required)", 
  "attending": "boolean (optional, inherits from RSVP)"
}
```

### Invariants
1. **Email uniqueness**: Email should be unique per RSVP (soft constraint, duplicates possible but flagged)
2. **Party array validity**: `party` must be valid JSON array or null
3. **Name length**: First/last names must be ≤64 characters
4. **Party index bounds**: Operations on party members must use valid indices (0 to length-1)

## Token Table (`rsvp_tokens`)

### Required Fields
- `id`: UUID, primary key
- `rsvp_id`: References `rsvps(id)`, cascade delete
- `purpose`: 'verify' | 'edit' | 'cancel'
- `token_hash`: SHA256 hash of plaintext token

### Optional Fields
- `token`: Legacy plaintext (nullable, deprecated)
- `used`: Boolean, default false
- `expires_at`: Timestamp

### Invariants
1. **Token hash uniqueness**: `token_hash` must be unique
2. **One-time use**: After successful use, token is deleted
3. **Expiry**: Tokens older than `expires_at` should be rejected
4. **Purpose constraints**: Only specified purposes are valid

## Audit Log Table (`admin_audit_logs`)

### Required Fields
- `id`: Auto-increment integer
- `admin_email`: Who performed the action
- `action`: What action was taken
- `created_at`: When (auto-generated)

### Optional Fields
- `target_table`: Which table was affected
- `target_id`: Which record was affected
- `before`: Previous state (JSON)
- `after`: New state (JSON)
- `ip`: Requester IP
- `device_id`: Device identifier

### Invariants
1. **Immutability**: Audit logs should never be modified or deleted
2. **Completeness**: All admin mutations should create an audit entry

## Cross-Table Invariants

1. **Token-RSVP relationship**: Every token must reference a valid RSVP
2. **Cascade delete**: Deleting RSVP cascades to tokens
3. **Verification state sync**: Using edit/cancel token marks RSVP as verified

## Operational Invariants

1. **Rate limits**: API operations subject to sliding window limits
2. **Admin auth**: All admin endpoints require valid password
3. **Export consistency**: CSV exports must reflect current filter state
4. **Audit completeness**: Admin mutations must log before returning success
