/**
 * Playwright global teardown - runs after all tests complete.
 * Cleans up test RSVPs from the database.
 */
async function globalTeardown() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const password = process.env.ADMIN_PASSWORD || 'metteogsigve';

  console.log('\n🧹 Cleaning up test data...');

  try {
    const response = await fetch(`${baseUrl}/api/admin/cleanup-test-rsvps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.deleted > 0) {
        console.log(`✅ Cleaned up ${result.deleted} test RSVPs`);
      } else {
        console.log('✅ No test RSVPs to clean up');
      }
    } else {
      const error = await response.json().catch(() => ({}));
      console.warn('⚠️ Cleanup failed:', error.error || response.statusText);
    }
  } catch (e) {
    // Server might already be stopped - that's okay
    console.warn('⚠️ Cleanup skipped (server unavailable):', (e as Error).message);
  }
}

export default globalTeardown;
