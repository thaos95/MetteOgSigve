# Admin QA Checklist

## Pre-Deployment Checks

### Authentication
- [ ] Login with correct password → access granted
- [ ] Login with wrong password → "Unauthorized" alert
- [ ] Login with empty password → "Unauthorized" alert
- [ ] Password input is masked (type="password")

### Dashboard Stats
- [ ] Stats display correctly after login
- [ ] Stats update after RSVP changes
- [ ] All 6 stat cards visible (Total, Attending, Not Attending, Verified, Unverified, Total Guests)

### Filters
- [ ] Attending filter works (All/Yes/No)
- [ ] Date range filter works
- [ ] Include unverified toggle works
- [ ] Member name search works
- [ ] Email search works
- [ ] Member attending filter works
- [ ] Filters reset correctly when cleared

### RSVP List
- [ ] RSVPs display with all info (name, email, status, notes)
- [ ] Party size shows correctly
- [ ] Party members listed with edit controls

### Guest Management
- [ ] Add guest modal opens
- [ ] Add guest with valid name → success toast
- [ ] Add guest with empty name → validation error
- [ ] Add guest with name >64 chars → validation error
- [ ] Edit guest name → save works
- [ ] Toggle attending → save works
- [ ] Move guest up/down → reorders correctly
- [ ] Remove guest → confirmation required → removes

### Toggle Primary
- [ ] Toggle primary attending → updates immediately

### Export
- [ ] Export CSV downloads file
- [ ] CSV contains expected columns
- [ ] CSV respects applied filters
- [ ] Email backup sends email

### Audit Logs
- [ ] Audit logs modal opens
- [ ] Logs display with all columns
- [ ] Pagination works (Prev/Next)
- [ ] Filter by admin email works
- [ ] Filter by action works
- [ ] View details shows before/after JSON
- [ ] Quick preview shows recent logs

### Danger Zone
- [ ] Clear RSVPs requires confirmation
- [ ] Clear RSVPs requires typing "DELETE"
- [ ] Clear RSVPs actually clears (test env only!)
- [ ] Reset rate limits works for specific email
- [ ] Reset rate limits all works with confirmation
- [ ] View rate limits shows counters

## Mobile Testing (if applicable)
- [ ] Login screen usable on mobile
- [ ] Stats cards stack properly
- [ ] Filters section collapsible and usable
- [ ] RSVP list scrollable
- [ ] Edit controls accessible
- [ ] Modals fit screen

## Security Verification
- [ ] Direct API call without password → 401
- [ ] Direct API call with wrong password → 401
- [ ] Audit logs created for add-guest
- [ ] Audit logs created for update-guest
- [ ] Audit logs created for remove-guest
- [ ] Audit logs created for export
- [ ] Audit logs created for clear-rsvps
- [ ] Audit logs created for reset-rate-limits

## Edge Cases
- [ ] Empty RSVP list displays gracefully
- [ ] RSVP with no party members handles correctly
- [ ] Very long names truncate/wrap properly
- [ ] Special characters in names handled
- [ ] Unicode characters in names handled
- [ ] Very large party (10+ members) scrolls properly

## Performance (Manual)
- [ ] Login response <2s
- [ ] RSVP list loads <3s for 100 RSVPs
- [ ] Export completes <5s for 500 RSVPs
- [ ] Audit logs load <2s

## Post-Deployment Verification
- [ ] Production login works
- [ ] Production export works
- [ ] Production audit logs accessible
- [ ] No console errors in browser
- [ ] Email backup actually sends
