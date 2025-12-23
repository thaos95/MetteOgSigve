const { execSync } = require('child_process');

const patterns = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY',
  'SMTP_PASS',
  'SENDGRID_API_KEY',
  'KV_REST_API_TOKEN',
  'ART6AAI',
  'sq_'
];

let found = false;
for (const p of patterns) {
  try {
    const out = execSync(`git grep -n "${p}" || true`, { encoding: 'utf8' });
    if (out && out.trim()) {
      console.log('Found possible secret matches for pattern', p);
      console.log(out);
      found = true;
    }
  } catch (e) {
    // ignore
  }
}

if (!found) console.log('No obvious secrets found in tracked files.');
else console.warn('Please review results and rotate any secrets that appear here.');
