const executeMySqlQuery = require("../executeMySqlQuery");
const Tables = require("../../Tables/data");
const stringifyFields = require("../stringifyFields");
const sqlTransaction = require("../sqlTransaction");
const parseUpdatingStringByTable = require("../parseUpdatingStringByTable");
const parsedUpdatesToObjects = require("../parsedUpdatesToObjects");
const User = require("../../Classes/User");
class NurseMethods {



    // ============================
    //              COUNT
    // ============================
    static async getAllNursesCOUNT(whereClause = "", perms_CONDITION = ""){
    let query = "";
    // Optimize query construction based on presence of filters
    if(!whereClause && !perms_CONDITION){
        query = "SELECT COUNT(*) as count FROM nurses ";
    }
    else if(whereClause && !perms_CONDITION){
        query = `
            SELECT COUNT(DISTINCT n.emp_id) as count 
            FROM nurses n
            JOIN employees e ON n.hosp_emp_id = e.emp_id
            LEFT JOIN roles r ON n.hosp_emp_id = r.emp_id
            ${whereClause}
        `;
    }
    else if(!whereClause && perms_CONDITION){
        query = `
            SELECT COUNT(DISTINCT n.emp_id) as count 
            FROM nurses n
            JOIN employees e ON n.hosp_emp_id = e.emp_id
            LEFT JOIN employee_perms ep ON n.hosp_emp_id = ep.emp_id
            LEFT JOIN perms p ON ep.perm_id = p.perm_id
            ${perms_CONDITION}
        `;
    }
    else{
        query = `
            SELECT COUNT(DISTINCT n.emp_id) as count 
            FROM nurses n
            JOIN employees e ON n.hosp_emp_id = e.emp_id
            LEFT JOIN employee_perms ep ON n.hosp_emp_id = ep.emp_id
            LEFT JOIN perms p ON ep.perm_id = p.perm_id
            LEFT JOIN roles r ON n.hosp_emp_id = r.emp_id
            ${whereClause}
            ${perms_CONDITION}
        `;
    }
    const result = await executeMySqlQuery(query);
    return result[0]?.count;
}

    // ============================
    //              GET
    // ============================

    static async getAllNursesFullData(limit=10,offset=0,whereClause='', perms_CONDITION=''){
        
        const query = `
        SELECT 
            -- from users
            u.user_id,
            u.user_email,
            u.user_name,
            
            -- from employees
            e.emp_abscence,
            e.emp_rate,
            e.emp_title,
            e.emp_specialty,
            e.emp_salary,
            e.emp_bonus,
            
            -- from employees_hospital
            eh.hosp_emp_id,
            
            -- from nurses (may be NULL)
            ANY_VALUE(n.emp_id) AS emp_id,
            ANY_VALUE(n.floor_number) AS floor_number,
            
            -- from perms via employee_perms
            COALESCE(NULLIF(GROUP_CONCAT(DISTINCT p.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms,
            
            -- from roles with COALESCE for default
            COALESCE(ANY_VALUE(r.role_name), 'NormalUser') AS role_name,
            
            -- FIXED: availability schedule using subquery to format times first
            COALESCE((
                SELECT GROUP_CONCAT(
                    DISTINCT CONCAT(
                        formatted.day_of_week, 
                        ': ', 
                        formatted.formatted_start, 
                        '-', 
                        formatted.formatted_end
                    )
                    ORDER BY formatted.day_of_week
                    SEPARATOR '; '
                )
                FROM (
                    SELECT 
                        day_of_week,
                        DATE_FORMAT(start_time, '%H:%i') as formatted_start,
                        DATE_FORMAT(end_time, '%H:%i') as formatted_end
                    FROM availability 
                    WHERE hosp_emp_id = eh.hosp_emp_id
                ) AS formatted
            ), 'None') AS availability_schedule

        FROM users u
        INNER JOIN employees e ON u.user_id = e.emp_id
        INNER JOIN employees_hospital eh ON e.emp_id = eh.emp_id
        
        -- LEFT JOIN for optional nurse data
        LEFT JOIN nurses n ON eh.hosp_emp_id = n.hosp_emp_id

        -- LEFT JOIN for permissions and roles
        LEFT JOIN employee_perms ep ON eh.hosp_emp_id = ep.emp_id
        LEFT JOIN perms p ON ep.perm_id = p.perm_id
        LEFT JOIN roles r ON eh.hosp_emp_id = r.emp_id

        WHERE u.user_type = 'employee'
        AND eh.emp_title = 'Nurse'
        ${whereClause} 

        GROUP BY u.user_id, eh.hosp_emp_id, e.emp_id
        ${perms_CONDITION}
        LIMIT ${limit} OFFSET ${offset}
    `;

    const result = await executeMySqlQuery(query);
    return result;
    }

