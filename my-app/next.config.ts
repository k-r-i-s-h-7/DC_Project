/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline';
              connect-src 'self' https://avznxyizjdnelnlvamnf.supabase.co http://127.0.0.1 http://localhost http://host.docker.internal;

              img-src 'self' blob: data:;
              style-src 'self' 'unsafe-inline';
            `
              .replace(/\s{2,}/g, " ")
              .trim(),
          },
        ],
      },
    ]
  },
}

export default nextConfig
