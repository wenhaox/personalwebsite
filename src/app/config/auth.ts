// Admin Authentication Configuration
// 
// SECURITY NOTES:
// 1. This is client-side only - password is visible in browser
// 2. For production, consider adding:
//    - Server-side auth with JWT tokens
//    - Rate limiting (max 5 attempts)
//    - IP-based blocking
// 3. Free options for better security:
//    - Vercel Edge Functions (free)
//    - Supabase Auth (free tier)
//    - Clerk Auth (free tier)

// Change this password before deploying!
// Use a password generator with 20+ characters
export const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'change_this_before_deploying_2024!'

// Optional: Add multiple admin users
export const ADMIN_USERS = [
  {
    username: 'admin',
    password: ADMIN_PASSWORD
  }
  // Add more users if needed:
  // { username: 'peter', password: 'another_secure_password' }
]

// Security config
export const AUTH_CONFIG = {
  MAX_ATTEMPTS: 5, // Max login attempts before lockout
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
}

