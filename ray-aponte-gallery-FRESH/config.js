// Public configuration. The publishable/anon key is meant for browser use.
// NEVER put a Supabase service_role or secret key in this file.
window.RAY_CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'YOUR_SUPABASE_PUBLISHABLE_KEY',
  CONTACT_EMAIL: '', // Add only after Ray approves public display.
  INSTAGRAM_URL: '' // Example: https://www.instagram.com/your_handle/
};

window.RAY_IS_CONFIGURED =
  window.RAY_CONFIG.SUPABASE_URL.startsWith('https://') &&
  !window.RAY_CONFIG.SUPABASE_URL.includes('YOUR_PROJECT') &&
  window.RAY_CONFIG.SUPABASE_PUBLISHABLE_KEY.length > 20 &&
  !window.RAY_CONFIG.SUPABASE_PUBLISHABLE_KEY.includes('YOUR_');
