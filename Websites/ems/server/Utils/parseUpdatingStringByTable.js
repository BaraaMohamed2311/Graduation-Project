const { TableAliases } = require("../Tables/data");

/**
 * Parse updating object from buildJoinedUpdate
 * Input: { sql: "u.user_name = ? , e.emp_salary = ? , u.user_email = ?", values: ["Ali", 5000, "a@b.com"] }
 * Output: { 
 *   users: { sql: "user_name = ?, user_email = ?", values: ["Ali", "a@b.com"] },
 *   employees: { sql: "emp_salary = ?", values: [5000] }
 * }
 */
function parseUpdatingStringByTable(updatingObj) {
    if (!updatingObj || typeof updatingObj !== 'object') {
        return {};
    }

    const { sql, values } = updatingObj;

    if (!sql || sql.trim() === '' || !Array.isArray(values)) {
        return {};
    }

    // Create reverse map: alias -> table name
    const aliasToTable = {};
    Object.entries(TableAliases).forEach(([table, alias]) => {
        aliasToTable[alias] = table;
    });

    const result = {};
    
    // Split by comma to get individual SET clauses
    // Each part looks like: "u.user_name = ?" or "e.emp_salary = ?"
    const parts = sql.split(',').map(p => p.trim());
    
    let valueIndex = 0;

    parts.forEach(part => {
        // Extract alias and field name from "u.user_name = ?"
        const match = part.match(/^([a-z]+)\.([a-z_]+)\s*=\s*\?/i);
        
        if (match && valueIndex < values.length) {
            const alias = match[1];
            const fieldName = match[2];
            const tableName = aliasToTable[alias];
            
            if (tableName) {
                // Initialize table entry if it doesn't exist
                if (!result[tableName]) {
                    result[tableName] = {
                        fields: [],
                        values: []
                    };
                }
                
                // Add field and corresponding value
                result[tableName].fields.push(fieldName);
                result[tableName].values.push(values[valueIndex]);
                
                valueIndex++;
            }
        }
    });
    
    // Convert to final format: { sql: "field1 = ?, field2 = ?", values: [...] }
    const finalResult = {};
    Object.entries(result).forEach(([tableName, data]) => {
        const { fields, values: tableValues } = data;
        
        // Build SET clause for this table: "field1 = ?, field2 = ?"
        const setSql = fields.map(field => `${field} = ?`).join(', ');
        
        finalResult[tableName] = {
            sql: setSql,
            values: tableValues
        };
    });
    
    return finalResult;
}

module.exports = parseUpdatingStringByTable;