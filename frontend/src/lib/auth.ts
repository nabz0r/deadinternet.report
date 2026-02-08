/**
 * NextAuth.js configuration.
 * Providers: Google, GitHub, Email magic link.
 * Session strategy: JWT (stateless, no DB session table needed).
 */

import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // On first sign-in, sync user to backend
      if (user && account) {
        token.tier = 'ghost' // Default tier
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user.id,
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
          // Backend might not be ready yet, continue with ghost tier
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub
        ;(session.user as any).tier = token.tier || 'ghost'
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
