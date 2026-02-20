import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Prevent Next.js from bundling Node.js-only dependencies of @xenova/transformers
    // (onnxruntime-node, sharp) when building for the browser.
    config.resolve.alias = {
      ...config.resolve.alias,
      'sharp$': false,
      'onnxruntime-node$': false,
    };
    return config;
  },
  images: {
    remotePatterns: [
      // Museum APIs
      { protocol: 'https', hostname: 'images.metmuseum.org' },
      { protocol: 'https', hostname: 'framemark.vam.ac.uk' },
      { protocol: 'https', hostname: 'openaccess-cdn.clevelandart.org' },
      { protocol: 'https', hostname: '*.iiif.io' },
      // Scrapable museums
      { protocol: 'https', hostname: 'collections.louvre.fr' },
      { protocol: 'https', hostname: 'www.britishmuseum.org' },
      { protocol: 'https', hostname: 'americanhistory.si.edu' },
      { protocol: 'https', hostname: 'www.nationalgallery.org.uk' },
      { protocol: 'https', hostname: 'www.rijksmuseum.nl' },
      { protocol: 'https', hostname: 'collections.mfa.org' },
      { protocol: 'https', hostname: 'wallacelive.wallacecollection.org' },
      { protocol: 'https', hostname: 'collections.royalarmouries.org' },
      // Smithsonian CDN
      { protocol: 'https', hostname: '*.si.edu' },
      // Harvard Art Museums
      { protocol: 'https', hostname: 'nrs.harvard.edu' },
      // Art Institute of Chicago (IIIF)
      { protocol: 'https', hostname: 'www.artic.edu' },
    ],
  },
};

export default nextConfig;
