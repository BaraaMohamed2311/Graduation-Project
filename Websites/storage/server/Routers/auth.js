const router = require("express").Router();
const bcrypt = require("bcrypt");
const createJWTToken = require("../Utils/createJWTToken.js");
const executeMySqlQuery = require("../Utils/executeMySqlQuery.js");


// =================================
//  Login User (Employees or Patients)
// =================================
    // Login User (Employees)
router.post("/login", async (req, res) => {
  try {
    const { user_email, password } = req.body;

    if (!user_email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    // Query the employee directly using executeSQL
    const query = `
      SELECT u.user_id, u.user_email, u.user_password, e.emp_title
      FROM users u
      JOIN employees e ON u.user_id = e.emp_id
      WHERE u.user_email = ?
        AND u.user_type = 'employee'
        AND e.emp_title = 'Manager'
        AND e.emp_specialty = 'Storage'
      LIMIT 1
    `;
    const result = await executeMySqlQuery(query, [user_email]);

    if (!result || result.length === 0) {
      return res.status(404).json({ success: false, message: "User not found or not authorized" });
    }

    const user = result[0];

    // Verify password
    if (!user || !user.user_password) {
    return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
    });
}
    const match = await bcrypt.compare(password, user.user_password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    // Create JWT token
    const { user_password, ...userInfo } = user;
    const token = await createJWTToken(userInfo.user_id, userInfo.user_email);

    return res.status(200).json({
      success: true,
      body: { ...userInfo, token },
      message: "Successful Login"
    });

  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ success: false, message: err.message || "Login error" });
  }
});


module.exports = router;