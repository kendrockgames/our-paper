const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve your HTML, CSS, and JS files
app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('Someone joined the paper! ❤️');

    // When someone draws, broadcast it to the other person
    socket.on('drawing', (data) => {
        socket.broadcast.emit('drawing', data);
    });

    // When someone clears the board, tell the other person
    socket.on('clear', () => {
        socket.broadcast.emit('clear');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Paper is live at http://localhost:${PORT}`);
});