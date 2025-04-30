// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// In‑memory store for users (DO NOT use in production)
const users = {}; // Format: { username: password }

// Registration endpoint
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }
  if (users[username]) {
    return res.status(400).json({ message: "Username already exists." });
  }
  users[username] = password; // In a real app, hash the password!
  res.status(200).json({ message: "Registration successful." });
});

// Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username] === password) {
    return res.status(200).json({ message: "Login successful." });
  } else {
    return res.status(400).json({ message: "Invalid credentials." });
  }
});

// Socket.io events for the whiteboard
io.on("connection", (socket) => {
  console.log("User connected: " + socket.id);

  // When a drawing event is received, broadcast it to other clients
  socket.on("draw", (data) => {
    socket.broadcast.emit("draw", data);
  });

  // When a clear event is received, broadcast to everyone
  socket.on("clear", () => {
    io.emit("clear");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
