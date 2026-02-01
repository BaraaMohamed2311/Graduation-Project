const { TableAliases } = require("../Tables/data");
function parseUpdatingStringByTable(updating_string) {
    if (!updating_string || updating_string.trim() === '') {
        return {};
    }

    // Create reverse map: alias -> table name
    const aliasToTable = {};
    Object.entries(TableAliases).forEach(([table, alias]) => {
        aliasToTable[alias] = table;
    });

    const result = {};
    
    // Split by comma, handling commas inside quotes
    const parts = updating_string.match(/(?:[^,']|'[^']*')+/g) || [];
    
    parts.forEach(part => {
        part = part.trim();
        
        // Extract alias prefix (e.g., "u." from "u.user_name = 'value'")
        const match = part.match(/^([a-z]+)\./i);
        
        if (match) {
            const alias = match[1];
            const tableName = aliasToTable[alias];
            
            if (tableName) {
                // Remove alias prefix from the field
                const fieldWithoutAlias = part.substring(alias.length + 1);
                
                if (!result[tableName]) {
                    result[tableName] = [];
                }
                result[tableName].push(fieldWithoutAlias);
            }
        }
    });
    
    // Join arrays into strings
    Object.keys(result).forEach(table => {
        result[table] = result[table].join(', ');
    });
    
    return result;
}

module.exports = parseUpdatingStringByTable;