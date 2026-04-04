// Load environment variables
const env = process.env.NODE_ENV;

if (env === 'local') {
  require('dotenv').config({ path: './.env.local' });
  console.log("Running in local environment");
} 
else if (env === 'production') {
  require('dotenv').config({
    path: '/run/secrets/prod_storage_server_config'
  });
  console.log("Running in production environment");
} 
else if (env === 'production-kube') {
  require('dotenv').config({ path: './.env.prod.kube' });
  console.log("Running in production-kube environment");
} 
else {
  require('dotenv').config({ path: './.env.dev' });
  console.log("Running in development environment");
}

/**************************/

const express = require("express");
const mongoose = require("mongoose");
const appUses = require("./Startup/appUses.js");

// Cron jobs
require("./cron/stockAlert");

const app = express();

// apply your function here ✅
appUses(express, app);

// environment vars
const PORT = process.env.PORT || 5000;

// test route (optional)
app.get('/', (req, res) => {
  res.send('Welcome To EMS Server');
});

// Server Launch
app.listen(PORT, async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB ready");

    console.log(`Server is Running on port : ${PORT}`);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
});