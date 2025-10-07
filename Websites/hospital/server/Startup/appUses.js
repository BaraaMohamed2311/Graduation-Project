const cors = require("cors");
const rateLimit   = require("express-rate-limit")
const hpp = require("hpp")
// routers
const listApis = require("../Routers/list.js");
const authApis = require("../Routers/auth.js");
const filesApis = require("../Routers/files.js");
const MailApis = require("../Routers/mail.js");
const RoomsApis = require("../Routers/rooms.js");
const BookingApis = require("../Routers/booking.js");


function appUses(express ,app){

    // to unjson requests
    app.use(express.json());
    app.use(cors());
    // Middleware to enable CORS
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*"); // Allow all origins
        res.header("Access-Control-Expose-Headers", "Content-Type"); // Expose Content-Type header
        next();
    });

  /**********************Security***********************************/ 

    // limits requests and status 429 if too many
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
        standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
        
    })
    app.use(limiter)
    // http poluution prevention
    app.use(hpp())

    

  
    // Routes
    app.use("/api/list",listApis)
    app.use("/api/user",authApis)
    app.use("/api/files",filesApis)
    app.use("/api/mail",MailApis)
    app.use("/api/rooms",RoomsApis)
    app.use("/api/booking",BookingApis)


}

module.exports = appUses;