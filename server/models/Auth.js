const mongoose = require("mongoose");

// Stored document shape: { type: "auth", hash, saltRounds }
const authSchema = new mongoose.Schema(
  {
    type: { type: String, default: "auth", unique: true },
    hash: { type: String, required: true },
    saltRounds: { type: Number, required: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Auth", authSchema, "auth");
