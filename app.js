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

let textStyle = {
    font: 'Cairo',
    size: 22,
    color: '#d4af37',
    bg: 'transparent',
    effect: 'none',
    intensity: 5
};

const colors = [
    '#d4af37', '#ffd700', '#fff', '#000', '#ff0000', '#ff6b6b', '#ff9f43', '#feca57',
    '#48dbfb', '#0abde3', '#10ac84', '#1dd1a1', '#5f27cd', '#341f97', '#e84393',
    '#fd79a8', '#6c5ce7', '#a29bfe', '#00cec9', '#81ecec', '#fab1a0', '#e17055',
    '#636e72', '#b2bec3', '#2d3436', '#dfe6e9', '#74b9ff', '#0984e3', '#55efc4',
    '#00b894', '#ffeaa7', '#fdcb6e', '#e74c3c', '#c0392b', '#8e44ad', '#9b59b6',
    '#3498db', '#2980b9', '#1abc9c', '#16a085', '#2ecc71', '#27ae60', '#f1c40f',
    '#f39c12', '#e67e22', '#d35400', '#ecf0f1', '#bdc3c7', '#95a5a6', '#7f8c8d'
];

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
            coverUrl: '',
            avatarUrl: '',
            backgroundUrl: '',
            textStyle: textStyle,
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
        coverUrl: '',
        avatarUrl: '',
        backgroundUrl: '',
        textStyle: textStyle
    };
    
    enterChat();
}

