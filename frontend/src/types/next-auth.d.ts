/**
 * TypeScript type augmentation for NextAuth.
 * Adds custom fields (tier, id) to Session and JWT.
 */

import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      tier: string
    }
  }

  interface User {
    tier?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    tier?: string
  }
}
