export async function verifyRecaptchaToken(token: string, action = '') {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) return { success: true }; // treat as success when not configured to avoid blocking dev

  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body: params });
    const json = await res.json();
    // json: { success, score, action, challenge_ts, hostname }
    return json;
  } catch (e) {
    console.error('recaptcha verify error', e);
    return { success: false } as any;
  }
}