async function loadUserData(uid) {
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists) {
        currentUser = uid;
        currentUserData = doc.data();
        currentUserData.uid = uid;
        
        if (currentUserData.textStyle) {
            textStyle = currentUserData.textStyle;
        }
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
            textStyle: currentUserData.textStyle || textStyle,
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
    
    let nameStyle = '';
    if (msg.textStyle) {
        const ts = msg.textStyle;
        nameStyle = `font-family:${ts.font};font-size:${ts.size}px;color:${ts.color};background:transparent;`;
    }
    
    div.innerHTML = `
        <div class="username" style="${nameStyle}">${msg.username} ${msg.role === 'King' ? '👑' : ''}</div>
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
    document.getElementById('profile-name').contentEditable = false;
    document.getElementById('profile-bio').textContent = currentUserData.bio || '';
    document.getElementById('profile-bio').contentEditable = false;
    
    applyStyleToName();
    
    const avatarImg = document.getElementById('avatar-img');
    const avatarLetter = document.getElementById('avatar-letter');
    
    if (currentUserData.avatarUrl) {
        avatarImg.src = currentUserData.avatarUrl;
        avatarImg.style.display = 'block';
        avatarLetter.style.display = 'none';
    } else {
        avatarImg.style.display = 'none';
        avatarLetter.style.display = 'block';
        avatarLetter.textContent = currentUserData.username.charAt(0);
    }
    
    const coverImg = document.getElementById('cover-img');
    if (currentUserData.coverUrl) {
        coverImg.src = currentUserData.coverUrl;
        coverImg.style.display = 'block';
    } else {
        coverImg.style.display = 'none';
    }
    
    const bgImg = document.getElementById('bg-img');
    if (currentUserData.backgroundUrl) {
        bgImg.src = currentUserData.backgroundUrl;
        bgImg.style.display = 'block';
    } else {
        bgImg.style.display = 'none';
    }
    
    profileOverlay.classList.add('show');
}

function closeProfile() {
    profileOverlay.classList.remove('show');
    closeAllDialogs();
    closeOptionsMenu();
}

async function saveProfile() {
    const bio = document.getElementById('profile-bio').textContent.trim();
    
    if (bio.length > 20) {
        alert('التعريف الرمزي 20 حرف كحد أقصى');
        return;
    }
    
    currentUserData.bio = bio;
    currentUserData.textStyle = textStyle;
    
    if (currentUser && !currentUserData.isGuest) {
        await db.collection('users').doc(currentUser).update({
            bio: bio,
            textStyle: textStyle
        });
    }
    
    closeProfile();
    alert('تم الحفظ!');
}

function editName() {
    const nameEl = document.getElementById('profile-name');
    nameEl.contentEditable = true;
    nameEl.focus();
    
    nameEl.addEventListener('blur', async function() {
        nameEl.contentEditable = false;
        const newName = nameEl.textContent.trim();
        
        if (newName && newName !== currentUserData.username) {
            currentUserData.username = newName;
            
            if (currentUser && !currentUserData.isGuest) {
                await db.collection('users').doc(currentUser).update({
                    username: newName
                });
            }
        }
        
        applyStyleToName();
    }, { once: true });
}

function editBio() {
    const bioEl = document.getElementById('profile-bio');
    bioEl.contentEditable = true;
    bioEl.focus();
    
    bioEl.addEventListener('blur', async function() {
        bioEl.contentEditable = false;
        const newBio = bioEl.textContent.trim();
        
        if (newBio.length > 20) {
            alert('التعريف الرمزي 20 حرف كحد أقصى');
            bioEl.textContent = currentUserData.bio || '';
            return;
        }
        
        if (newBio !== currentUserData.bio) {
            currentUserData.bio = newBio;
            
            if (currentUser && !currentUserData.isGuest) {
                await db.collection('users').doc(currentUser).update({
                    bio: newBio
                });
            }
        }
    }, { once: true });
}

function toggleOptionsMenu() {
    const menu = document.getElementById('options-menu');
    if (menu.style.display === 'none') {
        menu.style.display = 'flex';
    } else {
        menu.style.display = 'none';
    }
}

function closeOptionsMenu() {
    document.getElementById('options-menu').style.display = 'none';
}

function openColorDialog() {
    closeOptionsMenu();
    const dialog = document.getElementById('color-dialog');
    const grid = document.getElementById('color-grid');
    grid.innerHTML = '';
    
    colors.forEach(color => {
        const div = document.createElement('div');
        div.className = 'color-item';
        div.style.background = color;
        div.onclick = function() {
            textStyle.color = color;
            grid.querySelectorAll('.color-item').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            applyStyleToName();
        };
        grid.appendChild(div);
    });
    
    dialog.style.display = 'block';
}

function closeColorDialog() {
    document.getElementById('color-dialog').style.display = 'none';
}

function openBgDialog() {
    closeOptionsMenu();
    const dialog = document.getElementById('bg-dialog');
    const grid = document.getElementById('bg-color-grid');
    grid.innerHTML = '';
    
    const transparentDiv = document.createElement('div');
    transparentDiv.className = 'color-item';
    transparentDiv.style.background = 'transparent';
    transparentDiv.style.border = '2px dashed #fff';
    transparentDiv.onclick = function() {
        textStyle.bg = 'transparent';
        grid.querySelectorAll('.color-item').forEach(el => el.classList.remove('selected'));
        transparentDiv.classList.add('selected');
        applyStyleToName();
    };
    grid.appendChild(transparentDiv);
    
    colors.forEach(color => {
        const div = document.createElement('div');
        div.className = 'color-item';
        div.style.background = color;
        div.onclick = function() {
            textStyle.bg = color;
            grid.querySelectorAll('.color-item').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            applyStyleToName();
        };
        grid.appendChild(div);
    });
    
    dialog.style.display = 'block';
}

function closeBgDialog() {
    document.getElementById('bg-dialog').style.display = 'none';
}

function openSizeDialog() {
    closeOptionsMenu();
    document.getElementById('size-dialog').style.display = 'block';
    document.getElementById('size-range').value = textStyle.size;
    document.getElementById('size-value').textContent = textStyle.size;
}

function closeSizeDialog() {
    document.getElementById('size-dialog').style.display = 'none';
}

function openFontDialog() {
    closeOptionsMenu();
    document.getElementById('font-dialog').style.display = 'block';
    document.getElementById('font-select').value = textStyle.font;
}

function closeFontDialog() {
    document.getElementById('font-dialog').style.display = 'none';
}

function openEffectDialog() {
    closeOptionsMenu();
    document.getElementById('effect-dialog').style.display = 'block';
    document.getElementById('effect-select').value = textStyle.effect;
    document.getElementById('effect-intensity').value = textStyle.intensity;
    document.getElementById('intensity-value').textContent = textStyle.intensity;
}

function closeEffectDialog() {
    document.getElementById('effect-dialog').style.display = 'none';
}

function closeAllDialogs() {
    document.querySelectorAll('.color-dialog, .dialog').forEach(el => el.style.display = 'none');
}

function applyColor() {
    closeColorDialog();
    saveTextStyle();
}

function applyBgColor() {
    closeBgDialog();
    saveTextStyle();
}

function applySize() {
    textStyle.size = parseInt(document.getElementById('size-range').value);
    closeSizeDialog();
    applyStyleToName();
    saveTextStyle();
}

function applyFont() {
    textStyle.font = document.getElementById('font-select').value;
    closeFontDialog();
    applyStyleToName();
    saveTextStyle();
}

function applyEffect() {
    textStyle.effect = document.getElementById('effect-select').value;
    textStyle.intensity = parseInt(document.getElementById('effect-intensity').value);
    closeEffectDialog();
    applyStyleToName();
    saveTextStyle();
}

function saveTextStyle() {
    currentUserData.textStyle = textStyle;
    
    if (currentUser && !currentUserData.isGuest) {
        db.collection('users').doc(currentUser).update({
            textStyle: textStyle
        });
    }
}

function applyStyleToName() {
    const nameEl = document.getElementById('profile-name');
    if (!nameEl) return;
    
    let css = '';
    css += `font-family: ${textStyle.font}, sans-serif;`;
    css += `font-size: ${textStyle.size}px;`;
    css += `color: ${textStyle.color};`;
    css += `background: transparent;`;
    
    nameEl.style.cssText = css;
    nameEl.style.animation = 'none';
    nameEl.style.boxShadow = 'none';
    nameEl.style.border = 'none';
    
    switch(textStyle.effect) {
        case 'glow':
            nameEl.style.textShadow = `0 0 ${textStyle.intensity * 2}px ${textStyle.color}`;
            break;
        case 'blink':
            nameEl.style.animation = `blink ${3 / textStyle.intensity}s infinite`;
            break;
        case 'pulse':
            nameEl.style.animation = `pulse ${2 / textStyle.intensity}s infinite`;
            break;
        case 'rainbow':
            nameEl.style.animation = `rainbow ${5 / textStyle.intensity}s infinite`;
            break;
        case 'shake':
            nameEl.style.animation = `shake ${2 / textStyle.intensity}s infinite`;
            break;
        case 'float':
            nameEl.style.animation = `float ${3 / textStyle.intensity}s infinite`;
            break;
        case 'border-glow':
            nameEl.style.border = `2px solid ${textStyle.color}`;
            nameEl.style.boxShadow = `0 0 ${textStyle.intensity * 2}px ${textStyle.color}`;
            break;
    }
}

document.getElementById('size-range').addEventListener('input', function() {
    textStyle.size = parseInt(this.value);
    document.getElementById('size-value').textContent = this.value;
    applyStyleToName();
});

document.getElementById('effect-intensity').addEventListener('input', function() {
    textStyle.intensity = parseInt(this.value);
    document.getElementById('intensity-value').textContent = this.value;
    applyStyleToName();
});

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

function uploadBackground() {
    uploadType = 'background';
    fileInput.click();
}

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!currentUser || currentUserData.isGuest) {
        alert('الزوار لا يمكنهم رفع صور');
        return;
    }
    
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = function(event) {
        img.src = event.target.result;
    };
    
    img.onload = async function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.width;
        let height = img.height;
        
        const maxSize = 1000;
        
        if (width > maxSize || height > maxSize) {
            if (width > height) {
                height = (height / width) * maxSize;
                width = maxSize;
            } else {
                width = (width / height) * maxSize;
                height = maxSize;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        
        if (uploadType === 'cover') {
            currentUserData.coverUrl = compressedBase64;
            document.getElementById('cover-img').src = compressedBase64;
            document.getElementById('cover-img').style.display = 'block';
            
            await db.collection('users').doc(currentUser).update({
                coverUrl: compressedBase64
            });
        } else if (uploadType === 'avatar') {
            currentUserData.avatarUrl = compressedBase64;
            document.getElementById('avatar-img').src = compressedBase64;
            document.getElementById('avatar-img').style.display = 'block';
            document.getElementById('avatar-letter').style.display = 'none';
            
            await db.collection('users').doc(currentUser).update({
                avatarUrl: compressedBase64
            });
        } else {
            currentUserData.backgroundUrl = compressedBase64;
            document.getElementById('bg-img').src = compressedBase64;
            document.getElementById('bg-img').style.display = 'block';
            
            await db.collection('users').doc(currentUser).update({
                backgroundUrl: compressedBase64
            });
        }
        
        alert('تم رفع الصورة!');
    };
    
    reader.readAsDataURL(file);
    e.target.value = '';
});

async function removeCover() {
    currentUserData.coverUrl = '';
    document.getElementById('cover-img').style.display = 'none';
    
    if (currentUser && !currentUserData.isGuest) {
        await db.collection('users').doc(currentUser).update({
            coverUrl: ''
        });
    }
}

async function removeAvatar() {
    currentUserData.avatarUrl = '';
    document.getElementById('avatar-img').style.display = 'none';
    document.getElementById('avatar-letter').style.display = 'block';
    
    if (currentUser && !currentUserData.isGuest) {
        await db.collection('users').doc(currentUser).update({
            avatarUrl: ''
        });
    }
}

async function removeBackground() {
    currentUserData.backgroundUrl = '';
    document.getElementById('bg-img').style.display = 'none';
    
    if (currentUser && !currentUserData.isGuest) {
        await db.collection('users').doc(currentUser).update({
            backgroundUrl: ''
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
