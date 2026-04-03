const cors = require("cors");
const rateLimit   = require("express-rate-limit")
const hpp = require("hpp")
// routers

const authApis = require("../Routers/auth.js");
const medApis = require("../Routers/meds.js");


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


    app.set('trust proxy', true);
    // limits requests and status 429 if too many
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            limit: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
            standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
            legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
            keyGenerator: (req) => req.ip, // real user IP now
        })
    app.use(limiter)
    // http poluution prevention
    app.use(hpp())


    // Routes
    app.use("/api/user",authApis)
    app.use("/api/meds",medApis)


}

module.exports = appUses;