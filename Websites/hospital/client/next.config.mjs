/** @type {import('next').NextConfig} */

const nextConfig = {
    env: { 
        // "http://localhost:3050/api" so localhost uses nginx to communcate between containers inside docker
        
        APIKEY: process.env.NODE_ENV === "production" ? "/api" : "http://localhost:8888/api",
      },

      reactStrictMode: false,
};

export default nextConfig;
