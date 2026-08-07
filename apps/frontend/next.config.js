/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@campus-infra/ui', '@campus-infra/shared'],
};

module.exports = nextConfig;
