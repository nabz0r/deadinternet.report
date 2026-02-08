/**
 * Backend API proxy - forwards authenticated requests to FastAPI.
 *
 * NextAuth encrypts JWTs as JWE (A256GCM) which python-jose can't decrypt.
 * So we decode server-side with getToken(), then re-sign as a simple
 * HS256 JWT that the backend can verify with the same NEXTAUTH_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import * as jose from 'jose'

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000'
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'change-me')

async function createBackendToken(payload: Record<string, any>): Promise<string> {
  return new jose.SignJWT({
    sub: payload.sub || payload.id,
    email: payload.email,
    name: payload.name,
    tier: payload.tier || 'ghost',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/')
  const url = new URL(req.url)
  const queryString = url.search
  const target = `${BACKEND_URL}/api/v1/${path}${queryString}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Decode NextAuth session, re-sign as simple HS256 JWT
  const sessionToken = await getToken({ req })
  if (sessionToken) {
    const backendJwt = await createBackendToken(sessionToken)
    headers['Authorization'] = `Bearer ${backendJwt}`
  }

  try {
    const body = req.method !== 'GET' ? await req.text() : undefined

    const response = await fetch(target, {
      method: req.method,
      headers,
      body,
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { detail: 'Backend unavailable' },
      { status: 502 }
    )
  }
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path)
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path)
}
