// Seeds 5 sample entries (encrypted with AES-256). Run: npm run seed
require("dotenv").config();

// BUG-16 FIX: validate required env vars before doing any work.
// Without this, missing keys throw an unhelpful crypto/mongoose stack trace.
const REQUIRED = ["ENCRYPTION_KEY", "MONGO_URI"];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`seed.js: missing required env var(s): ${missing.join(", ")}`);
  console.error("Copy server/.env.example to server/.env and fill in the values.");
  process.exit(1);
}

const mongoose = require("mongoose");
const Password = require("./models/Password");
const { encrypt } = require("./utils/crypto");

const samples = [
  { source: "Gmail", username: "disha@gmail.com", password: "Gm@il#2026!x" },
  { source: "GitHub", username: "disha-dev", password: "G1tHub$ecure99" },
  { source: "LinkedIn", username: "disha@outlook.com", password: "L1nked!n_Pass7" },
  { source: "Netflix", username: "disha.family@gmail.com", password: "Netfl!x#Watch42" },
  { source: "Amazon", username: "disha.shop@gmail.com", password: "Amaz0n&Cart2026" },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  for (const s of samples) {
    await Password.updateOne(
      { sourceKey: s.source.toLowerCase() },
      {
        $set: { source: s.source, username: s.username, password: encrypt(s.password) },
        $setOnInsert: { sourceKey: s.source.toLowerCase() },
      },
      { upsert: true }
    );
  }
  console.log(`Seeded ${samples.length} entries.`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
