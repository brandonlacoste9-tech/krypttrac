import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware
 * Enforces Ed25519 signature verification on /api/defi/* routes
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Enforce Ed25519 signature on all /api/defi/* routes
  if (pathname.startsWith('/api/defi/')) {
    const signature = request.headers.get('x-colony-signature') || request.headers.get('x-signature')
    const publicKey = request.headers.get('x-public-key')
    const message = request.headers.get('x-message')
    const timestamp = request.headers.get('x-timestamp')
    const nonce = request.headers.get('x-nonce')

    // Check for required headers
    if (!signature || !publicKey || !message || !timestamp || !nonce) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Missing required signature headers. This endpoint requires Ed25519 cryptographic signing.',
          required: ['x-signature', 'x-public-key', 'x-message', 'x-timestamp', 'x-nonce'],
        },
        { status: 401 }
      )
    }

    // Note: Actual signature verification happens in the route handler
    // This middleware just checks for presence of required headers
    // The route handler will use verifySignedRequest() to validate the signature
  }

  // Allow request to continue
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/defi/:path*',
    // Add other secure routes here if needed
  ],
}
