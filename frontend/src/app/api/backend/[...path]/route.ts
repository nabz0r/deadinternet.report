/**
 * Backend API proxy - forwards authenticated requests to FastAPI.
 * Uses NextAuth JWT (raw) as Bearer token.
 * This avoids exposing tokens client-side.
 *
 * Client calls: /api/backend/scanner/scan
 * Proxy calls:  BACKEND_URL/api/v1/scanner/scan
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000'

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path)
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path)
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/')
  const url = new URL(req.url)
  const queryString = url.search
  const target = `${BACKEND_URL}/api/v1/${path}${queryString}`

  // Get raw JWT from NextAuth
  const token = await getToken({ req, raw: true })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
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
