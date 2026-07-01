import { NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  const password = process.env.STAGING_PASSWORD
  if (!password) return NextResponse.next()

  const cookie = req.cookies.get('staging_auth')?.value
  if (cookie === password) return NextResponse.next()

  const url = req.nextUrl.clone()

  // Allow the auth endpoint through
  if (url.pathname === '/api/staging-auth') return NextResponse.next()

  // Redirect to staging gate
  url.pathname = '/staging-gate'
  url.searchParams.set('from', req.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!staging-gate|api/staging-auth|_next|favicon.ico).*)'],
}
