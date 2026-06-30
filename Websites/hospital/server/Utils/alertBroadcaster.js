// Utils/alertBroadcaster.js
const clients = new Map(); // res -> { user_id }

function addClient(res, user_id) {
  clients.set(res, { user_id });
}

function removeClient(res) {
  clients.delete(res);
}

function canSee(alert, user_id) {
  if (alert.alert_type !== "consultation") return true;
  return String(alert.hosp_emp_id) === String(user_id) || String(alert.user_id) === String(user_id);
}

function broadcast(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const [res, meta] of clients) {
    if (canSee(data, meta.user_id)) res.write(payload);
  }
}

module.exports = { addClient, removeClient, broadcast };