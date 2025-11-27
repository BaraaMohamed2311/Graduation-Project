const cron = require("node-cron");
const executeQuery = require("../Utils/executeMySqlQuery");

// Runs every day at 04:05 (5 minutes after midnight)
cron.schedule("5 16  * * *", async () => {
  try {
    console.log("Running daily consultation auto-complete job...");

    const query = `
      UPDATE consultations 
      SET consultation_status = 'Completed'
      WHERE consultation_status = 'Scheduled'
        AND consultation_date < CURDATE();
    `;

    const result = await executeQuery(query);
    console.log(`Auto-complete job finished. Rows updated: ${result.affectedRows}`);

  } catch (err) {
    console.error("Cron job error:", err);
  }
});