    static async getNurseFullData(emp_id){
         const query = `
        SELECT 
            -- from users
            u.user_id,
            u.user_email,
            u.user_name,

            -- from employees
            e.emp_abscence,
            e.emp_rate,
            e.emp_title,
            e.emp_specialty,
            e.emp_salary,
            e.emp_bonus,
            
            -- from employees_hospital
            eh.hosp_emp_id,
            
            -- from nurses (may be NULL)
            n.emp_id,
            n.floor_number,
            
            -- from perms via employee_perms (subquery)
            COALESCE(NULLIF((
                SELECT GROUP_CONCAT(DISTINCT p.perm_name SEPARATOR ', ')
                FROM employee_perms ep
                JOIN perms p ON ep.perm_id = p.perm_id
                WHERE ep.emp_id = eh.hosp_emp_id
            ), ''), 'None') AS emp_perms,
            
            -- from roles with COALESCE for default (subquery)
            COALESCE((
                SELECT r.role_name
                FROM roles r
                WHERE r.emp_id = eh.hosp_emp_id
            ), 'NormalUser') AS role_name,
            
            -- FIXED: availability schedule using subquery to format times first
            COALESCE((
                SELECT GROUP_CONCAT(
                    DISTINCT CONCAT(
                        formatted.day_of_week, 
                        ': ', 
                        formatted.formatted_start, 
                        '-', 
                        formatted.formatted_end
                    )
                    ORDER BY formatted.day_of_week
                    SEPARATOR '; '
                )
                FROM (
                    SELECT 
                        day_of_week,
                        DATE_FORMAT(start_time, '%H:%i') as formatted_start,
                        DATE_FORMAT(end_time, '%H:%i') as formatted_end
                    FROM availability 
                    WHERE hosp_emp_id = eh.hosp_emp_id
                ) AS formatted
            ), 'None') AS availability_schedule

        FROM users u
        INNER JOIN employees e ON u.user_id = e.emp_id
        INNER JOIN employees_hospital eh ON e.emp_id = eh.emp_id
        
        -- LEFT JOIN for optional nurse data
        LEFT JOIN nurses n ON eh.hosp_emp_id = n.hosp_emp_id
        
        WHERE u.user_type = 'employee'
        AND eh.hosp_emp_id = ?
        AND eh.emp_title = 'Nurse'
    `;

    const result = await executeMySqlQuery(query, [emp_id]);
    return result[0];
    }

        static async getAllNursesSpecificData(){
        const query = `
        SELECT 
            -- from users
            u.user_id,
            u.user_email,
            u.user_name,

            -- from employees
            e.emp_abscence,
            e.emp_rate,
            e.emp_title,
            e.emp_specialty,
            e.emp_salary,
            e.emp_bonus,
            
            -- from employees_hospital
            eh.hosp_emp_id,
            
            -- from nurses (may be NULL)
            n.floor_number,
            
            -- FIXED: availability schedule using subquery to format times first
            COALESCE((
                SELECT GROUP_CONCAT(
                    DISTINCT CONCAT(
                        formatted.day_of_week, 
                        ': ', 
                        formatted.formatted_start, 
                        '-', 
                        formatted.formatted_end
                    )
                    ORDER BY formatted.day_of_week
                    SEPARATOR '; '
                )
                FROM (
                    SELECT 
                        day_of_week,
                        DATE_FORMAT(start_time, '%H:%i') as formatted_start,
                        DATE_FORMAT(end_time, '%H:%i') as formatted_end
                    FROM availability 
                    WHERE hosp_emp_id = eh.hosp_emp_id
                ) AS formatted
            ), 'None') AS availability_schedule

        FROM users u
        INNER JOIN employees e ON u.user_id = e.emp_id
        INNER JOIN employees_hospital eh ON e.emp_id = eh.emp_id
        
        -- LEFT JOIN for optional nurse data
        LEFT JOIN nurses n ON eh.hosp_emp_id = n.hosp_emp_id
        
        WHERE u.user_type = 'employee'
        AND eh.emp_title = 'Nurse'
    `;
    
    const result = await executeMySqlQuery(query);
    return result;
    }

