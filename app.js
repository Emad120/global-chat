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
const auth = firebase.auth();

let currentUser = null;
let currentUserData = null;

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const roomTitle = document.getElementById('room-title');
const memoryBtn = document.getElementById('memory-btn');

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tab).style.display = 'flex';
    event.target.classList.add('active');
}

async function registerUser() {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    
    if (!username || !email || !password) {
        alert('املأ كل الحقول');
        return;
    }
    
    if (password !== confirm) {
        alert('كلمة السر غير متطابقة');
        return;
    }
    
    if (password.length < 6) {
        alert('كلمة السر قصيرة - 6 أحرف على الأقل');
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await db.collection('users').doc(userCredential.user.uid).set({
            username: username,
            email: email,
            role: 'Guest',
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('تم التسجيل! أرسلنا لك رابط تأكيد على إيميلك');
        await userCredential.user.sendEmailVerification();
        switchTab('login');
    } catch (err) {
        alert('خطأ: ' + err.message);
    }
}

async function loginUser() {
    const usernameOrEmail = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!usernameOrEmail || !password) {
        alert('املأ كل الحقول');
        return;
    }
    
    try {
        let email = usernameOrEmail;
        
        if (!usernameOrEmail.includes('@')) {
            const snapshot = await db.collection('users')
                .where('username', '==', usernameOrEmail)
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                alert('المستخدم غير موجود');
                return;
            }
            
            email = snapshot.docs[0].data().email;
        }
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        if (!userCredential.user.emailVerified) {
            alert('يرجى تأكيد إيميلك أولاً');
            return;
        }
        
        await loadUserData(userCredential.user.uid);
        enterChat();
    } catch (err) {
        alert('خطأ: ' + err.message);
    }
}

async function guestLogin() {
    const username = document.getElementById('guest-username').value.trim();
    const age = document.getElementById('guest-age').value;
    const gender = document.getElementById('guest-gender').value;
    
    if (!username || !age) {
        alert('املأ كل الحقول');
        return;
    }
    
    if (age < 10 || age > 99) {
        alert('عمر غير صحيح');
        return;
    }
    
    currentUser = 'guest_' + Date.now();
    currentUserData = {
        username: username,
        age: age,
        gender: gender,
        role: 'Guest',
        isGuest: true
    };
    
    enterChat();
}

async function loadUserData(uid) {
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists) {
        currentUser = uid;
        currentUserData = doc.data();
        currentUserData.uid = uid;
    }
}

function enterChat() {
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
    
    if (currentUserData && currentUserData.username === 'Emad') {
        memoryBtn.style.display = 'block';
    }
    
    listenForMessages();
    
    db.collection('messages').add({
        username: 'النظام',
        message: `🌟 ${currentUserData.username} انضم للروم`,
        created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUserData) return;
    
    try {
        await db.collection('messages').add({
            username: currentUserData.username,
            message: text,
            uid: currentUser,
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        messageInput.value = '';
    } catch (err) {
        alert('خطأ: ' + err.message);
    }
}

function listenForMessages() {
    db.collection('messages')
        .orderBy('created_at', 'asc')
        .limitToLast(100)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const msgData = change.doc.data();
                    const existingMessages = document.querySelectorAll('.message');
                    let exists = false;
                    
                    existingMessages.forEach(el => {
                        if (el.dataset.id === change.doc.id) {
                            exists = true;
                        }
                    });
                    
                    if (!exists) {
                        addMessageToScreen(msgData, change.doc.id);
                    }
                }
            });
        });
}

function addMessageToScreen(msg, id) {
    const div = document.createElement('div');
    div.className = 'message';
    if (id) div.dataset.id = id;
    
    const time = msg.created_at ? new Date(msg.created_at.seconds * 1000).toLocaleTimeString('ar') : '';
    
    if (msg.username === 'النظام') {
        div.style.borderRight = '3px solid #4ade80';
        div.style.background = 'rgba(74, 222, 128, 0.1)';
    }
    
    div.innerHTML = `
        <div class="username">${msg.username}</div>
        <div class="text">${msg.message}</div>
        <div class="time">${time}</div>
    `;
    
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function copyRoomLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert('تم نسخ رابط الغرفة!');
    });
}

function toggleMics() {
    const micsBar = document.getElementById('mics-bar');
    const mics = micsBar.querySelector('.mics');
    if (mics.style.display === 'none') {
        mics.style.display = 'flex';
    } else {
        mics.style.display = 'none';
    }
}

function toggleRooms() {
    alert('قائمة الرومات - قريباً');
}

function toggleNotifications() {
    alert('الإشعارات - قريباً');
}

function togglePrivate() {
    alert('الرسائل الخاصة - قريباً');
}

function toggleMemory() {
    alert('الذاكرة - قريباً');
}

function toggleProfile() {
    alert('البروفايل - قريباً');
}

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
