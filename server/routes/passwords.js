const express = require("express");
const Password = require("../models/Password");
const requireUnlocked = require("../middleware/auth");
const { encrypt, decrypt } = require("../utils/crypto");

const router = express.Router();
router.use(requireUnlocked);

// BUG-07 FIX: Use a Mongoose projection to guarantee sensitive fields are
// NEVER fetched from the DB at all on list/update responses — not just stripped
// after the fact. Even if toPublic were accidentally omitted, password and
// sourceKey would never leave the database layer.
const PUBLIC_FIELDS = { password: 0, sourceKey: 0, __v: 0 };

const toPublic = (p) => ({
  _id: p._id,
  source: p.source,
  username: p.username,
  updatedAt: p.updatedAt,
});

// List entries (encrypted password is NEVER sent here)
router.get("/", async (_req, res, next) => {
  try {
    const items = await Password.find({}, PUBLIC_FIELDS).sort({ source: 1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// Decrypt one password - only called when user clicks Show / Copy
router.get("/:id/reveal", async (req, res, next) => {
  try {
    const item = await Password.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Entry not found." });
    res.json({ password: decrypt(item.password) });
  } catch (err) {
    next(err);
  }
});

// Add, or update-by-source if the source already exists
router.post("/", async (req, res, next) => {
  try {
    const { source, username, password } = req.body;
    if (![source, username, password].every((v) => typeof v === "string" && v.trim())) {
      return res.status(400).json({ message: "Source, username and password are required." });
    }
    const sourceKey = source.trim().toLowerCase();
    const encrypted = encrypt(password);

    const existing = await Password.findOne({ sourceKey });
    if (existing) {
      existing.username = username.trim();
      existing.password = encrypted;
      await existing.save();
      return res.json({ updated: true, entry: toPublic(existing) });
    }
    const created = await Password.create({
      source: source.trim(),
      sourceKey,
      username: username.trim(),
      password: encrypted,
    });
    res.status(201).json({ updated: false, entry: toPublic(created) });
  } catch (err) {
    next(err);
  }
});

// BUG-06 FIX: Full edit-by-ID route — allows renaming source, changing
// username and/or password without creating a duplicate entry.
router.put("/:id", async (req, res, next) => {
  try {
    const { source, username, password } = req.body;
    if (![source, username, password].every((v) => typeof v === "string" && v.trim())) {
      return res.status(400).json({ message: "Source, username and password are required." });
    }

    const item = await Password.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Entry not found." });

    const newSourceKey = source.trim().toLowerCase();

    // Prevent a rename colliding with a different existing entry
    if (newSourceKey !== item.sourceKey) {
      const collision = await Password.findOne({ sourceKey: newSourceKey });
      if (collision) {
        return res.status(409).json({
          message: `An entry for "${source.trim()}" already exists. Delete it first.`,
        });
      }
    }

    item.source = source.trim();
    item.sourceKey = newSourceKey;
    item.username = username.trim();
    item.password = encrypt(password);
    await item.save();

    res.json({ entry: toPublic(item) });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Password.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Entry not found." });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
