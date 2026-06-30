const Alert = require("../Models/alert");
const { broadcast } = require("./alertBroadcaster");

/**
 * Creates a consultation alert in MongoDB and broadcasts it over SSE,
 * following the same shape used by the existing critical/medication alerts
 * (alert_type, alert_name, alert_details, alert_status, alert_time).
 *
 * hosp_emp_id / user_id / consultation_id are stored alongside the standard
 * fields so the alert can later be scoped to a specific recipient if needed —
 * today's alert feed is broadcast to every connected client, same as the
 * existing critical/medication alerts.
 */
async function createConsultationAlert({
  alert_name,
  alert_details,
  alert_status,
  consultation_id,
  hosp_emp_id,
  user_id,
}) {
  try {
    const alert = await Alert.create({
      alert_type: "consultation",
      alert_name,
      alert_details,
      alert_status,
      alert_time: new Date(),
      consultation_id,
      hosp_emp_id,
      user_id,
    });

    broadcast(alert);
    return alert;
  } catch (err) {
    // Alerting should never block the consultation flow itself
    console.error("Failed to create consultation alert:", err);
    return null;
  }
}

module.exports = createConsultationAlert;