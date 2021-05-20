const express = require('express');
const https = require('https');
const path = require('path');
const socketio = require('socket.io');
const fs = require('fs');

const app = express();


const server = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'public', 'cert', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'public', 'cert', 'speedchess_org.pem'))
}, app);

const io = socketio(server);

const playerColor = ['white', 'black'];
var playerEntered = 0;

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));



// Run when client connects
io.on('connection', (socket) => {

    // Run when clients connects
    socket.emit('chooseColor', playerColor[io.engine.clientsCount - 1]);
    
    socket.emit('clientCount', io.engine.clientsCount);

    socket.emit('initialize', game.fen());
    
    socket.on('clientMove', (moveMessage) => {
        if (makeMove(moveMessage.source, moveMessage.target) != null) {
            socket.broadcast.emit('serverMove', moveMessage);
        }
        
    })

    socket.broadcast.emit('met', 'new person entered');
    socket.on('serverCount', number => { 
        console.log('Client count ' + number)
        playerEntered++;
    })

    socket.on('disconnect', () => {
        playerEntered--;
        console.log(playerEntered)
        if (playerEntered == 0) {
            game.reset();
        }
    })
})

const PORT = 443 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))


// chess-----------------------------------------------------------------------------------
const {Chess} = require('chess.js'); 
var game = new Chess()

function makeMove(source, target) {

    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })

    if (move === null) return null
    return game.fen();
}
