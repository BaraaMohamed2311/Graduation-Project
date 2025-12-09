

// ==== RANDOM DATA GENERATORS ====

const allergiesList = [
    "Dust", "Pollen", "Gluten", "Peanuts", "Seafood", "Lactose",
    "Insect bites", "Perfume", "Penicillin"
];

const chronicList = [
    "Diabetes", "Hypertension", "Asthma", "Arthritis",
    "Heart Disease", "Thyroid Disorder", "Kidney Disease"
];

const devicesList = [
    { device: "heartbeat_monitor", unit: "bpm", min: 55, max: 110 },
    { device: "blood_pressure_sensor", unit: "mmHg", min: 70, max: 150 },
    { device: "oxygen_sensor", unit: "%", min: 90, max: 100 },
    { device: "temperature_probe", unit: "°C", min: 36, max: 39 },
];

// Pick N random items
function pickRandom(arr, maxCount = 3) {
    const count = Math.floor(Math.random() * (maxCount + 1));
    const shuffled = arr.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Generate random device state
function randomDeviceReading() {
    const d = devicesList[Math.floor(Math.random() * devicesList.length)];
    return {
        device: d.device,
        value: Math.floor(Math.random() * (d.max - d.min + 1)) + d.min,
        unit: d.unit,
        recordedAt: new Date(
            Date.now() - Math.floor(Math.random() * 7 * 24 * 3600 * 1000)
        ), // within last 7 days
    };
}

// ==== MAIN SEED FUNCTION ====

async function seed() {
    try {





        let docs = [];

        for (let id = 256; id <= 304; id++) {
            const doc = {
                "user_id": id,
                "patient_allergic": pickRandom(allergiesList),
                "patient_chronic_illnes": pickRandom(chronicList),
               
            };

            docs.push(doc);
        }



        console.log("Inserted", docs,);


    } catch (err) {
        console.error(err);

    }
}

seed();
