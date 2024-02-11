// Get DOM elements
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const startGame = document.getElementById('startGame');
const randWord = document.getElementById('wordToGuess');
const canvas = document.getElementById("drawingCanvas");
const context = canvas.getContext("2d");
const colorSelector = document.getElementById("colorSelector");
const sizeSelector = document.getElementById("sizeSelector");
const clearCanvasBtn = document.getElementById("clearCanvasBtn");
const menuBtn = document.querySelector('.menu-btn');
const chatSidebar = document.querySelector('.chat-sidebar');

// Initialize variables
let { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });
let colorDiv = -1;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Socket connection
const socket = io();

// Event listeners
startGame.addEventListener('click', () => {
    socket.emit('startTheGame', 1);
});

canvas.addEventListener("mousedown", startDrawing);
document.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", throttle(draw, 10));
clearCanvasBtn.addEventListener("click", clearCanvas);
menuBtn.addEventListener('click', () => {
    document.querySelector('.chat-main').classList.toggle('show-sidebar');
});

// Socket events
socket.emit('joinRoom', { username, room });

socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
});

socket.on('message', (message) => {
    outputMessage(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
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

socket.on('mouseDownData', data => {
    context.moveTo(data.x, data.y);
});

socket.on('clearCanvasData', data => {
    context.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on('getData', data => {
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

// Functions
function startDrawing(e) {
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
    isDrawing = true;
    context.beginPath();
    context.moveTo(lastX, lastY);
}

function stopDrawing() {
    isDrawing = false;
    context.beginPath();
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.lineWidth = sizeSelector.value;
    context.lineCap = "round";
    context.strokeStyle = colorSelector.value;

    context.lineTo(x, y);
    context.stroke();
    context.beginPath();
    context.moveTo(x, y);

    const p = context.lineWidth;
    const q = context.strokeStyle;
    socket.emit("draw", { x, y, p, q });

    lastX = x;
    lastY = y;
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clearCanvas', null);
}

function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username}<span>${message.time}</span></p>
    <p class="text">
        ${message.textMessage}
    </p>`;
    chatMessages.appendChild(div);
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
    userList.innerHTML = users.map(user => `<li>${user.username}</li>`).join('');
}

function throttle(callback, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = new Date().getTime();
        if (now - lastCall < delay) return;
        lastCall = now;
        callback(...args);
    };
}
