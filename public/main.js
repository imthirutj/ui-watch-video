const socket = io();

const player = document.getElementById('player');
const videoUrlInput = document.getElementById('videoUrlInput');
const loadBtn = document.getElementById('loadBtn');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messageList = document.getElementById('messageList');

let isPlaying = false;
let seekInProgress = false;
let pendingSeekTime = null;

player.addEventListener('play', () => {
  if (!isPlaying) {
    isPlaying = true;
    socket.emit('play');
  }
});

player.addEventListener('pause', () => {
  if (isPlaying) {
    isPlaying = false;
    socket.emit('pause');
  }
});

player.addEventListener('timeupdate', () => {
  if (seekInProgress) return;

  const currentTime = player.currentTime;
  socket.emit('seek', currentTime);
});

sendBtn.addEventListener('click', () => {
  const message = messageInput.value;
  socket.emit('message', { message, senderId: socket.id });
  messageInput.value = '';
});

loadBtn.addEventListener('click', () => {
  const videoUrl = videoUrlInput.value;
  const senderId = prompt('Enter your unique sender ID:');
  socket.emit('loadVideo', videoUrl, senderId);
  loadVideo(videoUrl);
});

function loadVideo(videoUrl) {
  if (videoUrl.endsWith('.m3u8')) {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(player);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        player.play();
        // Add quality levels
        const levels = hls.levels;
        if (levels && levels.length > 1) {
          addQualityLevels(levels);
        }
      });
    } else {
      console.error('HLS is not supported');
    }
  } else if (videoUrl.endsWith('.mkv')) {
    console.error('MKV format is not supported in browsers. Please convert the video to a compatible format like MP4 or WebM.');
  } else {
    player.src = videoUrl;
    player.addEventListener('loadedmetadata', () => {
      player.play();
    });
  }
}

function addQualityLevels(levels) {
  const existingQualitySelect = document.getElementById('qualitySelect');
  if (existingQualitySelect) {
    existingQualitySelect.remove();
  }

  const qualitySelect = document.createElement('select');
  qualitySelect.id = 'qualitySelect';

  for (let i = 0; i < levels.length; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.text = `${levels[i].height}p`;
    qualitySelect.appendChild(option);
  }

  qualitySelect.addEventListener('change', () => {
    const selectedLevel = parseInt(qualitySelect.value);
    const hls = player.hls;
    if (hls) {
      hls.currentLevel = selectedLevel;
    }
  });

  const container = document.getElementById('container');
  container.appendChild(qualitySelect);
}

socket.on('initialState', (initialState) => {
  isPlaying = initialState.isPlaying;

  if (isPlaying) {
    player.play();
  } else {
    player.pause();
  }

  player.currentTime = initialState.currentTime;
});

socket.on('play', () => {
  if (!isPlaying) {
    isPlaying = true;
    player.play();
  }
});

socket.on('pause', () => {
  if (isPlaying) {
    isPlaying = false;
    player.pause();
  }
});

socket.on('seek', (time) => {
  if (Math.abs(player.currentTime - time) > 0.5) {
    seekInProgress = true;
    pendingSeekTime = time;
    player.currentTime = time;
  }
});

player.addEventListener('seeked', () => {
  if (seekInProgress) {
    seekInProgress = false;
    if (pendingSeekTime !== null) {
      player.currentTime = pendingSeekTime;
      pendingSeekTime = null;
    }
  }
});


socket.on('message', (msg) => {
    const newMessage = document.createElement('li');
    const messageContent = document.createElement('div');
    const senderIdElement = document.createElement('div');
    
    messageContent.textContent = msg.message;
    senderIdElement.textContent = msg.senderId;
    
    newMessage.classList.add('message-item');
    
    if (msg.senderId === socket.id) {
      newMessage.classList.add('message-item-right');
    } else {
      newMessage.classList.add('message-item-left');
    }
    
    newMessage.appendChild(senderIdElement);
    newMessage.appendChild(messageContent);
    messageList.appendChild(newMessage);
  });
  

socket.on('loadVideo', (videoUrl) => {
  loadVideo(videoUrl);
});
