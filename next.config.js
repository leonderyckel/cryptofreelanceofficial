/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during build to allow deployment
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Allow TypeScript errors during build
    ignoreBuildErrors: false,
  },
  experimental: {
    // Enable experimental features if needed
  },
}

export default nextConfig