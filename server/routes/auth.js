const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Auth = require("../models/Auth");
const requireUnlocked = require("../middleware/auth");
const { setJti } = require("../utils/session");

const router = express.Router();
// BUG-09 FIX: Warn explicitly if SALT_ROUNDS is missing or non-numeric
// so the silent fallback to 12 doesn't hide a misconfiguration.
const _saltRaw = parseInt(process.env.SALT_ROUNDS, 10);
if (isNaN(_saltRaw)) {
  console.warn(
    `SALT_ROUNDS env var is "${process.env.SALT_ROUNDS}" (not a number). Defaulting to 12.`
  );
}
const SALT_ROUNDS = isNaN(_saltRaw) ? 12 : _saltRaw;

// Each call mints a new unique session ID (jti) and registers it as the
// ONLY valid session. Any previously issued token is immediately invalidated.
const issueToken = () => {
  const jti = crypto.randomUUID();
  setJti(jti);
  return jwt.sign({ unlocked: true, jti }, process.env.JWT_SECRET, { expiresIn: "30m" });
};

// Does a master password exist yet?
router.get("/status", async (_req, res, next) => {
  try {
    const doc = await Auth.exists({ type: "auth" });
    res.json({ hasMaster: !!doc });
  } catch (err) {
    next(err);
  }
});

// Set master password (only once)
router.post("/setup", async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
    if (await Auth.exists({ type: "auth" })) {
      return res.status(409).json({ message: "Master password already exists." });
    }
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await Auth.create({ type: "auth", hash, saltRounds: SALT_ROUNDS });
    res.status(201).json({ token: issueToken() });
  } catch (err) {
    next(err);
  }
});

// Unlock vault
router.post("/unlock", async (req, res, next) => {
  try {
    const { password } = req.body;
    const doc = await Auth.findOne({ type: "auth" });
    if (!doc) return res.status(404).json({ message: "No master password set." });
    const ok = typeof password === "string" && (await bcrypt.compare(password, doc.hash));
    if (!ok) return res.status(401).json({ message: "Incorrect password. Try again." });
    res.json({ token: issueToken() });
  } catch (err) {
    next(err);
  }
});

// Re-verify master password while unlocked
router.post("/verify", requireUnlocked, async (req, res, next) => {
  try {
    const { password } = req.body;
    const doc = await Auth.findOne({ type: "auth" });
    if (!doc) return res.status(404).json({ message: "No master password set." });
    const ok = typeof password === "string" && (await bcrypt.compare(password, doc.hash));
    if (!ok) return res.status(401).json({ message: "Incorrect password. Try again." });
    res.json({ verified: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
