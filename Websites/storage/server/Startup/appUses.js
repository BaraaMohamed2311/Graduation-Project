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


    app.set('trust proxy', 1) // trust first proxy;
        // limits requests and status 429 if too many
            const limiter = rateLimit({
                windowMs: 15 * 60 * 1000,
                limit: 1000,
                standardHeaders: 'draft-7',
                legacyHeaders: false,
                keyGenerator: (req) => {
                    // Use authenticated user ID if available
                    const authHeader = req.headers['authorization'];
                    if (authHeader && authHeader.startsWith('Bearer ')) {
                        try {
                            const token = authHeader.split(' ')[1];
                            const decoded = jwt.verify(token, process.env.JWT_SECRET);
                            return `user:${decoded.user_id}`;
                        } catch {
                            // Invalid token — fall back to IP
                        }
                    }
                    // Unauthenticated routes (login, register) — use IP
                    return `ip:${req.ip}`;
                },
                skip: (req) => {
                    // Don't rate limit health checks
                    return req.path === '/health';
                }
            })
    app.use(limiter)
    // http poluution prevention
    app.use(hpp())


    // Routes
    app.use("/api/user",authApis)
    app.use("/api/meds",medApis)


}

module.exports = appUses;