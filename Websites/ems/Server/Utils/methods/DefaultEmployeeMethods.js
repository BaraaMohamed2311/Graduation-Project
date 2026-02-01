// Create a new file: Utils/methods/DefaultEmployeeMethods.js
const executeMySqlQuery = require("../executeMySqlQuery");
const parseUpdatingStringByTable= require("../parseUpdatingStringByTable");
const parsedUpdatesToObjects = require("../parsedUpdatesToObjects");
const stringifyFields  = require("../stringifyFields");
const sqlTransaction = require("../sqlTransaction");

class DefaultEmployeeMethods {
    /**
     * Get basic employee data when no specific title handler exists
     */
    static async getDefaultEmployeeSpecificData(user_id) {
        const query = `
            SELECT 
                u.user_id,
                u.user_email,
                u.user_name,
                u.created_at,
                e.emp_abscence,
                e.emp_rate,
                e.emp_salary,
                e.emp_bonus,
                e.emp_title,
                e.emp_specialty,
                
                -- Permissions
                COALESCE(NULLIF(GROUP_CONCAT(DISTINCT p.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms,
                
                -- Role
                COALESCE(r.role_name, 'NormalUser') AS role_name

            FROM users u
            INNER JOIN employees e ON u.user_id = e.emp_id
            LEFT JOIN employee_perms ep ON e.emp_id = ep.emp_id
            LEFT JOIN perms p ON ep.perm_id = p.perm_id
            LEFT JOIN roles r ON e.emp_id = r.emp_id

            WHERE u.user_id = ? AND u.user_type = 'employee'

            GROUP BY 
                u.user_id,
                u.user_email,
                u.user_name,
                u.created_at,
                e.emp_abscence,
                e.emp_rate,
                e.emp_salary,
                e.emp_bonus,
                e.emp_title,
                e.emp_specialty,
                r.role_name
        `;
        const result = await executeMySqlQuery(query, [user_id]);
        return result[0] || {};
    }

    /**
     * Get full employee data when no specific title handler exists
     */
    static async getDefaultEmployeeFullData(user_id) {
        const query = `
            SELECT 
                u.user_id,
                u.user_email,
                u.user_name,
                u.created_at,
                e.emp_abscence,
                e.emp_rate,
                e.emp_salary,
                e.emp_bonus,
                e.emp_title,
                e.emp_specialty,
                
                -- Permissions
                COALESCE(NULLIF(GROUP_CONCAT(DISTINCT p.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms,
                
                -- Role
                COALESCE(r.role_name, 'NormalUser') AS role_name

            FROM users u
            INNER JOIN employees e ON u.user_id = e.emp_id
            LEFT JOIN employee_perms ep ON e.emp_id = ep.emp_id
            LEFT JOIN perms p ON ep.perm_id = p.perm_id
            LEFT JOIN roles r ON e.emp_id = r.emp_id

            WHERE u.user_id = ? AND u.user_type = 'employee'

            GROUP BY 
                u.user_id,
                u.user_email,
                u.user_name,
                u.created_at,
                e.emp_abscence,
                e.emp_rate,
                e.emp_salary,
                e.emp_bonus,
                e.emp_title,
                e.emp_specialty,
                r.role_name
        `;
        const result = await executeMySqlQuery(query, [user_id]);
        return result[0] || {};
    }

