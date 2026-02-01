function parsedUpdatesToObjects(parsedUpdates) {
    const result = {};
    
    Object.entries(parsedUpdates).forEach(([tableName, updateString]) => {
        if (!updateString || updateString.trim() === '') {
            result[tableName] = {};
            return;
        }
        
        const fields = {};
        
        // Split by comma
        const parts = updateString.split(',');
        
        parts.forEach(part => {
            part = part.trim();
            
            // Split by '='
            const [column, value] = part.split('=');
            
            if (column && value) {
                let cleanValue = value.trim();
                
                // Remove surrounding quotes if present
                if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
                    (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
                    cleanValue = cleanValue.slice(1, -1);
                }
                
                fields[column.trim()] = cleanValue;
            }
        });
        
        result[tableName] = fields;
    });
    
    return result;
}

module.exports = parsedUpdatesToObjects;