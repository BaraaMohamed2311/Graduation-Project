const cron = require("node-cron");
const executeQuery = require("../Utils/executeMySqlQuery");
const createConsultationAlert = require("../Utils/createConsultationAlert");

// Runs every day at 04:05 (5 minutes after midnight)
cron.schedule("5 16  * * *", async () => {
  try {
    console.log("Running daily consultation auto-complete job...");

    // Grab the rows we're about to flip first — MySQL's UPDATE doesn't
    // return affected ids, and we need hosp_emp_id/user_id to alert.
    const dueQuery = `
      SELECT consultation_id, hosp_emp_id, user_id, consultation_date
      FROM consultations
      WHERE consultation_status = 'Scheduled'
        AND consultation_date < CURDATE();
    `;
    const dueConsultations = await executeQuery(dueQuery);

    const query = `
      UPDATE consultations 
      SET consultation_status = 'Completed'
      WHERE consultation_status = 'Scheduled'
        AND consultation_date < CURDATE();
    `;

    const result = await executeQuery(query);
    console.log(`Auto-complete job finished. Rows updated: ${result.affectedRows}`);

    for (const consultation of dueConsultations) {
      await createConsultationAlert({
        alert_name: "Consultation Auto-Completed",
        alert_details: `Consultation #${consultation.consultation_id} on ${consultation.consultation_date} was automatically marked Completed.`,
        alert_status: "Completed",
        consultation_id: consultation.consultation_id,
        hosp_emp_id: consultation.hosp_emp_id,
        user_id: consultation.user_id,
      });
    }

  } catch (err) {
    console.error("Cron job error:", err);
  }
});