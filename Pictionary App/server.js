const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Pen&Play Bot ';

io.on('connection', socket => {

    let usersInTurnOrder = [];
    let currentTurnIndex = 0;
    let isGameInProgress = false;

    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        socket.emit('message', formatMessage(botName, 'Welcome to Pen&Play'));

        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${username} has joined the chat`));

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

        usersInTurnOrder = getRoomUsers(user.room);
        console.log(usersInTurnOrder.length);
        socket.on('startTheGame', (e) =>{
            if(e==1)
            {
                // console.log(e);
                startGameLoop(user.room);
            }   
        });
        
    });

    console.log(usersInTurnOrder.length);

    function startGameLoop(room) {
        isGameInProgress = true;

        const gameLoop = setInterval(() => {
            nextTurn(room);

            if (allUsersFinishedDrawing(room)) {
                clearInterval(gameLoop);
                isGameInProgress = false;
            }
        }, 8000); // 20 seconds timeout for each turn

        // Start the first turn immediately
        console.log(usersInTurnOrder.length);
        console.log(currentTurnIndex);
        io.to(usersInTurnOrder[currentTurnIndex].id).emit('yourTurn');
    }

    function nextTurn(room) {
        if (usersInTurnOrder.length > 0) {
            currentTurnIndex = (currentTurnIndex + 1) % usersInTurnOrder.length;
            io.to(room).emit('nextTurn');
            setTimeout(() => {
                io.to(usersInTurnOrder[currentTurnIndex].id).emit('yourTurn');
            }, 1000); // Delay for 1 second to allow the client to handle the 'nextTurn' event
        }
    }

    function allUsersFinishedDrawing(room) {
        // Check your conditions for determining if all users have finished drawing
        // For example, check if each user has set a 'finishedDrawing' flag
        // Return true when all users have finished, and the game loop will stop
        // For simplicity, let's assume all users have finished drawing after a certain number of turns
        return currentTurnIndex >= usersInTurnOrder.length;
    }

    socket.on('draw', data => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('getData', { x: data.x, y: data.y, p: data.p, q: data.q });
    });

    socket.on('mouseDown', data => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('mouseDownData', { x: data.x, y: data.y });
    });

    socket.on('clearCanvas', data => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('clearCanvasData', data);
    });

    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(`${user.username} `, msg));
    });

    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }

        if (usersInTurnOrder[currentTurnIndex] && usersInTurnOrder[currentTurnIndex].id === socket.id) {
            nextTurn(user.room);
        }
    });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server listens on the port ${PORT}`));