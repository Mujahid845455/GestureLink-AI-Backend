require("dotenv").config();
const express = require("express");
const app = express();
app.set("trust proxy", 1);
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

/* ===================== CONFIG ===================== */
const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;
//jab frontend deploy kar doge tab  yaha par frontend addreess de dena 
//ya .env file me daal dena
const CLIENT_URL = process.env.CLIENT_URL;

/* ===================== SECURITY ===================== */
app.use(helmet());
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));
app.use(express.json({ limit: "10kb" }));

app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
}));

/* ===================== DATABASE ===================== */
mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Error", err);
    process.exit(1);
  });

/* ===================== USER MODEL ===================== */
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, select: false },
  is_deaf: Boolean,
  userType: String
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});


const User = mongoose.model("User", userSchema);

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

/* ===================== ROUTES ===================== */
app.get("/", (_, res) => {
  res.json({ status: "GestureLink API Running" });
});

/* ---------- LOGIN ---------- */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: "Identifier and password required" });
    }

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }]
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      access_token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        userType: user.userType,
        is_deaf: user.is_deaf
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});


/* ===================== SIGNUP ===================== */
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password, userType, is_deaf } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const exists = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (exists) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      userType: userType || "deaf",
      is_deaf: is_deaf ?? true
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "24h"
    });

    res.status(201).json({
      success: true,
      access_token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        userType: user.userType,
        is_deaf: user.is_deaf
      }
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

/* ---------- CURRENT USER ---------- */
app.get("/api/auth/me", protect, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json({ user });
});

/* ===================== START ===================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
