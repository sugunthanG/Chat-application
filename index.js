// Load environment variables first
require("dotenv").config();

const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.static('public'));

// HTTP + Socket.io setup
const http = require('http').createServer(app);
const io = require("socket.io")(http, {
    cors: {
        origin: "*",  
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// ===== Health check route =====
app.get('/health', (req, res) => res.json({ ok: true }));

// ===== MongoDB Atlas connection =====
const MONGODB_URL = process.env.MONGODB_URI;
console.log("MongoDB URI:", MONGODB_URL);

mongoose.connect(MONGODB_URL)
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// ===== Schemas =====
const MessageSchema = new mongoose.Schema({
    author: String,
    content: String,
    image: String,
    timestamp: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
});

// ===== Models =====
const Message = mongoose.model("Message", MessageSchema);
const User = mongoose.model("User", UserSchema);

// ===== Socket.io logic =====
io.on('connection', (socket) => {
    console.log("🔗 A new client connected");

    // Send old messages on request
    socket.on("load old messages", () => {
        Message.find({}).sort({ timestamp: 1 })
            .then(messages => socket.emit("load messages", messages))
            .catch(err => console.error(err));
    });

    // Load users list
    User.find({})
        .then(users => socket.emit("load users", users))
        .catch(err => console.error(err));

    // When user sets a username
    socket.on('username', (username) => {
        console.log("👤 Logged in username:", username);
        socket.username = username;
        io.emit("user joined", username);
    });

    // When a chat message is sent
    socket.on('chat message', async (msg) => {
        console.log("💬 New message:", msg);

        const message = new Message({
            author: msg.author,
            content: msg.content,
            image: msg.image
        });

        try {
            await message.save();
            console.log('✅ Message saved to MongoDB');
            io.emit('chat message', msg);
        } catch (err) {
            console.error('❌ Error saving message:', err);
        }
    });

    // When a user disconnects
    socket.on('disconnect', () => {
        io.emit("user left", socket.username);
    });
});

// ===== Start server =====
http.listen(PORT, () => {
    console.log(`🚀 App is running on http://localhost:${PORT}`);
});