    /**
     * Get all employees with a specific (unknown) title
     */
    static async getAllDefaultEmployeesFullData(limit = 10, offset = 0, whereClause = '', perms_CONDITION = '') {
        const perms_CONDITION_CLAUSE = perms_CONDITION 
            ? `HAVING FIND_IN_SET('${perms_CONDITION}', GROUP_CONCAT(DISTINCT p.perm_name)) > 0` 
            : "";

        const query = `
            SELECT 
                u.user_id,
                u.user_email,
                u.user_name,
                u.created_at,
                e.emp_abscence,
                e.emp_rate,
                e.emp_salary,
                e.emp_bonus,
                e.emp_title,
                e.emp_specialty,
                
                COALESCE(NULLIF(GROUP_CONCAT(DISTINCT p.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms,
                COALESCE(r.role_name, 'NormalUser') AS role_name

            FROM users u
            INNER JOIN employees e ON u.user_id = e.emp_id
            LEFT JOIN employee_perms ep ON e.emp_id = ep.emp_id
            LEFT JOIN perms p ON ep.perm_id = p.perm_id
            LEFT JOIN roles r ON e.emp_id = r.emp_id

            WHERE u.user_type = 'employee'
            ${whereClause ? "AND " + whereClause : ""}

            GROUP BY 
                u.user_id,
                u.user_email,
                u.user_name,
                u.created_at,
                e.emp_abscence,
                e.emp_rate,
                e.emp_salary,
                e.emp_bonus,
                e.emp_title,
                e.emp_specialty,
                r.role_name

            ${perms_CONDITION_CLAUSE}
            ORDER BY u.user_id
            LIMIT ${limit} OFFSET ${offset}
        `;
        
        return await executeMySqlQuery(query);
    }

    /**
     * Get count of employees with unknown titles
     */
    static async getAllDefaultEmployeesCOUNT(whereClause = '', perms_CONDITION = '') {
        const perms_CONDITION_CLAUSE = perms_CONDITION 
            ? `HAVING FIND_IN_SET('${perms_CONDITION}', GROUP_CONCAT(DISTINCT p.perm_name)) > 0` 
            : "";

        const query = `
            SELECT COUNT(*) as total_count
            FROM (
                SELECT u.user_id
                FROM users u
                INNER JOIN employees e ON u.user_id = e.emp_id
                LEFT JOIN employee_perms ep ON e.emp_id = ep.emp_id
                LEFT JOIN perms p ON ep.perm_id = p.perm_id
                LEFT JOIN roles r ON e.emp_id = r.emp_id

                WHERE u.user_type = 'employee'
                ${whereClause ? "AND " + whereClause : ""}

                GROUP BY u.user_id
                ${perms_CONDITION_CLAUSE}
            ) as subquery
        `;
        
        const result = await executeMySqlQuery(query);
        return result[0]?.total_count || 0;
    }


    // =================================================
    //  Full/Core Update Method
    // =================================================

    static async updateDefaultEmployeeFullCore(user_id, updating_string) {
        
        const parsedUpdates = parseUpdatingStringByTable(updating_string);
        const parsedObjects = parsedUpdatesToObjects(parsedUpdates);
        const queries = [];

        console.log("+++++parsedUpdates",parsedUpdates , updating_string , parsedObjects)

        // 1. Ensure user exists
        if (parsedUpdates.users) {
            queries.push(`
                UPDATE users
                SET ${parsedUpdates.users}
                WHERE user_id = ${user_id} AND user_type = 'employee'
            `);
        }

        // 2. UPSERT employees
        if (parsedUpdates.employees) {
            const { columns_field, values_field } = stringifyFields(
                "seperate",
                Object.entries(parsedObjects.employees) || {}
            );
            queries.push(`
                INSERT INTO employees (emp_id,${columns_field})
                VALUES (${user_id},${values_field})
                ON DUPLICATE KEY UPDATE
                    ${parsedUpdates.employees}
            `);
        }

        // 3. Version update
        queries.push(`
            UPDATE table_version
            SET current_version = current_version + 1
            WHERE table_name = 'ems_employees'
        `);
            console.log("Updating  employee:", user_id, updating_string);
        const result = await sqlTransaction(queries);

        // Check if user update affected any rows (to know if user exists)
        if (parsedUpdates.users && !result) {
            throw new Error('User not found. Please register the user first.');
        }
        
        return result;
}
}

module.exports = DefaultEmployeeMethods;