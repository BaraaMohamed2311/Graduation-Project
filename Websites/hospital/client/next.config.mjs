/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        // APIKEY: process.env.APIURL,
        // for local development 
        APIKEY: "http://localhost:8080/api" ,
      },
      
      reactStrictMode: false,
};

export default nextConfig;
