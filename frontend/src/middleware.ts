/**
 * Next.js middleware - runs on edge before every request.
 *
 * Protects /dashboard (and sub-routes) from unauthenticated access.
 * Redirects logged-in users away from /login.
 * All other routes are public.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PROTECTED_ROUTES = ['/dashboard']
const AUTH_ROUTES = ['/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })
  const isAuthenticated = !!token

  // Protected routes: redirect to login if not authenticated
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Auth routes: redirect to dashboard if already logged in
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
