# Admin Dashboard Guide

## Overview
The admin dashboard (`/admin`) allows the couple or trusted organizers to manage RSVPs for the wedding.

## Access
1. Navigate to `/admin`
2. Enter the admin password (stored in `ADMIN_PASSWORD` environment variable)
3. Click "Login"

## Dashboard Stats
After login, you'll see a dashboard with key metrics:
- **Total RSVPs**: Number of RSVP submissions
- **Attending**: Guests who confirmed attendance
- **Not Attending**: Guests who declined
- **Verified**: RSVPs that completed email verification
- **Unverified**: RSVPs pending verification
- **Total Guests**: Sum of all guests (primary + party members)

## Filters
Expand the **Filters** section to narrow down the guest list:
- **Attending status**: All / Attending / Not attending
- **From/To date**: Filter by RSVP submission date
- **Include unverified**: Show unverified RSVPs (off by default)
- **Member name**: Search by guest name
- **Email**: Search by email address
- **Member attending**: Filter by individual guest attendance

## Managing Guests

### View RSVPs
Each RSVP shows:
- Primary guest name and email
- Attending status
- Notes
- Party size
- List of party members

### Edit Party Members
For each party member:
1. Edit name fields directly in the inputs
2. Toggle attending checkbox
3. Click **Save** to commit changes
4. Use **↑/↓** buttons to reorder
5. Click **Remove** to delete (requires confirmation)

### Add Guest to Party
1. Click **Add guest** button on an RSVP
2. Fill in first name, last name
3. Check/uncheck attending
4. Click **Save**

### Toggle Primary Attending
Click **Toggle primary** next to the primary guest to flip their attendance status.

## Export & Backup

### Export CSV
1. Apply desired filters
2. Click **Export CSV**
3. A CSV file downloads with all visible RSVPs

### Email Backup
Click **Email backup** to send a CSV to the admin email address.

### Test Email
1. Enter a recipient email (optional - defaults to admin email)
2. Click **Send test email** to verify email configuration

## Audit Logs
All admin actions are logged for accountability.

### View Logs
1. Click **Audit logs** button
2. Browse paginated log entries
3. Filter by admin email or action type
4. Click **View** on any row to see before/after JSON diffs

### Quick Preview
Click **Quick preview** for a quick alert showing recent actions.

## Danger Zone
**Use with extreme caution!**

### Clear All RSVPs
⚠️ Permanently deletes ALL RSVPs. Requires typing "DELETE" to confirm.

### Remove Sentinel
Removes the creation sentinel file to re-enable table creation.

### Reset Rate Limits
- Enter email to reset limits for one user
- Leave blank and confirm to reset ALL rate limits

### View Rate Limits
Enter an email and click to see current rate limit counters for that user.

## Best Practices
1. **Regular backups**: Use Email backup weekly during active RSVP period
2. **Verify before export**: Check filters are applied correctly before exporting for vendors
3. **Use audit logs**: Review changes periodically to catch errors
4. **Don't share password**: The admin password should only be known to organizers
5. **Check unverified**: Periodically review unverified RSVPs for follow-up
