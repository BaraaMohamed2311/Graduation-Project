const { Tables ,TableAliases} = require("../Tables/data"); 
const stringifyFields = require("./stringifyFields");

// ------------------------------
// Main Function
// ------------------------------
function buildJoinedUpdate(newUpdateData) {
  if (!newUpdateData || typeof newUpdateData !== "object") return "";

  // 1. Group filters by table
  const tableGroups = {};

  for (const rawKey in newUpdateData) {
    const value = newUpdateData[rawKey];

    // 2. Find which table contains this field
    const tableName = findTableByField(rawKey);

    if (!TableAliases[tableName]) {
      console.warn(`No alias or table found for field: ${rawKey}`);
      continue;
    }

    // 3. Prepare entry
    if (!tableGroups[tableName]) tableGroups[tableName] = [];
    /* creates tableGroups keys are tables and values are entries of fields
      {
        users: [
          [ 'user_email', 'mahmoud.tarek3417@gmail.com' ],
          [ 'user_name', 'max' ]
        ],
        patients: [ [ 'patient_phone', '01572723340' ] ]
      }
    */
    tableGroups[tableName].push([rawKey,value]);
  }

  // 4. Build joined filters for each table
  const parts = [];

  for (const tableName in tableGroups) {
    const alias = TableAliases[tableName];
    const filterEntries = tableGroups[tableName];

    const sqlPart = stringifyFields("joined",filterEntries, alias);
    if (sqlPart) parts.push(sqlPart);
  }

  // 5. Join all parts
  return parts.length > 0 ? parts.join(" , ") : "";
}

// ------------------------------
// Find table containing a field
// ------------------------------
function findTableByField(field) {
  for (const tableName in Tables) {
    const columns = Tables[tableName];
    if (Array.isArray(columns) && columns.includes(field)) {
      return tableName;
    }
  }
  return null;
}

module.exports = buildJoinedUpdate;
