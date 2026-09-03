const socket = io();
let peer = null;
let myPeerId = null;
let currentRoomId = null;
let currentUser = null;
let voiceCalls = {};

const loginModal = document.getElementById('login-modal');
const usernameInput = document.getElementById('username-input');
const roomSelect = document.getElementById('room-select');
const joinBtn = document.getElementById('join-btn');
const roomsList = document.getElementById('rooms-list');
const usersList = document.getElementById('users-list');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const currentRoomName = document.getElementById('current-room-name');
const usernameDisplay = document.getElementById('username-display');
const roleBadge = document.getElementById('role-badge');
const voiceToggleBtn = document.getElementById('voice-toggle');
const leaveRoomBtn = document.getElementById('leave-room-btn');
const createRoomBtn = document.getElementById('create-room-btn');

function initPeer() {
  peer = new Peer(undefined, {
    host: location.hostname,
    port: location.port || (location.protocol === 'https:' ? 443 : 80),
    path: '/peerjs'
  });

  peer.on('open', (id) => {
    myPeerId = id;
    console.log('Peer ID:', myPeerId);
  });

  peer.on('call', (call) => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        call.answer(stream);
        call.on('stream', (remoteStream) => {
          playRemoteAudio(remoteStream, call.peer);
        });
      })
      .catch(err => console.error('خطأ في الميكروفون:', err));
  });
}

function playRemoteAudio(stream, peerId) {
  let audio = document.getElementById('audio-' + peerId);
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'audio-' + peerId;
    audio.autoplay = true;
    document.body.appendChild(audio);
  }
  audio.srcObject = stream;
  voiceCalls[peerId] = audio;
}

async function startVoiceCall() {
  if (!peer || !myPeerId) return;
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    socket.emit('room:get-users', currentRoomId);
  } catch (err) {
    console.error('لا يمكن الوصول للميكروفون:', err);
    alert('يرجى السماح بالوصول إلى الميكروفون');
  }
}

socket.on('voice:connect-to-users', (users) => {
  if (!peer) return;
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      users.forEach(user => {
        if (user.id !== socket.id && user.peerId && !voiceCalls[user.id]) {
          const call = peer.call(user.peerId, stream);
          call.on('stream', (remoteStream) => {
            playRemoteAudio(remoteStream, user.id);
          });
          voiceCalls[user.id] = call;
        }
      });
    })
    .catch(err => console.error(err));
});

function renderRooms(rooms) {
  roomsList.innerHTML = '';
  rooms.forEach(room => {
    const li = document.createElement('li');
    li.className = 'room-item' + (room.id === currentRoomId ? ' active' : '');
    li.textContent = `${room.name} (${room.usersCount})`;
    li.onclick = () => switchRoom(room.id);
    roomsList.appendChild(li);
    
    if (!roomSelect.querySelector(`option[value="${room.id}"]`)) {
      const option = document.createElement('option');
      option.value = room.id;
      option.textContent = room.name;
      roomSelect.appendChild(option);
    }
  });
}

function renderUsers(users) {
  usersList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.className = 'user-item';
    li.innerHTML = `
      <span>${user.username}</span>
      <span class="role-badge role-${user.role}">${user.role}</span>
      ${user.peerId ? '🎤' : ''}
    `;
    usersList.appendChild(li);
  });
}

function addMessage(message) {
  const div = document.createElement('div');
  div.className = 'message';
  
  if (message.type === 'system') {
    div.className = 'message system';
    div.textContent = message.text;
  } else {
    if (message.userId === socket.id) {
      div.classList.add('own');
    }
    div.innerHTML = `
      <div class="meta">
        <span>${message.username}</span>
        <span class="role-badge role-${message.role}">${message.role}</span>
        <span>${new Date(message.timestamp).toLocaleTimeString('ar')}</span>
      </div>
      <div>${message.text}</div>
    `;
  }
  
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function joinRoom(roomId, username) {
  currentRoomId = roomId;
  socket.emit('room:join', { roomId, username, peerId: myPeerId });
}

function switchRoom(roomId) {
  if (roomId !== currentRoomId) {
    Object.values(voiceCalls).forEach(call => {
      try { call.close(); } catch(e) {}
    });
    voiceCalls = {};
    document.querySelectorAll('audio').forEach(a => a.remove());
    joinRoom(roomId, currentUser?.username || 'زائر');
  }
}

socket.on('rooms:list', renderRooms);
socket.on('room:users', renderUsers);
socket.on('room:joined', (data) => {
  currentRoomId = data.roomId;
  currentRoomName.textContent = data.roomName;
  currentUser = data.user;
  usernameDisplay.textContent = data.user.username;
  roleBadge.textContent = data.user.role;
  roleBadge.className = 'role-badge role-' + data.user.role;
  messagesDiv.innerHTML = '';
  loginModal.style.display = 'none';
});

socket.on('chat:message', addMessage);
socket.on('room:created', ({ roomId, name }) => {
  joinRoom(roomId, currentUser?.username || 'زائر');
});

joinBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim() || 'زائر';
  const roomId = roomSelect.value;
  joinRoom(roomId, username);
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (text) {
    socket.emit('chat:message', text);
    messageInput.value = '';
  }
}

voiceToggleBtn.addEventListener('click', () => {
  if (voiceToggleBtn.textContent.includes('تفعيل')) {
    startVoiceCall();
    voiceToggleBtn.textContent = '🔇 إيقاف الصوت';
  } else {
    Object.values(voiceCalls).forEach(call => {
      try { call.close(); } catch(e) {}
    });
    voiceCalls = {};
    document.querySelectorAll('audio').forEach(a => a.remove());
    voiceToggleBtn.textContent = '🎤 تفعيل الصوت';
  }
});

leaveRoomBtn.addEventListener('click', () => {
  socket.emit('room:leave');
  loginModal.style.display = 'flex';
  currentRoomId = null;
});

createRoomBtn.addEventListener('click', () => {
  const roomName = prompt('اسم الغرفة الجديدة:');
  if (roomName) {
    socket.emit('room:create', roomName);
  }
});

initPeer();
