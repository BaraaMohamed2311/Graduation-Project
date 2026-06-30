const executeMySqlQuery = require("../executeMySqlQuery");
const stringifyFields = require("../stringifyFields");
const sqlTransaction = require("../sqlTransaction");
const parseUpdatingStringByTable = require("../parseUpdatingStringByTable");
const parsedUpdatesToObjects = require("../parsedUpdatesToObjects");
const generatePlaceholders = require("../generatePlaceholders");
const AvailabilityMethods = require("../methods/AvailabilityMethods");
// ================================================================================================================
//              This class is to fetch general data about any user even if they don't have a implemented class
// ================================================================================================================
class generalUserMethods {
    static async getUserAvailability(hosp_emp_id) {
    return await AvailabilityMethods.getAllAvailabilityDays(hosp_emp_id);
}

static async updateUserAvailability(hosp_emp_id, availabilityString) {
    return await AvailabilityMethods.updateAvailability(hosp_emp_id, availabilityString);
}

    // ============================
    //              COUNT
    // ============================

    static async getAllUsersCOUNT(whereClause = "", perms_CONDITION = "") {
        let query = "";

        if (!whereClause && !perms_CONDITION) {
            query = `SELECT COUNT(*) as count FROM users`;

        } else if (whereClause && !perms_CONDITION) {
            query = `
                SELECT COUNT(DISTINCT u.user_id) as count
                FROM users u
                LEFT JOIN employees e ON u.user_id = e.emp_id
                LEFT JOIN employees_hospital eh ON e.emp_id = eh.emp_id
                LEFT JOIN hospital_roles hr ON eh.hosp_emp_id = hr.hosp_emp_id
                ${whereClause}
            `;

        } else if (!whereClause && perms_CONDITION) {
            query = `
                SELECT COUNT(DISTINCT u.user_id) as count
                FROM users u
                LEFT JOIN employees e ON u.user_id = e.emp_id
                LEFT JOIN employees_hospital eh ON e.emp_id = eh.emp_id
                LEFT JOIN hospital_emp_perms hep ON eh.hosp_emp_id = hep.hosp_emp_id
                LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
                ${perms_CONDITION}
            `;

        } else {
            query = `
                SELECT COUNT(DISTINCT u.user_id) as count
                FROM users u
                LEFT JOIN employees e ON u.user_id = e.emp_id
                LEFT JOIN employees_hospital eh ON e.emp_id = eh.emp_id
                LEFT JOIN hospital_emp_perms hep ON eh.hosp_emp_id = hep.hosp_emp_id
                LEFT JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
                LEFT JOIN hospital_roles hr ON eh.hosp_emp_id = hr.hosp_emp_id
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

    // ---------- existing methods (untouched) ----------

    static async getUserData(user_id, isLoginData = false) {
        const query = `SELECT 
                user_id,
                user_email,
                user_password,
                user_name FROM users WHERE user_id = ${user_id}`;
        console.log("query", query);
        const result = await executeMySqlQuery(query);
        return result[0];
    }

    static async getUserEmpData(user_id) {
        const query = `SELECT 
                    emp_abscence,
                    emp_rate,
                    emp_title,
                    emp_specialty FROM employees WHERE emp_id = ${user_id}`;
        const result = await executeMySqlQuery(query);
        return result[0];
    }

    static async getUserSpecific(user_id) {
        const query = `
                SELECT
                u.user_id,
                u.user_email,
                u.user_password,
                u.user_name,
                e.emp_abscence,
                e.emp_rate,
                e.emp_title,
                e.emp_specialty
                FROM users u
                LEFT JOIN employees e
                ON u.user_id = e.emp_id
                WHERE u.user_id = ${user_id};
            `;
        const result = await executeMySqlQuery(query);
        return result[0];
    }

    // ---------- new methods ----------

    /**
     * All users, full data — with optional filtering/perms/pagination.
     * Mirrors getAllNursesFullData but without the nurses table join.
     */
    static async getAllUsersFullData(limit = 10, offset = 0, whereClause = "", perms_CONDITION = "") {
        const query = `
            SELECT
                -- from users
                u.user_id,
                u.user_email,
                u.user_name,
                u.user_type,

                -- from employees (NULL when not an employee)
                e.emp_abscence,
                e.emp_rate,
                e.emp_title,
                e.emp_specialty,

                -- from employees_hospital (NULL when not an employee)
                eh.hosp_emp_id,

                -- permissions
                COALESCE(NULLIF(GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', '), ''), 'None') AS emp_perms,

                -- role
                COALESCE(ANY_VALUE(hr.role_name), 'NormalUser') AS role_name,

                -- availability schedule
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
                            DATE_FORMAT(start_time, '%H:%i') AS formatted_start,
                            DATE_FORMAT(end_time,   '%H:%i') AS formatted_end
                        FROM availability
                        WHERE hosp_emp_id = eh.hosp_emp_id
                    ) AS formatted
                ), 'None') AS availability_schedule

            FROM users u
            LEFT JOIN employees e          ON u.user_id      = e.emp_id
            LEFT JOIN employees_hospital eh ON e.emp_id       = eh.emp_id
            LEFT JOIN hospital_emp_perms hep ON eh.hosp_emp_id = hep.hosp_emp_id
            LEFT JOIN hospital_perms hp      ON hep.perm_id    = hp.perm_id
            LEFT JOIN hospital_roles hr      ON eh.hosp_emp_id = hr.hosp_emp_id

            ${whereClause}

            GROUP BY u.user_id, eh.hosp_emp_id, e.emp_id
            ${perms_CONDITION}
            LIMIT ${limit} OFFSET ${offset}
        `;

        const result = await executeMySqlQuery(query);
        return result;
    }

    /**
     * Single user, full data (by hosp_emp_id or user_id).
     * Mirrors getNurseFullData but without the nurses table join.
     */
    static async getUserFullData(user_id) {
        const query = `
            SELECT
                -- from users
                u.user_id,
                u.user_email,
                u.user_name,
                u.user_type,

                -- from employees
                e.emp_abscence,
                e.emp_rate,
                e.emp_title,
                e.emp_specialty,

                -- from employees_hospital
                eh.hosp_emp_id,

                -- permissions (subquery avoids GROUP BY on the outer query)
                COALESCE(NULLIF((
                    SELECT GROUP_CONCAT(DISTINCT hp.perm_name SEPARATOR ', ')
                    FROM hospital_emp_perms hep
                    JOIN hospital_perms hp ON hep.perm_id = hp.perm_id
                    WHERE hep.hosp_emp_id = eh.hosp_emp_id
                ), ''), 'None') AS emp_perms,

                -- role
                COALESCE((
                    SELECT hr.role_name
                    FROM hospital_roles hr
                    WHERE hr.hosp_emp_id = eh.hosp_emp_id
                ), 'NormalUser') AS role_name,

                -- availability schedule
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
                            DATE_FORMAT(start_time, '%H:%i') AS formatted_start,
                            DATE_FORMAT(end_time,   '%H:%i') AS formatted_end
                        FROM availability
                        WHERE hosp_emp_id = eh.hosp_emp_id
                    ) AS formatted
                ), 'None') AS availability_schedule

            FROM users u
            LEFT JOIN employees e           ON u.user_id       = e.emp_id
            LEFT JOIN employees_hospital eh  ON e.emp_id        = eh.emp_id

            WHERE u.user_id = ?
        `;

        const result = await executeMySqlQuery(query, [user_id]);
        return result[0];
    }

    /**
     * All users, lighter field set (no perms/roles).
     * Mirrors getAllNursesSpecificData.
     */
    static async getAllUsersSpecificData() {
        const query = `
            SELECT
                -- from users
                u.user_id,
                u.user_email,
                u.user_name,
                u.user_type,

                -- from employees
                e.emp_abscence,
                e.emp_rate,
                e.emp_title,
                e.emp_specialty,

                -- from employees_hospital
                eh.hosp_emp_id,

                -- availability schedule
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
                            DATE_FORMAT(start_time, '%H:%i') AS formatted_start,
                            DATE_FORMAT(end_time,   '%H:%i') AS formatted_end
                        FROM availability
                        WHERE hosp_emp_id = eh.hosp_emp_id
                    ) AS formatted
                ), 'None') AS availability_schedule

            FROM users u
            LEFT JOIN employees e           ON u.user_id = e.emp_id
            LEFT JOIN employees_hospital eh  ON e.emp_id  = eh.emp_id
        `;

        const result = await executeMySqlQuery(query);
        return result;
    }

    // ============================
    //              UPDATE
    // ============================

    /**
     * Update a general user (users + employees tables only).
     * Mirrors updateNurseFullCore but drops the nurses UPSERT block entirely,
     * since a general user has no type-specific table.
     */
    static async updateUserFullCore(user_id, updatingObj) {
        const parsedUpdates = parseUpdatingStringByTable(updatingObj);
        const parsedObjects = parsedUpdatesToObjects(parsedUpdates);

        const queries = [];
        const params  = [];

        // 1. Update users table
        if (parsedUpdates.users) {
            queries.push(`
                UPDATE users
                SET ${parsedUpdates.users.sql}
                WHERE user_id = ?
            `);
            params.push([...parsedUpdates.users.values, user_id]);
        }

        // 2. UPSERT employees table
        if (parsedUpdates.employees) {
            const { columns_field } = stringifyFields(
                "seperate",
                Object.entries(parsedObjects.employees) || {}
            );

            const placeholders = generatePlaceholders(columns_field.split(",").length);

            queries.push(`
                INSERT INTO employees (emp_id, ${columns_field})
                VALUES (?, ${placeholders})
                ON DUPLICATE KEY UPDATE
                    ${parsedUpdates.employees.sql}
            `);
            // order: emp_id (INSERT), insert values, update values
            params.push([user_id, ...parsedUpdates.employees.values, ...parsedUpdates.employees.values]);
        }

        // 3. Version bump
        queries.push(`
            UPDATE table_version
            SET current_version = current_version + 1
            WHERE table_name = 'ems_employees'
        `);
            console.log("update_queries",queries)
        const result = await sqlTransaction(queries, params);

        if (parsedUpdates.users && !result) {
            throw new Error("User not found. Please register the user first.");
        }

        return result;
    }
}

module.exports = generalUserMethods;