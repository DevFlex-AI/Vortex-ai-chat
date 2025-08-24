import { NextResponse, type NextRequest } from 'next/server'
import { generateSignature, generateUTCTimestamp, decodeToken } from '@/utils/signature'
import { ErrorType } from '@/constant/errors'

const password = process.env.ACCESS_PASSWORD || ''
const uploadLimit = Number(process.env.NEXT_PUBLIC_UPLOAD_LIMIT || '0')

// Define routes that need token validation
const proxyRoutes = ['/api/google/upload/v1beta/files', '/api/google/v1beta/files']
const apiRoutes = ['/api/chat', '/api/upload', '/api/models', '/api/vortex', '/api/grok']

// Public routes that don't need authentication
const publicRoutes = [
  '/api/env',
  '/manifest.json',
  '/logo.svg',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/sw.js',
  '/_next/static',
  '/_next/image',
  '/icons',
  '/screenshots',
  '/plugins'
]

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|logo.svg|icons|screenshots|.*\\..*$).*)',
    '/api/:path*',
  ],
}

function checkToken(token: string | null): boolean {
  if (!token) return false
  if (password !== '') {
    try {
      const { sign, ts } = decodeToken(token)
      const utcTimestamp = generateUTCTimestamp()
      if (Math.abs(utcTimestamp - ts) > 60_000) return false
      if (sign !== generateSignature(password, ts)) return false
    } catch {
      return false
    }
  }
  return true
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Add security headers
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Handle upload size limits and token validation for proxy routes
  for (const route of proxyRoutes) {
    if (pathname.startsWith(route)) {
      const contentLength = Number(request.headers.get('Content-Length') || '0')
      if (uploadLimit > 0 && contentLength > uploadLimit) {
        return NextResponse.json(
          { code: 413, success: false, message: 'Payload Too Large' },
          { status: 413 }
        )
      }
      const token = request.nextUrl.searchParams.get('key')
      if (!checkToken(token)) {
        return NextResponse.json(
          { code: 40301, message: ErrorType.InValidToken },
          { status: 403 }
        )
      }
    }
  }

  // Handle token validation for API routes
  for (const route of apiRoutes) {
    if (pathname.startsWith(route)) {
      const token = request.nextUrl.searchParams.get('token') || 
                   request.headers.get('Authorization')?.replace('Bearer ', '')
      if (!checkToken(token)) {
        return NextResponse.json(
          { code: 40301, message: ErrorType.InValidToken },
          { status: 403 }
        )
      }
    }
  }

  // Handle Google model routes with header token
  if (pathname.startsWith('/api/google/v1beta/models/')) {
    const token = request.headers.get('X-Goog-Api-Key')
    if (!checkToken(token)) {
      return NextResponse.json(
        { code: 40301, message: ErrorType.InValidToken },
        { status: 403 }
      )
    }
  }

  return response
}