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
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;
const CLIENT_URL = process.env.CLIENT_URL;

/* ===================== SECURITY ===================== */
app.use(helmet());

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));

app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/* ===================== DATABASE ===================== */
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    console.log("📦 Database:", mongoose.connection.name);
  })
  .catch((err) => {
    console.error("❌ MongoDB Error", err);
    process.exit(1);
  });

/* ===================== USER MODEL ===================== */
const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true, select: false },
    is_deaf: { type: Boolean, default: true },
    userType: { type: String, default: "deaf" },
  },
  { timestamps: true }
);

/* 🔐 PASSWORD HASH (ONLY HERE) */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model("User", userSchema);

/* ===================== AUTH MIDDLEWARE ===================== */
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

/* ===================== ROUTES ===================== */
app.get("/", (req, res) => {
  res.json({ status: "GestureLink API Running 🚀" });
});

/* ===================== SIGNUP ===================== */
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password, userType, is_deaf } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const exists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (exists) {
      return res.status(409).json({ error: "User already exists" });
    }

    const user = await User.create({
      username,
      email,
      password, // ✅ plain password (auto-hash by pre-save)
      userType: userType || "deaf",
      is_deaf: is_deaf ?? true,
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        userType: user.userType,
        is_deaf: user.is_deaf,
      },
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

/* ===================== LOGIN ===================== */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        userType: user.userType,
        is_deaf: user.is_deaf,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* ===================== CURRENT USER ===================== */
app.get("/api/auth/me", protect, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json({ user });
});

/* ===================== START ===================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
