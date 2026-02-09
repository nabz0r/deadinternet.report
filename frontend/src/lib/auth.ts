/**
 * NextAuth.js configuration.
 * Providers: Google, GitHub.
 * Session strategy: JWT (stateless).
 *
 * On first sign-in, syncs user to backend via /users/sync.
 * JWT callback stores tier from backend.
 * Session callback exposes tier and id to client.
 */

import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000'
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || ''

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // On first sign-in, sync user to backend
      if (user && account) {
        token.tier = 'ghost'
        try {
          const res = await fetch(`${BACKEND_URL}/api/v1/users/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Secret': INTERNAL_API_SECRET,
            },
            body: JSON.stringify({
              id: user.id || token.sub,
              email: user.email,
              name: user.name,
              image: user.image,
            }),
          })
          if (res.ok) {
            const data = await res.json()
            token.tier = data.tier || 'ghost'
          }
        } catch {
          // Backend might not be ready, continue with ghost
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || ''
        session.user.tier = (token.tier as string) || 'ghost'
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
