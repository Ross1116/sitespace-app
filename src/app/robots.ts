import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sitespace.com.au'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register', '/forgot-password'],
      disallow: ['/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
