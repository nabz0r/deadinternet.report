/**
 * NextAuth.js API route handler.
 * Handles OAuth callbacks and session management.
 */

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
