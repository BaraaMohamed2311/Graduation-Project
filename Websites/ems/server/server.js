// configuring dotenv to access variables
const dev = process.env.NODE_ENV ;

if (dev === 'local') {
  require('dotenv').config({ path: './.env.local' }); 
} else if(dev === 'production') {
  require('dotenv').config({ path: './.env.prod' });   // Load production environment variable
}
else if(dev === 'production-kube') {
  require('dotenv').config({ path: './.env.prod.kube' });   // Load production environment variables
}
else{
  require('dotenv').config({ path: './.env.dev' });  // Load development environment variables
}
/**************************/
const express = require("express");
const app = express();
const consoleLog = require("./Utils/consoleLog.js");
const appUses = require("./Startup/appUses.js");
const mongoose = require("mongoose")
// environment vars
const PORT = process.env.PORT;


  appUses(express ,app);


  app.get('/', (req, res) => {
    res.send('Welcome To EMS Server')
  })

// Server Launch
app.listen(PORT,async (req, res)=>{
    await mongoose.connect(process.env.EMS_MongoDB);
    console.log("MongoDB ready");
    consoleLog(`Server is Running on port : ${PORT}` , "success"); 
})


