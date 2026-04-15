const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const connectDB = require("./config/db.js");

dotenv.config();
connectDB();

const app = express();

const corsOptions = {
  origin: process.env.NODE_ENV === "production" ? true : "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require("./routes/auth.routes.js");
const userRoutes = require("./routes/user.routes.js");
const chatRoutes = require("./routes/chat.routes.js");
const messageRoutes = require("./routes/message.routes.js");
const callRoutes = require("./routes/call.routes.js");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/calls", callRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Deployment logic
const __dirname1 = path.resolve();
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname1, "frontend", "dist", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server started on PORT ${PORT}`);
});

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.NODE_ENV === "production" ? true : "http://localhost:5173",
  },
});

const onlineUsers = new Map();
const pendingSignals = new Map();

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    if (!userData || !userData._id) return;
    
    socket.userId = userData._id;
    socket.join(userData._id);
    
    // Tally connections using socket.id properly 
    if (!onlineUsers.has(userData._id)) {
       onlineUsers.set(userData._id, new Set());
       // If it's a fresh connection for this user, broadcast
       socket.broadcast.emit("user online", userData._id);
    }
    
    onlineUsers.get(userData._id).add(socket.id);
    
    // Tell the client who else is online
    socket.emit("connected", Array.from(onlineUsers.keys()));
    
    // Flush any pending WebRTC signals
    const signals = pendingSignals.get(userData._id);
    if (signals) {
       signals.forEach(s => {
          if (s.type === "call user") socket.emit("call user", s.data);
          if (s.type === "ice candidate") socket.emit("ice candidate", s.data);
          if (s.type === "missed call notification") socket.emit("missed call notification", s.data);
       });
       pendingSignals.delete(userData._id);
    }
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  // WebRTC Signals
  socket.on("call user", (data) => {
    const targetSockets = onlineUsers.get(data.userToCall);
    if (!targetSockets || targetSockets.size === 0) {
       const queues = pendingSignals.get(data.userToCall) || [];
       queues.push({ type: "call user", data: { signal: data.signal, from: data.from, name: data.name, video: data.video } });
       pendingSignals.set(data.userToCall, queues);
    } else {
       targetSockets.forEach(socketId => {
           io.to(socketId).emit("call user", { signal: data.signal, from: data.from, name: data.name, video: data.video });
       });
    }
  });

  socket.on("answer call", (data) => {
    const targetSockets = onlineUsers.get(data.to);
    if (targetSockets) {
        targetSockets.forEach(socketId => {
            io.to(socketId).emit("call accepted", { signal: data.signal, from: data.from });
        });
    }
  });

  socket.on("ice candidate", (data) => {
    const targetSockets = onlineUsers.get(data.to);
    if (!targetSockets || targetSockets.size === 0) {
       const queues = pendingSignals.get(data.to) || [];
       queues.push({ type: "ice candidate", data: { candidate: data.candidate, from: data.from } });
       pendingSignals.set(data.to, queues);
    } else {
       targetSockets.forEach(socketId => {
           io.to(socketId).emit("ice candidate", { candidate: data.candidate, from: data.from });
       });
    }
  });

  socket.on("end call", (to) => {
    const targetSockets = onlineUsers.get(to);
    if (!targetSockets || targetSockets.size === 0) {
       // Target is offline, so delete any pending Call requests so they don't get rung upon next login
       pendingSignals.delete(to);
    } else {
       targetSockets.forEach(socketId => {
           io.to(socketId).emit("call ended");
       });
    }
  });
  
  socket.on("missed call notification", (opts) => {
     const targetSockets = onlineUsers.get(opts.to);
     if (!targetSockets || targetSockets.size === 0) {
        const queues = pendingSignals.get(opts.to) || [];
        queues.push({ type: "missed call notification", data: opts });
        pendingSignals.set(opts.to, queues);
     } else {
        targetSockets.forEach(socketId => {
            io.to(socketId).emit("missed call notification", opts);
        });
     }
  });

  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");
    if (socket.userId) {
       const userSockets = onlineUsers.get(socket.userId);
       if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
             onlineUsers.delete(socket.userId);
             socket.broadcast.emit("user offline", socket.userId);
          }
       }
    }
  });
});
