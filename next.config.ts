import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.metmuseum.org' },
      { protocol: 'https', hostname: 'framemark.vam.ac.uk' },
      { protocol: 'https', hostname: 'openaccess-cdn.clevelandart.org' },
      { protocol: 'https', hostname: '*.iiif.io' },
    ],
  },
};

export default nextConfig;
