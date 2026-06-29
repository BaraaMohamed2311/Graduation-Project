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
const DetailsApis = require("../Routers/details.js");
const SyncApis = require("../Routers/sync.js")
const medsApis = require("../Routers/meds.js")
const devicesApis = require("../Routers/devices.js")
const alertsApis = require("../Routers/alertsRouter.js")
const staffApis = require("../Routers/staff.js")

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
    app.use("/api/list",listApis)
    app.use("/api/meds",medsApis)
    app.use("/api/user",authApis)
    app.use("/api/files",filesApis)
    app.use("/api/mail",MailApis)
    app.use("/api/rooms",RoomsApis)
    app.use("/api/booking",BookingApis)
    app.use("/api/details",DetailsApis)
    app.use("/api/sync",SyncApis)
    app.use("/api/alerts", alertsApis); // add this
    app.use("/api/devices", devicesApis);
    app.use("/api/staff", staffApis);

}

module.exports = appUses;