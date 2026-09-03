const firebaseConfig = {
  apiKey: "AIzaSyAGbS9KHTdS_t2TEfaemKEWvXCmSQBZgio",
  authDomain: "qamar-chat-811a5.firebaseapp.com",
  projectId: "qamar-chat-811a5",
  storageBucket: "qamar-chat-811a5.firebasestorage.app",
  messagingSenderId: "469638501074",
  appId: "1:469638501074:web:fc0f049efe35dc914e930b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentUser = '';

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');

function joinChat() {
    const username = usernameInput.value.trim();
    if (!username) {
        alert('اكتب اسمك أولاً');
        return;
    }
    
    currentUser = username;
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
    
    loadMessages();
    listenForMessages();
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUser) return;
    
    try {
        await db.collection('messages').add({
            username: currentUser,
            message: text,
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        messageInput.value = '';
    } catch (err) {
        alert('خطأ: ' + err.message);
    }
}

async function loadMessages() {
    try {
        const snapshot = await db.collection('messages')
            .orderBy('created_at', 'asc')
            .limit(100)
            .get();
        
        messagesDiv.innerHTML = '';
        snapshot.forEach(doc => {
            addMessageToScreen(doc.data());
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch (err) {
        console.error('خطأ:', err);
    }
}

function listenForMessages() {
    db.collection('messages')
        .orderBy('created_at', 'asc')
        .limitToLast(1)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    addMessageToScreen(change.doc.data());
                }
            });
        });
}

function addMessageToScreen(msg) {
    const div = document.createElement('div');
    div.className = 'message';
    
    const time = msg.created_at ? new Date(msg.created_at.seconds * 1000).toLocaleTimeString('ar') : '';
    
    div.innerHTML = `
        <div class="username">${msg.username}</div>
        <div class="text">${msg.message}</div>
        <div class="time">${time}</div>
    `;
    
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function leaveChat() {
    currentUser = '';
    chatScreen.style.display = 'none';
    loginScreen.style.display = 'flex';
}
