const socket = io();

let username;
const form = document.getElementById("chat-form");
const input = form.querySelector('input[type="text"]');
const fileInput = form.querySelector('input[type="file"]');
const messages = document.getElementById("messages");

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const reader = new FileReader();
    const file = fileInput.files[0];

    if (!file && !input.value) {
        alert("Please enter the message");
        return;
    }

    if (file) {
        reader.readAsDataURL(file);
        reader.onload = () => {
            const imageData = {
                author: username,
                content: input.value,
                image: reader.result
            };
            socket.emit("chat message", imageData);
            input.value = "";
            fileInput.value = "";
        };
    } else {
        const textData = {
            author: username,
            content: input.value,
            image: null
        };
        socket.emit("chat message", textData);
        input.value = "";
    }
});

// Add event listener for file input
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
       
        };
    }
});


if (localStorage.getItem('username')) {
    username = localStorage.getItem('username');
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
        preConfirm: (username) => {},
    }).then((result) => {
        console.log(result);
        username = result.value;
        socket.emit("username", username);
        localStorage.setItem("username", username);
    });
}

function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
}

//user joined status 
socket.on('user joined', (username) => {
    const item = document.createElement('li');
    item.classList.add('chat-message');
    item.innerHTML = `<span class='chat-username'>${username}</span> : has joined the chat`;
    messages.appendChild(item);
    scrollToBottom();
});

//user left status
socket.on('user left', (data) => {
    const item = document.createElement('li');
    item.classList.add('chat-message');
    item.innerHTML = `<span class='chat-username2'>${data}</span> : has left the chat`;
    messages.appendChild(item);
    scrollToBottom();
});

socket.on('chat message', (msg) => {
    const item = document.createElement("li");
    item.classList.add("chat-message");
    item.innerHTML = `<span class="chat-username">${msg.author}</span> : ${msg.content}`;

    if (msg.image) {
        const img = document.createElement("img");
        img.src = msg.image;
        img.classList.add("image");
        item.appendChild(img);
    }

    messages.appendChild(item);
    scrollToBottom();
});
