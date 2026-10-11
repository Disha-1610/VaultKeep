require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

for (const name of ["ENCRYPTION_KEY", "JWT_SECRET", "MONGO_URI"]) {
  if (!process.env[name]) {
    console.error(`Missing ${name} in server/.env (see .env.example)`);
    process.exit(1);
  }
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/passwords", require("./routes/passwords"));

app.use((req, res) => res.status(404).json({ message: "Route not found." }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Server error." });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`VaultKeeper API on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error("Failed to start:", err.message);
    process.exit(1);
  });
