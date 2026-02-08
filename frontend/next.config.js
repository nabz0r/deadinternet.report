/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
    ],
  },
  // Suppress React hydration warnings from browser extensions
  reactStrictMode: true,
}

module.exports = nextConfig
