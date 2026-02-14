import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      { protocol: 'https', hostname: 'ids.si.edu' },
      { protocol: 'https', hostname: 'si.edu' },
    ],
  },
};

export default nextConfig;
