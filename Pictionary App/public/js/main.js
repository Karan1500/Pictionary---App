const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const srartGame  = document.getElementById('startGame');

let { username, room, start } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const socket = io();

const userArray = [];

if (!room) {
    room = generateRandomRoom();
    window.location.href = `${window.location.origin}/chat.html?username=${username}&room=${room}`;
    start = true;
}

startGame.addEventListener('click', funcStart);

function funcStart(){
    socket.emit('startTheGame', 1);
}

socket.emit('joinRoom', { username, room });

socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
    userArray = users;
});

socket.on('message', message => {
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

function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username}<span>${message.time}</span></p>
    <p class="text">
        ${message.textMessage}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
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

document.addEventListener("DOMContentLoaded", ()=>{
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

    // Enable or disable drawing functionality based on turn
    socket.on('yourTurn', () => {
        isMyTurn = true;
        console.log("It's your turn to draw!");
        // Enable drawing functionality or update UI as needed
    });

    socket.on('nextTurn', () => {
        isMyTurn = false;
        console.log("Next person's turn to draw.");
        // Disable drawing functionality or update UI as needed
    });

    function startDrawing(e){
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
    //   isDrawing = true;
    //   socket.emit('mouseDown', {x, y});
    //   draw(e);
        if (isMyTurn) {
            isDrawing = true;
            socket.emit('mouseDown', { x, y });
            draw(e);
        } else {
            // It's not your turn, display a message or perform some action
            console.log("It's not your turn to draw.");
        }
    }

    function stopDrawing(){
      isDrawing = false;
      context.beginPath();
    }

    function draw(e){
      if(!isDrawing)
        return;

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
      socket.emit("draw", {x, y, p, q});
    }

    function clearCanvas(){
      context.clearRect(0, 0, canvas.width, canvas.height);
      socket.emit('clearCanvas', null);
    }
});
