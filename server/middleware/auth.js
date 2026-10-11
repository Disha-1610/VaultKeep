const jwt = require("jsonwebtoken");
const { isValidJti } = require("../utils/session");

// Allows a request only if the vault has been unlocked (valid session token).
// The jti (JWT ID) is checked against the in-memory session store, so a new
// login or server restart immediately invalidates all previously issued tokens.
function requireUnlocked(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Vault is locked.", code: "SESSION_EXPIRED" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!isValidJti(payload.jti)) {
      return res
        .status(401)
        .json({ message: "Session expired. Unlock the vault again.", code: "SESSION_EXPIRED" });
    }
    next();
  } catch {
    return res
      .status(401)
      .json({ message: "Session expired. Unlock the vault again.", code: "SESSION_EXPIRED" });
  }
}

module.exports = requireUnlocked;
