const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.static('public'));

const http = require('http').createServer(app);
const io = require('socket.io')(http);

// ================== MongoDB Atlas connection ==================
const MONGODB_URL = process.env.MONGODB_URI || "mongodb://localhost:27017/sample";

mongoose.connect(MONGODB_URL)
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// ================== Schemas ==================
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

// ================== Models ==================
const Message = mongoose.model("Message", MessageSchema);
const User = mongoose.model("User", UserSchema);

// ================== Routes ==================
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// ================== Socket.io ==================
io.on('connection', (socket) => {
    console.log("🔗 A new client connected");

    // Load old messages when user joins
    Message.find({})
        .then((messages) => {
            socket.emit("load messages", messages);
        })
        .catch(err => console.log(err));

    // Load users list when user joins
    User.find({})
        .then((users) => {
            socket.emit("load users", users);
        })
        .catch(err => console.log(err));

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

            // Emit to all clients after saving
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

// ================== Start Server ==================
http.listen(5000, () => {
    console.log("🚀 App is running on http://localhost:5000");
});
