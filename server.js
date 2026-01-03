const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const pasteRoutes = require("./route/pasteRoutes");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

connectDB();

app.use("/api", pasteRoutes);
app.use("/", pasteRoutes); 


/* ---------- HEALTH CHECK ---------- */
app.get("/api/healthz", async (req, res) => {
  try {
    await connectDB();
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Health check failed:", err.message);
    return res.status(500).json({ ok: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
