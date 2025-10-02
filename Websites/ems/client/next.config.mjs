/** @type {import('next').NextConfig} */

const nextConfig = {
    env: {
        // "http://localhost:3050/api" so localhost uses nginx to communcate between containers inside docker
        
        APIKEY: process.env.NODE_ENV === "production" ? "http://localhost:3050/api" : "http://localhost:5500/api",
      },
      
      reactStrictMode: false,
};

export default nextConfig;
