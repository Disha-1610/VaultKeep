const mongoose = require("mongoose");

const passwordSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, trim: true },
    // lower-cased source; unique index prevents duplicate entries per source
    sourceKey: { type: String, required: true, unique: true },
    username: { type: String, required: true, trim: true },
    // AES-256 encrypted value (iv:tag:ciphertext) - never plain text
    password: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Password", passwordSchema, "passwords");
