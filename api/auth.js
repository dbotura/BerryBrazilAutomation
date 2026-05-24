import { corsHeaders } from './db.js'

const ACCESS_COOKIE = 'site_access'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export default async function handler(req, res) {
  corsHeaders()

  if (req.method === 'OPTIONS') {
    return res.status(200).json({})
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sitePassword = process.env.SITE_PASSWORD || ''
  if (!sitePassword) {
    return res.status(500).json({ error: 'SITE_PASSWORD is not configured' })
  }

  const provided = String(req.body?.password || '')
  const redirectTo = String(req.body?.next || '/')

  if (provided !== sitePassword) {
    return res.status(401).json({ error: 'Invalid password' })
  }

  res.setHeader(
    'Set-Cookie',
    `${ACCESS_COOKIE}=1; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`
  )

  return res.status(200).json({ ok: true, redirectTo })
}
