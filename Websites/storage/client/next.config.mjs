/** @type {import('next').NextConfig} */
const nextConfig = {
  env: { 
        
        
        APIKEY: process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api",
      },

      reactStrictMode: false,
};

export default nextConfig;