    static async getNurseSpecificData(emp_id){
        const query = `
        SELECT 
            -- from users
            u.user_id,
            u.user_email,
            u.user_password,
            u.user_name,

            -- from employees
            e.emp_salary,
            e.emp_abscence,
            e.emp_bonus,
            e.emp_rate,
            e.emp_title,
            e.emp_specialty,

            -- from employees_hospital
            eh.hosp_emp_id,
            
            -- from nurses (may be NULL)
            n.floor_number,
            
            -- FIXED: availability schedule using subquery to format times first
            COALESCE((
                SELECT GROUP_CONCAT(
                    DISTINCT CONCAT(
                        formatted.day_of_week, 
                        ': ', 
                        formatted.formatted_start, 
                        '-', 
                        formatted.formatted_end
                    )
                    ORDER BY formatted.day_of_week
                    SEPARATOR '; '
                )
                FROM (
                    SELECT 
                        day_of_week,
                        DATE_FORMAT(start_time, '%H:%i') as formatted_start,
                        DATE_FORMAT(end_time, '%H:%i') as formatted_end
                    FROM availability 
                    WHERE hosp_emp_id = eh.hosp_emp_id
                ) AS formatted
            ), 'None') AS availability_schedule

        FROM users u
        INNER JOIN employees e ON u.user_id = e.emp_id
        INNER JOIN employees_hospital eh ON e.emp_id = eh.emp_id
        
        -- LEFT JOIN for optional nurse data
        LEFT JOIN nurses n ON eh.hosp_emp_id = n.hosp_emp_id
        
        WHERE u.user_type = 'employee'
        AND eh.hosp_emp_id = ?
        AND eh.emp_title = 'Nurse'
    `;
    
    const result = await executeMySqlQuery(query, [emp_id]);
    return result[0];
    }
    // ============================
    //              Update
    // ============================

    // Updated updateNurseFullCore function
static async updateNurseFullCore(emp_id, updating_string){

    
    // Parse updating_string by table (returns strings) mapped to tables
    const parsedUpdates = parseUpdatingStringByTable(updating_string);
    // Convert to objects {col: val} mapped to tables
    const parsedObjects = parsedUpdatesToObjects(parsedUpdates);

    const queries = [];

    // 1. UPDATE ONLY users table (NO UPSERT - user must exist via registration)
    if (parsedUpdates.users) {
        queries.push(`
            UPDATE users
            SET ${parsedUpdates.users}
            WHERE user_id = ${emp_id} AND user_type = 'employee'
        `);
    }
    
    // 2. UPSERT employees table (has defaults, can insert)
    if (parsedUpdates.employees) {
        const {columns_field, values_field} = stringifyFields("seperate",Object.entries(parsedObjects.employees) || {});
        queries.push(`
            INSERT INTO employees (emp_id,${columns_field})
            VALUES (${emp_id},${values_field})
            ON DUPLICATE KEY UPDATE
                ${parsedUpdates.employees}
        `);
    }
    
    // 3. UPSERT nurses table (has defaults via hosp_emp_id, can insert)
    if (parsedUpdates.nurses) {
        const {columns_field, values_field} = stringifyFields("seperate",Object.entries(parsedObjects.nurses) || {});
        queries.push(`
            INSERT INTO nurses (emp_id,hosp_emp_id,${columns_field})
            VALUES (${emp_id},${emp_id},${values_field})
            ON DUPLICATE KEY UPDATE
                ${parsedUpdates.nurses}
        `);
    }
    
    // 4. Version update
    queries.push(`
        UPDATE table_version
        SET current_version = current_version + 1
        WHERE table_name = 'ems_employees'
    `);
    
    const result = await sqlTransaction(queries);
    
    // Check if user update affected any rows (to know if user exists)
    if (parsedUpdates.users && !result) {
        throw new Error('User not found. Please register the user first.');
    }
    
    return result;
}



}

module.exports = NurseMethods;