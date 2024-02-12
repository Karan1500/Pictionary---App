const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const startGame = document.getElementById('startGame');
const randWord = document.getElementById('wordToGuess');

let { username, room, start } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

var colorDiv = -1;

const socket = io();

const userArray = [];

if (!room) {
    room = generateRandomRoom();
    window.location.href = `${window.location.origin}/chat.html?username=${username}&room=${room}`;
    start = true;
}

startGame.addEventListener('click', funcStart);

function funcStart() {
    socket.emit('startTheGame', 1);
}

socket.emit('joinRoom', { username, room });

socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
    userArray = users;
});

socket.on('message', (message) => {
    console.log(message);
    outputMessage(message);

    chatMessages.scrollTop = chatMessages.scrollHeight;
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const msg = e.target.elements.msg.value;

    socket.emit('chatMessage', msg);

    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});


socket.on('displayWord', (word) => {
    randWord.innerText = word;
});

socket.on('displayWordLength', (letters) => {
    randWord.innerText = `Number of letters: ${letters}`;
});

socket.on('msgStatus', (p) => {
    colorDiv = p;
});

function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username}<span>${message.time}</span></p>
    <p class="text">
        ${message.textMessage}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
    if (colorDiv === 1) {
        div.style.backgroundColor = 'rgb(0, 255, 0)';
    } else if (colorDiv === 0) {
        div.style.backgroundColor = 'rgb(251, 143, 143)';
    } else if (colorDiv === 2) {
        div.style.backgroundColor = 'yellow';
    } else if (colorDiv === 3) {
        div.style.backgroundColor = 'rgb(0, 255, 251)';
    } else if (colorDiv === 4) {
        div.style.backgroundColor = '#fff';
    }
}

function outputRoomName(room) {
    roomName.innerText = room;
}

function outputUsers(users) {
    console.log('Outputting users:', users);

    userList.innerHTML = `
    ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
}

function generateRandomRoom() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

socket.on('mouseDownData', data => {
    const canvas = document.getElementById("drawingCanvas");
    const context = canvas.getContext("2d");
    context.moveTo(data.x, data.y);
});

socket.on('clearCanvasData', data => {
    const canvas = document.getElementById("drawingCanvas");
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on('getData', data => {
    const canvas = document.getElementById("drawingCanvas");
    const context = canvas.getContext("2d");
    const colorSelector = document.getElementById("colorSelector");
    const sizeSelector = document.getElementById("sizeSelector");
    const clearCanvasBtn = document.getElementById("clearCanvasBtn");

    const rect = canvas.getBoundingClientRect();
    const x = data.x - rect.left;
    const y = data.y - rect.top;

    context.lineWidth = data.p;
    context.lineCap = "round";
    context.strokeStyle = data.q;

    context.lineTo(data.x, data.y);
    context.stroke();
    context.beginPath();
    context.moveTo(data.x, data.y);
});

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("drawingCanvas");
    const context = canvas.getContext("2d");
    const colorSelector = document.getElementById("colorSelector");
    const sizeSelector = document.getElementById("sizeSelector");
    const clearCanvasBtn = document.getElementById("clearCanvasBtn");

    let isDrawing = false;

    canvas.addEventListener("mousedown", startDrawing);
    document.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mousemove", draw);

    clearCanvasBtn.addEventListener("click", clearCanvas);

    socket.on('yourTurn', () => {
        isMyTurn = true;
        console.log("It's your turn to draw!");
    });

    socket.on('nextTurn', () => {
        isMyTurn = false;
        console.log("Next person's turn to draw.");
    });

    function startDrawing(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (isMyTurn) {
            isDrawing = true;
            context.beginPath();
            context.moveTo(x, y);
            socket.emit('mouseDown', { x, y });
            draw(e);
        } else {
            console.log("It's not your turn to draw.");
        }
    }

    function stopDrawing() {
        isDrawing = false;
        context.beginPath();
    }

    function draw(e) {
        if (!isDrawing)
            return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        context.lineWidth = sizeSelector.value;
        context.lineCap = "round";
        context.strokeStyle = colorSelector.value;

        // context.lineTo(x, y);
        // context.stroke();
        // context.beginPath();
        // context.moveTo(x, y);

        const p = context.lineWidth;
        const q = context.strokeStyle;
        socket.emit("draw", { x, y, p, q });
    }

    function clearCanvas() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        socket.emit('clearCanvas', null);
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const menuBtn = document.querySelector('.menu-btn');
    const chatSidebar = document.querySelector('.chat-sidebar');

    menuBtn.addEventListener('click', function () {
        document.querySelector('.chat-main').classList.toggle('show-sidebar');
    });
});

function adjustCanvasSize() {
    const canvas = document.getElementById("drawingCanvas");
    const canvasContainer = document.querySelector(".canvas-container");
    canvas.width = canvasContainer.offsetWidth;
    canvas.height = canvasContainer.offsetHeight;
}

window.addEventListener("resize", adjustCanvasSize);

adjustCanvasSize();
