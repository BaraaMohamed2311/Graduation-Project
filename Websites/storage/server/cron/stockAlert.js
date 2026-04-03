const cron = require("node-cron");
const nodemailer = require("nodemailer");
const Medicine = require("../models/Medicine");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Runs every day at 8:00 AM
cron.schedule("47 13 * * *", async () => {
  console.log("[CRON] Checking low stock medicines...");

  try {
    const lowStock = await Medicine.find({
      $expr: { $lte: ["$med_quantity", "$med_threshold"] },
    });

    if (lowStock.length === 0) {
      console.log("[CRON] All medicines are sufficiently stocked.");
      return;
    }

    const list = lowStock
      .map(
        (m) =>
          `- ${m.med_name} (ID: ${m.med_id}): Qty ${m.med_quantity} / Threshold ${m.med_threshold}`
      )
      .join("\n");

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ALERT_EMAIL,
      subject: "⚠️ Hospital - Low Medicine Stock Alert",
      text: `The following medicines are at or below their threshold:\n\n${list}\n\nPlease restock immediately.`,
    });

    console.log(`[CRON] Alert sent for ${lowStock.length} medicine(s).`);
  } catch (err) {
    console.error("[CRON] Error during stock check:", err.message);
  }
});
