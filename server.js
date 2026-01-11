
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

/* ===================== BASIC SECURITY ===================== */
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: "10kb" }));
app.use(helmet());

/* ===================== RATE LIMIT ===================== */
app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

/* ===================== CONFIG ===================== */
const PORT = 7000;
const JWT_SECRET = "mujahid";
const MONGODB_URI = "mongodb://localhost:27017/GestureLink";

/* ===================== DB ===================== */
mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Error", err);
    process.exit(1);
  });

/* ===================== USER MODEL ===================== */
const User = mongoose.model("User", new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  is_deaf: Boolean,
  userType: String
}, { timestamps: true }));

/* ===================== AUTH MIDDLEWARE ===================== */
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    req.userId = jwt.verify(token, JWT_SECRET).id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

/* ===================== LOGIN ===================== */
app.post("/api/auth/login", async (req, res) => {
  const { identifier, password } = req.body;

  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }]
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: "24h"
  });

  res.json({
    access_token: token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      is_deaf: user.is_deaf,
      userType: user.userType
    }
  });
});

/* ===================== CURRENT USER ===================== */
app.get("/api/auth/me", protect, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json({ user });
});

/* ===================== START ===================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
