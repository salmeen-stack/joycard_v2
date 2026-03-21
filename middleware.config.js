/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Force Node.js runtime for middleware
    serverComponentsExternalPackages: ['jsonwebtoken', 'bcryptjs']
  }
}

module.exports = nextConfig
