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

const OWNER_EMAIL = 'emadhlaweh@gmail.com';
const OWNER_USERNAME = 'Emad';
const OWNER_PASSWORD = '1208804500';

let currentUser = null;
let currentUserData = null;

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const roomTitle = document.getElementById('room-title');
const memoryBtn = document.getElementById('memory-btn');
const memorySidebarItem = document.getElementById('memory-sidebar-item');
const privateRoomItem = document.getElementById('private-room-item');
const profileOverlay = document.getElementById('profile-overlay');
const fileInput = document.getElementById('file-input');

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tab).style.display = 'flex';
    event.target.classList.add('active');
}

function isOwner() {
    if (!currentUserData) return false;
    return currentUserData.email === OWNER_EMAIL && 
           currentUserData.username === OWNER_USERNAME;
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
    
    if (email === OWNER_EMAIL && password !== OWNER_PASSWORD) {
        alert('كلمة السر غير صحيحة للمالك');
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        const role = (email === OWNER_EMAIL && username === OWNER_USERNAME) ? 'King' : 'Guest';
        
        await db.collection('users').doc(userCredential.user.uid).set({
            username: username,
            email: email,
            role: role,
            bio: '',
            coverData: '',
            avatarData: '',
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
        isGuest: true,
        email: null,
        bio: '',
        coverData: '',
        avatarData: ''
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
    
    memoryBtn.style.display = 'none';
    memorySidebarItem.style.display = 'none';
    privateRoomItem.style.display = 'none';
    
    if (isOwner()) {
        memoryBtn.style.display = 'flex';
        memorySidebarItem.style.display = 'block';
        privateRoomItem.style.display = 'block';
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
            role: currentUserData.role || 'Guest',
            avatarData: currentUserData.avatarData || '',
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
    
    if (msg.role === 'King') {
        div.style.borderRight = '3px solid #ffd700';
        div.style.background = 'rgba(255, 215, 0, 0.1)';
    }
    
    div.innerHTML = `
        <div class="username">${msg.username} ${msg.role === 'King' ? '👑' : ''}</div>
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

function toggleMenu(event) {
    event.stopPropagation();
    openSidebar('left-sidebar');
}

function toggleRooms(event) {
    event.stopPropagation();
    openSidebar('right-sidebar');
}

function openSidebar(id) {
    closeAllSidebars();
    document.getElementById(id).classList.add('open');
    document.getElementById('overlay').classList.add('show');
}

function closeSidebar(id) {
    document.getElementById(id).classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
}

function closeAllSidebars() {
    document.querySelectorAll('.sidebar').forEach(el => el.classList.remove('open'));
    document.getElementById('overlay').classList.remove('show');
}

function showAlert(msg) {
    closeAllSidebars();
    alert(msg);
}

function toggleProfile(event) {
    event.stopPropagation();
    closeAllSidebars();
    openProfile();
}

function openProfile() {
    if (!currentUserData) return;
    
    document.getElementById('profile-name').textContent = currentUserData.username;
    document.getElementById('profile-role').textContent = currentUserData.role || 'Guest';
    document.getElementById('profile-bio').textContent = currentUserData.bio || 'اضغط لكتابة تعريف رمزي...';
    
    const avatarImg = document.getElementById('avatar-img');
    const avatarLetter = document.getElementById('avatar-letter');
    
    if (currentUserData.avatarData) {
        avatarImg.src = currentUserData.avatarData;
        avatarImg.style.display = 'block';
        avatarLetter.style.display = 'none';
    } else {
        avatarImg.style.display = 'none';
        avatarLetter.style.display = 'block';
        avatarLetter.textContent = currentUserData.username.charAt(0);
    }
    
    const coverImg = document.getElementById('cover-img');
    if (currentUserData.coverData) {
        coverImg.src = currentUserData.coverData;
        coverImg.style.display = 'block';
    } else {
        coverImg.style.display = 'none';
    }
    
    profileOverlay.classList.add('show');
}

function closeProfile() {
    profileOverlay.classList.remove('show');
}

async function saveProfile() {
    const bio = document.getElementById('profile-bio').textContent.trim();
    
    if (bio.length > 20) {
        alert('التعريف الرمزي 20 حرف كحد أقصى');
        return;
    }
    
    currentUserData.bio = bio;
    
    if (currentUser && !currentUserData.isGuest) {
        await db.collection('users').doc(currentUser).update({
            bio: bio
        });
    }
    
    closeProfile();
    alert('تم الحفظ!');
}

function logout() {
    auth.signOut();
    currentUser = null;
    currentUserData = null;
    profileOverlay.classList.remove('show');
    chatScreen.style.display = 'none';
    loginScreen.style.display = 'flex';
}

let uploadType = '';

function uploadCover() {
    uploadType = 'cover';
    fileInput.click();
}

function uploadAvatar() {
    uploadType = 'avatar';
    fileInput.click();
}

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) {
        alert('الصورة كبيرة! اختر صورة أقل من 1MB');
        return;
    }
    
    if (!currentUser || currentUserData.isGuest) {
        alert('الزوار لا يمكنهم رفع صور');
        return;
    }
    
    try {
        const reader = new FileReader();
        
        reader.onload = async function(event) {
            const base64 = event.target.result;
            
            if (uploadType === 'cover') {
                currentUserData.coverData = base64;
                document.getElementById('cover-img').src = base64;
                document.getElementById('cover-img').style.display = 'block';
                
                await db.collection('users').doc(currentUser).update({
                    coverData: base64
                });
            } else {
                currentUserData.avatarData = base64;
                document.getElementById('avatar-img').src = base64;
                document.getElementById('avatar-img').style.display = 'block';
                document.getElementById('avatar-letter').style.display = 'none';
                
                await db.collection('users').doc(currentUser).update({
                    avatarData: base64
                });
            }
            
            alert('تم رفع الصورة!');
        };
        
        reader.readAsDataURL(file);
        
    } catch (err) {
        alert('خطأ: ' + err.message);
    }
    
    e.target.value = '';
});

async function removeCover() {
    currentUserData.coverData = '';
    document.getElementById('cover-img').style.display = 'none';
    
    if (currentUser && !currentUserData.isGuest) {
        await db.collection('users').doc(currentUser).update({
            coverData: ''
        });
    }
}

async function removeAvatar() {
    currentUserData.avatarData = '';
    document.getElementById('avatar-img').style.display = 'none';
    document.getElementById('avatar-letter').style.display = 'block';
    
    if (currentUser && !currentUserData.isGuest) {
        await db.collection('users').doc(currentUser).update({
            avatarData: ''
        });
    }
}

function toggleNotifications(event) {
    event.stopPropagation();
    closeAllSidebars();
    alert('الإشعارات - قريباً');
}

function togglePrivate(event) {
    event.stopPropagation();
    closeAllSidebars();
    alert('الرسائل الخاصة - قريباً');
}

function toggleMemory(event) {
    event.stopPropagation();
    closeAllSidebars();
    alert('الذاكرة - قريباً');
}

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
