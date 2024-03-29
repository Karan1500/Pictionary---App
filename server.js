const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const randomWordSlugs= require('random-word-slugs');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Pen&Play Bot ';

var usersInTurnOrder = [];
var currentTurnIndex = 0;
var currentRoom=0;
var word = '_________';
var round = 0;

let currentRandomWord = '';
let correctGuesses = {};
let totalScore = {};

io.on('connection', socket => {

    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room);

        for(const member of usersInTurnOrder){
            if(member.username === user.username){
                socket.disconnect(true);
            }
        }

        socket.join(user.room);

        socket.emit('message', formatMessage(botName, 'Welcome to Pen&Play'));

        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${username} has joined the chat`));

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

        usersInTurnOrder = getRoomUsers(user.room);
        currentRoom = user.room;

    });

    socket.on('startTheGame', (e) =>{
        if(e==1)
        {
            currentTurnIndex = 0;
            startGameLoop(currentRoom);
        }   
    });

    function startGameLoop(room) {

        clearCanvasFunc();
        usersInTurnOrder = getRoomUsers(room);
        round = 1;
        currentTurnIndex = 0;
        correctGuesses = {};
        totalScore = {};
        io.to(usersInTurnOrder[currentTurnIndex].id).emit('yourTurn');
        const currentUser = usersInTurnOrder[currentTurnIndex];
        const totalSlugs = randomWordSlugs.generateSlug(1, {
            partsOfSpeech: ["noun"],
            categories: {
              adjective: ["color"],
              noun: ["animals", "food", "sports", "transportation"],
            },
          });
        word = totalSlugs;
        currentRandomWord = word.toLowerCase();
        const letters = word.length;
        io.to(currentUser.id).emit('displayWord', word);
        for (let i = 0; i < usersInTurnOrder.length; i++) {
            if (i !== currentTurnIndex) {
                io.to(usersInTurnOrder[i].id).emit('displayWordLength', letters);
            }
        }

        for (const user of usersInTurnOrder) {
            correctGuesses[user.username] = 0;
        }

        for (const user of usersInTurnOrder) {
            // if(totalScore[user.username] < 500)
                totalScore[user.username] = 0;
        }
        
        const gameLoop = setInterval(() => {

            io.to(usersInTurnOrder[currentTurnIndex].room).emit('msgStatus', 2);
            io.to(usersInTurnOrder[currentTurnIndex].room).emit('message', formatMessage(botName, `The word was ${word}`));

            if(currentTurnIndex === usersInTurnOrder.length - 1){
                var resultMessage = '';
                for(const user of usersInTurnOrder)
                {
                    resultMessage += `${user.username} : ${correctGuesses[user.username]}\n`;
                }
                io.to(usersInTurnOrder[currentTurnIndex].room).emit('msgStatus', 3);
                io.to(usersInTurnOrder[currentTurnIndex].room).emit('message', formatMessage(botName, resultMessage));

            }

            if(round<4)
                nextTurn(room);

            if (round === 4) {
                setTimeout(() => {
                    io.to(usersInTurnOrder[currentTurnIndex].room).emit('msgStatus', 2);
                    io.to(usersInTurnOrder[currentTurnIndex].room).emit('message', formatMessage(botName, `The word was ${word}`));

                    var resultMessage = '';
                    for(const user of usersInTurnOrder)
                    {
                        resultMessage += `${user.username} : ${correctGuesses[user.username]}\n`;
                    }
                    io.to(usersInTurnOrder[currentTurnIndex].room).emit('msgStatus', 3);
                    io.to(usersInTurnOrder[currentTurnIndex].room).emit('message', formatMessage(botName, resultMessage));

                    var winnerMessage = 'Winner(s) : ';
                    var maxi = 1;
                    for(const user of usersInTurnOrder)
                    {
                        if(totalScore[user.username] > maxi)
                            maxi = totalScore[user.username];
                    }
                    for(const user of usersInTurnOrder)
                    {
                        if(totalScore[user.username] === maxi)
                            winnerMessage += `${user.username} `;
                    }
                    io.to(usersInTurnOrder[currentTurnIndex].room).emit('msgStatus', 4);
                    io.to(usersInTurnOrder[currentTurnIndex].room).emit('message', formatMessage(botName, winnerMessage));

                }, 20000);

                clearInterval(gameLoop);    

            }

        }, 20000);
    }

    function nextTurn(room) {
        clearCanvasFunc();
        usersInTurnOrder = getRoomUsers(room);
        if (usersInTurnOrder.length > 0) {
            currentTurnIndex = (currentTurnIndex + 1) % usersInTurnOrder.length;
            if(currentTurnIndex === usersInTurnOrder.length - 1)
                round++;
            io.to(room).emit('nextTurn');
            setTimeout(() => {
                clearCanvasFunc();
                const currentUser = usersInTurnOrder[currentTurnIndex];
                const totalSlugs = randomWordSlugs.generateSlug(1, {
                    partsOfSpeech: ["noun"],
                    categories: {
                      adjective: ["color"],
                      noun: ["animals", "food", "sports", "transportation"],
                    },
                  });
                word = totalSlugs;
                currentRandomWord = word.toLowerCase();
                const letters = word.length;
                io.to(currentUser.id).emit('displayWord', word);
                for (let i = 0; i < usersInTurnOrder.length; i++) {
                    if (i !== currentTurnIndex) {
                        io.to(usersInTurnOrder[i].id).emit('displayWordLength', letters);
                    }
                }
                io.to(usersInTurnOrder[currentTurnIndex].id).emit('yourTurn');
            }, 3000);
        }
    }

    function clearCanvasFunc(){
        const data = 1;
        socket.emit('clearCanvasData', data);
        socket.broadcast.emit('clearCanvasData', data);
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
        const message = msg.trim().toLowerCase();
        if(usersInTurnOrder[currentTurnIndex].username !== user.username)
        {
            var p = 0;
            if(message === currentRandomWord){
                correctGuesses[user.username] += 500;
                totalScore[user.username] += 500;
                p=1;
                msg = `${user.username} guessed it right !!`;
            }

            io.to(user.room).emit('msgStatus', p);
            io.to(user.room).emit('message', formatMessage(`${user.username} `, msg));
        }
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