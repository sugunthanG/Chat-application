const express = require('express')
const session = require('express-session');
const mongoose = require('mongoose')
const app = express()
app.use(express.static('public'))
const http = require('http').createServer(app)
const io = require('socket.io')(http)


//mongodb connections
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/sample"
mongoose.connect(MONGODB_URL,{
    useNewUrlParser:true,
    useUnifiedTopology:true
})
.then(() => console.log("mongodb connected"))
.catch((err) => console.log(err))

//schema
const MessageSchema = new mongoose.Schema({
    author:String,
    Content:String,
    image:String
})

const UserSchema = new mongoose.Schema({
    username: String,
    password: String
    
})

const Message = mongoose.model('Message',MessageSchema)

const User = mongoose.model('User', UserSchema)


app.get('/',(req,res) => {
    res.sendFile(__dirname+"/index.html")
})

//socket connection
io.on('connection',(socket) =>{
    console.log("A new client connected")

    Message.find({})
    .then((messages) => {
        socket.emit("load messages",messages)
    })

    User.find({})
    .then((users) => {
        socket.emit("load users",users)
    })

    socket.on('username',(username) => {
        console.log("the logged in username is " + username)
        socket.username = username
        io.emit("user joined",username)
    })
    

    socket.on('chat message',(msg) => {
        const message = new Message({
            author:msg.author,
            content:msg.content,
            image:msg.image
        })
        message
        .save()
        .then(()=>{
            io.emit("chat message",msg)
        })
        .catch((err) => console.log(err))
    })

    socket.on('disconnect',() => {     
            io.emit("user left", socket.username);
    })
})


//PORT
http.listen(5000,() =>{
    console.log("App is listening on port 5000")
})


