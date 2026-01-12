// require("dotenv").config();
// const express = require("express");
// const app = express();
// app.set("trust proxy", 1);

// const cors = require("cors");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const mongoose = require("mongoose");
// const helmet = require("helmet");
// const rateLimit = require("express-rate-limit");

// /* ===================== CONFIG ===================== */
// // const PORT = process.env.PORT || 7000;
// const PORT =  7000;

// const JWT_SECRET = process.env.JWT_SECRET;
// // const MONGODB_URI = process.env.MONGODB_URI;
// const MONGODB_URI = "mongodb://localhost:27017/GestureLink" 
// const CLIENT_URL = process.env.CLIENT_URL;

// /* ===================== SECURITY ===================== */
// app.use(helmet());

// app.use(
//   cors({
//     origin: CLIENT_URL,
//     credentials: true,
//   })
// );

// app.use(express.json({ limit: "10kb" }));

// app.use(
//   "/api/",
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//     standardHeaders: true,
//     legacyHeaders: false,
//   })
// );

// /* ===================== DATABASE ===================== */
// mongoose
//   .connect(MONGODB_URI)
//   .then(() => {
//     console.log("✅ MongoDB Connected");
//     console.log("📦 Database:", mongoose.connection.name);
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB Error", err);
//     process.exit(1);
//   });

// /* ===================== USER MODEL ===================== */
// const userSchema = new mongoose.Schema(
//   {
//     username: { type: String, unique: true, required: true },
//     email: { type: String, unique: true, required: true },
//     password: { type: String, required: true, select: false },
//     is_deaf: { type: Boolean, default: true },
//     userType: { type: String, default: "deaf" },
//   },
//   { timestamps: true }
// );

// /* 🔐 PASSWORD HASH (ONLY HERE) */
// userSchema.pre("save", async function () {
//   if (!this.isModified("password")) return ;
//   this.password = await bcrypt.hash(this.password, 10);
// });

// const User = mongoose.model("User", userSchema);

// /* ===================== AUTH MIDDLEWARE ===================== */
// const protect = (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ error: "Unauthorized" });
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     req.userId = decoded.id;
//     next();
//   } catch (err) {
//     return res.status(401).json({ error: "Invalid token" });
//   }
// };

// /* ===================== ROUTES ===================== */
// app.get("/", (req, res) => {
//   res.json({ status: "GestureLink API Running 🚀" });
// });

// /* ===================== SIGNUP ===================== */
// app.post("/api/auth/signup", async (req, res) => {
//   try {
//     const { username, email, password, userType, is_deaf } = req.body;

//     if (!username || !email || !password) {
//       return res.status(400).json({ error: "All fields required" });
//     }

//     const exists = await User.findOne({
//       $or: [{ email }, { username }],
//     });

//     if (exists) {
//       return res.status(409).json({ error: "User already exists" });
//     }

//     const user = await User.create({
//       username,
//       email,
//       password, // ✅ plain password (auto-hash by pre-save)
//       userType: userType || "deaf",
//       is_deaf: is_deaf ?? true,
//     });

//     const token = jwt.sign({ id: user._id }, JWT_SECRET, {
//       expiresIn: "24h",
//     });

//     res.status(201).json({
//       success: true,
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         userType: user.userType,
//         is_deaf: user.is_deaf,
//       },
//     });
//   } catch (err) {
//     console.error("❌ Signup error:", err);
//     res.status(500).json({ error: "Signup failed" });
//   }
// });

// /* ===================== LOGIN ===================== */
// app.post("/api/auth/login", async (req, res) => {
//   try {
//     const { identifier, password } = req.body;

//     if (!identifier || !password) {
//       return res.status(400).json({ error: "All fields required" });
//     }

//     const user = await User.findOne({
//       $or: [{ email: identifier }, { username: identifier }],
//     }).select("+password");

//     if (!user) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     const token = jwt.sign({ id: user._id }, JWT_SECRET, {
//       expiresIn: "24h",
//     });

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         userType: user.userType,
//         is_deaf: user.is_deaf,
//       },
//     });
//   } catch (err) {
//     console.error("❌ Login error:", err);
//     res.status(500).json({ error: "Login failed" });
//   }
// });

// /* ===================== CURRENT USER ===================== */
// app.get("/api/auth/me", protect, async (req, res) => {
//   const user = await User.findById(req.userId).select("-password");
//   res.json({ user });
// });

// /* ===================== START ===================== */
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });



// TRY For Message chat section add 


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

const http = require("http");
const { Server } = require("socket.io");

/* ===================== CONFIG ===================== */
const PORT = process.env.PORT || 7000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/GestureLink";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

/* ===================== SECURITY ===================== */
app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10kb" }));

app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
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
    is_online: { type: Boolean, default: false },
    socket_id: { type: String },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

const User = mongoose.model("User", userSchema);

/* ===================== CONVERSATION MODEL ===================== */
const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    last_message: {
      content: String,
      message_type: String,
    },
    last_message_at: Date,
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

/* ===================== MESSAGE MODEL ===================== */
const messageSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message_type: {
      type: String,
      enum: ["text", "sign", "audio"],
      default: "text",
    },
    content: String,
    original_text: String,
    translated_text: String,
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent"
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

/* ===================== AUTH MIDDLEWARE ===================== */
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

/* ===================== ROUTES ===================== */
app.get("/", (req, res) => {
  res.json({ status: "GestureLink API Running 🚀" });
});

