const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set in .env");
  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (err) {
    if (uri.includes("127.0.0.1") || uri.includes("localhost")) {
      try {
        const { execSync } = require("child_process");

        // BUG-14 FIX: don't hardcode "Ubuntu" — discover all running WSL
        // distros and try each one until we get a usable IP address.
        const distroList = execSync("wsl.exe --list --running --quiet", {
          encoding: "utf16le", // wsl.exe outputs UTF-16 LE on Windows
        })
          .split(/\r?\n/)
          .map((d) => d.trim())
          .filter(Boolean);

        let wslIp = null;
        for (const distro of distroList) {
          try {
            const ip = execSync(`wsl.exe -d ${distro} -- hostname -I`, { encoding: "utf8" })
              .trim()
              .split(/\s+/)[0];
            if (ip) { wslIp = ip; break; }
          } catch {
            // this distro didn't respond — try next
          }
        }

        if (wslIp) {
          const fallbackUri = uri.replace("127.0.0.1", wslIp).replace("localhost", wslIp);
          console.log(`Retrying MongoDB connection via WSL IP (${fallbackUri})...`);
          await mongoose.connect(fallbackUri);
          console.log(`MongoDB connected via WSL: ${mongoose.connection.name}`);
          return;
        }
      } catch (fallbackErr) {
        console.warn("WSL fallback also failed:", fallbackErr.message);
      }
    }
    throw err;
  }
}

module.exports = connectDB
