// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

let isVideoPlaying = false;
let videoTime = 0;

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.emit('initialState', { isPlaying: isVideoPlaying, currentTime: videoTime });

  socket.on('play', () => {
    isVideoPlaying = true;
    io.emit('play');
  });

  socket.on('pause', () => {
    isVideoPlaying = false;
    io.emit('pause');
  });

  socket.on('seek', (time) => {
    videoTime = time;
    io.emit('seek', videoTime);
  });

  socket.on('message', (data) => {
    io.emit('message', { message: data.message, senderId: socket.id });
  });
});

http.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
