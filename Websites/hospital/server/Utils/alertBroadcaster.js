// Utils/alertBroadcaster.js
const clients = new Map(); // res -> { user_id, floor_number }

function addClient(res, user_id, floor_number) {
  clients.set(res, { user_id, floor_number });
}

function removeClient(res) {
  clients.delete(res);
}

function canSee(alert, user_id, floor_number) {
  if (alert.alert_type === "consultation") {
    return String(alert.hosp_emp_id) === String(user_id) || String(alert.user_id) === String(user_id);
  }
  if (alert.alert_type === "medication" || alert.alert_type === "critical") {
    return String(alert.floor_number) === String(floor_number);
  }
  return true;
}

function broadcast(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const [res, meta] of clients) {
    if (canSee(data, meta.user_id, meta.floor_number)) res.write(payload);
  }
}

module.exports = { addClient, removeClient, broadcast };