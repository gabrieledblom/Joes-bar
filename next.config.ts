import type { NextConfig } from "next";

// Stripes betalfält och 3D Secure laddas som iframes från Stripes egna
// domäner inuti vår sida - det påverkas inte av frame-ancestors, som bara
// hindrar andra sajter från att rama in oss (clickjacking).
const sakerhetshuvuden = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: sakerhetshuvuden }];
  },
};

export default nextConfig;