/* ===================== AUTH ===================== */
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password, is_deaf } = req.body;

    const exists = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (exists) return res.status(409).json({ error: "User exists" });

    const user = await User.create({
      username,
      email,
      password,
      is_deaf,
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });

    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select("+password");

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", protect, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json({ user });
});

/* ===================== USERS (FOR CHAT LIST) ===================== */
app.get("/api/users", protect, async (req, res) => {
  const users = await User.find({ _id: { $ne: req.userId } }).select("-password");
  res.json(users);
});

/* ===================== CONVERSATIONS ===================== */
app.get("/api/conversations", protect, async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.userId,
  })
    .populate("participants", "username is_deaf is_online")
    .sort({ updatedAt: -1 });

  const formatted = conversations.map((c) => {
    const other = c.participants.find(
      (p) => p._id.toString() !== req.userId
    );

    return {
      id: c._id,
      other_user: other,
      last_message: c.last_message,
      last_message_at: c.last_message_at,
      unread_count: 0,
    };
  });

  res.json(formatted);
});

/* ===================== START NEW CHAT ===================== */
app.post("/api/conversations", protect, async (req, res) => {
  const { participant_ids } = req.body;
  const otherUserId = participant_ids[0];

  let convo = await Conversation.findOne({
    participants: { $all: [req.userId, otherUserId] },
  });

  if (!convo) {
    convo = await Conversation.create({
      participants: [req.userId, otherUserId],
    });
  }

  await convo.populate("participants", "username is_deaf is_online");

  res.json(convo);
});

/* ===================== MESSAGES ===================== */
app.get("/api/messages/:conversationId", protect, async (req, res) => {
  const messages = await Message.find({
    conversation_id: req.params.conversationId,
  }).sort({ createdAt: 1 });

  res.json(
    messages.map((m) => ({
      id: m._id,
      sender_id: m.sender_id,
      content: m.content,
      message_type: m.message_type,
      translated_text: m.translated_text,
      status: m.status,
      created_at: m.createdAt,
    }))
  );
});

app.post("/api/messages", protect, async (req, res) => {
  const { conversation_id, content, message_type, original_text, translated_text, tempId } = req.body;

  const msg = await Message.create({
    conversation_id,
    sender_id: req.userId,
    message_type: message_type || "text",
    content,
    original_text,
    translated_text,
    status: "sent"
  });

  const responseData = {
    id: msg._id,
    sender_id: msg.sender_id,
    content: msg.content,
    message_type: msg.message_type,
    translated_text: msg.translated_text,
    status: msg.status,
    created_at: msg.createdAt,
    conversation_id: msg.conversation_id,
    tempId: tempId
  };

  // Find participants to relay message
  const conversation = await Conversation.findById(conversation_id);
  if (conversation) {
    conversation.participants.forEach(participantId => {
      // Don't send back to the sender
      if (participantId.toString() !== req.userId) {
        io.to(participantId.toString()).emit("new_message", responseData);
      }
    });

    // Update last message in conversation
    conversation.last_message = {
      content: content,
      message_type: message_type || "text"
    };
    conversation.last_message_at = new Date();
    await conversation.save();
  }

  res.status(201).json(responseData);
});

/* ===================== SERVER & SOCKET ===================== */
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

const userSockets = new Map(); // userId -> socketId

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Unauthorized"));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", async (socket) => {
  const userId = socket.userId;
  console.log(`🟢 User connected: ${userId} (Socket: ${socket.id})`);

  userSockets.set(userId, socket.id);
  socket.join(userId.toString()); // Join personal room

  // Update online status in DB
  await User.findByIdAndUpdate(userId, { is_online: true, socket_id: socket.id });

  // Broadcast to others
  socket.broadcast.emit("user_online", userId);

  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`👥 User ${userId} joined room: ${conversationId}`);
  });

  socket.on("leave_conversation", (conversationId) => {
    socket.leave(conversationId);
    console.log(`👥 User ${userId} left room: ${conversationId}`);
  });

  socket.on("send_message", async (data) => {
    const { conversation_id, content, message_type } = data;

    // Save to DB (if not already saved via API)
    // For now, let's assume we use the API to save and socket to relay, 
    // or we can save here. Let's save here for simplicity if the client wishes.
    // However, the client uses both. Let's just relay what's sent.

    socket.to(conversation_id).emit("new_message", {
      ...data,
      sender_id: userId,
      status: "delivered",
      created_at: new Date().toISOString()
    });
  });

  socket.on("typing", (data) => {
    socket.to(data.conversationId).emit("user_typing", {
      conversationId: data.conversationId,
      userId: userId,
      isTyping: data.isTyping
    });
  });

  socket.on("mark_read", async (data) => {
    const { messageId, conversationId } = data;
    if (messageId && mongoose.Types.ObjectId.isValid(messageId)) {
      await Message.findByIdAndUpdate(messageId, { status: "read" });

      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.participants.forEach(participantId => {
          io.to(participantId.toString()).emit("message_status", {
            messageId,
            status: "read",
            conversationId
          });
        });
      }
    }
  });

  socket.on("disconnect", async () => {
    console.log(`🔴 User disconnected: ${userId}`);
    userSockets.delete(userId);
    await User.findByIdAndUpdate(userId, { is_online: false, socket_id: null });
    socket.broadcast.emit("user_offline", userId);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
