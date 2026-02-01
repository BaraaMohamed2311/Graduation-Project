const jwt = require("jsonwebtoken");

function extractUserFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1]; // "Bearer <token>"
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.SECRET_KEY);
  } catch (err) {
    return null; 
  }
}

module.exports = extractUserFromToken;