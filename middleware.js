const ACCESS_COOKIE = 'site_access'
const PUBLIC_PATHS = new Set(['/auth', '/api/auth'])

export default function middleware(request) {
  if (!process.env.VERCEL) {
    return
  }

  if (!process.env.SITE_PASSWORD) {
    return new Response('SITE_PASSWORD is not configured', { status: 500 })
  }

  const { pathname, search } = new URL(request.url)

  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/vite.svg')
  ) {
    return
  }

  const hasAccess = request.cookies.get(ACCESS_COOKIE)?.value === '1'
  if (!hasAccess) {
    const redirectTo = encodeURIComponent(`${pathname}${search}`)
    return Response.redirect(new URL(`/auth?next=${redirectTo}`, request.url), 307)
  }

  return
}
