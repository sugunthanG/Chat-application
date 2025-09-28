const socket = io("https://chat-with-stranger-twog.onrender.com");

let username;
const form = document.getElementById("chat-form");
const input = form.querySelector('input[type="text"]');
const messages = document.getElementById("messages");

// send text message only
form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!input.value.trim()) {
        alert("Please enter a message");
        return;
    }

    const textData = {
        author: username,
        content: input.value
    };
    socket.emit("chat message", textData);
    input.value = "";
});

// username setup
if (localStorage.getItem("username")) {
    username = localStorage.getItem("username");
    socket.emit("username", username);
} else {
    Swal.fire({
        title: "Enter your username",
        input: "text",
        inputLabel: "Username",
        inputPlaceholder: "Enter your username",
        allowOutsideClick: false,
        inputValidator: (value) => {
            if (!value) {
                return "You need to enter a username!";
            }
        },
        confirmButtonText: "Enter Chat",
        showLoaderOnConfirm: true,
    }).then((result) => {
        username = result.value;
        socket.emit("username", username);
        localStorage.setItem("username", username);
    });
}

function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
}

// user joined status 
socket.on("user joined", (joinedUser) => {
    const item = document.createElement("li");
    item.classList.add("chat-status");

    if (joinedUser === username) {
        item.innerHTML = `<span class='chat-username'>You</span> have joined the chat`;
    } else {
        item.innerHTML = `<span class='chat-username'>Stranger</span> has joined the chat`;
    }

    messages.appendChild(item);
    scrollToBottom();
});

// user left status
socket.on("user left", (leftUser) => {
    const item = document.createElement("li");
    item.classList.add("chat-status");

    if (leftUser === username) {
        item.innerHTML = `<span class='chat-username2'>You</span> have left the chat`;
    } else {
        item.innerHTML = `<span class='chat-username2'>Stranger</span> has left the chat`;
    }

    messages.appendChild(item);
    scrollToBottom();
});

// chat messages (real-time)
socket.on("chat message", (msg) => {
    const item = document.createElement("li");

    if (msg.author === username) {
        item.classList.add("chat-message", "you");
        item.innerHTML = `<div class="message-bubble you"><span class="chat-username">You</span><p>${msg.content}</p></div>`;
    } else {
        item.classList.add("chat-message", "stranger");
        item.innerHTML = `<div class="message-bubble stranger"><span class="chat-username">Stranger</span><p>${msg.content}</p></div>`;
    }

    messages.appendChild(item);
    scrollToBottom();
});

// load old messages when joining
socket.on("load messages", (msgs) => {
    msgs.forEach((msg) => {
        const item = document.createElement("li");

        if (msg.author === username) {
            item.classList.add("chat-message", "you");
            item.innerHTML = `<div class="message-bubble you"><span class="chat-username">You</span><p>${msg.content}</p></div>`;
        } else {
            item.classList.add("chat-message", "stranger");
            item.innerHTML = `<div class="message-bubble stranger"><span class="chat-username">Stranger</span><p>${msg.content}</p></div>`;
        }

        messages.appendChild(item);
    });
    scrollToBottom();
});
