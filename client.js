const socket = io();

let currentUser = '';
let currentRoom = '';

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const roomInput = document.getElementById('room-input');
const roomName = document.getElementById('room-name');
const messagesDiv = document.getElementById('messages');
const usersList = document.getElementById('users-list');
const messageInput = document.getElementById('message-input');
const userCount = document.getElementById('user-count');

function joinRoom() {
    const username = usernameInput.value.trim();
    const room = roomInput.value.trim();
    
    if (!username) {
        alert('اكتب اسمك أولاً');
        return;
    }
    
    currentUser = username;
    currentRoom = room;
    
    socket.emit('join', { username, room });
}

socket.on('joined', (data) => {
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
    roomName.textContent = 'غرفة: ' + data.room;
});

socket.on('message', (data) => {
    const div = document.createElement('div');
    
    if (data.username === 'النظام') {
        div.className = 'message system';
        div.innerHTML = `<div class="text">${data.text}</div><div class="time">${data.time}</div>`;
    } else {
        div.className = 'message';
        div.innerHTML = `
            <div class="username">${data.username}</div>
            <div class="text">${data.text}</div>
            <div class="time">${data.time}</div>
        `;
    }
    
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('users', (users) => {
    usersList.innerHTML = '';
    userCount.textContent = users.length + ' مستخدمين';
    users.forEach(username => {
        const div = document.createElement('div');
        div.className = 'user-item';
        div.textContent = username;
        usersList.appendChild(div);
    });
});

function sendMessage() {
    const text = messageInput.value.trim();
    if (text) {
        socket.emit('chat', { text });
        messageInput.value = '';
    }
}

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
