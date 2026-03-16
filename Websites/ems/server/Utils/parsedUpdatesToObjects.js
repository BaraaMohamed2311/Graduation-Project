/**
 * Convert parsed updates to objects
 * Input: { 
 *   users: { sql: "user_name = ?, user_email = ?", values: ["Ali", "a@b.com"] },
 *   employees: { sql: "emp_salary = ?", values: [5000] }
 * }
 * Output: {
 *   users: { user_name: "Ali", user_email: "a@b.com" },
 *   employees: { emp_salary: 5000 }
 * }
 */
function parsedUpdatesToObjects(parsedUpdates) {
    const result = {};
    
    Object.entries(parsedUpdates).forEach(([tableName, updateData]) => {
        if (!updateData || typeof updateData !== 'object') {
            result[tableName] = {};
            return;
        }

        const { sql, values } = updateData;
        
        if (!sql || sql.trim() === '' || !Array.isArray(values)) {
            result[tableName] = {};
            return;
        }
        
        const fields = {};
        
        // Parse the SQL string to extract field names
        // SQL format: "field1 = ?, field2 = ?, field3 = ?"
        const fieldMatches = sql.matchAll(/([a-z_]+)\s*=\s*\?/gi);
        const fieldNames = Array.from(fieldMatches, match => match[1]);
        
        // Map field names to their values
        fieldNames.forEach((fieldName, index) => {
            if (index < values.length) {
                fields[fieldName] = values[index];
            }
        });
        
        result[tableName] = fields;
    });
    
    return result;
}

module.exports = parsedUpdatesToObjects;