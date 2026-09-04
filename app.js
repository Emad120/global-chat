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
    sizeW: 22,
    sizeH: 22,
    color: '#d4af37',
    bg: 'transparent',
    effect: 'none',
    frame: 'none',
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

const effects = [
    { value: 'none', label: 'بدون', animation: 'none' },
    { value: 'glow-gold', label: 'توهج ذهبي', animation: 'glow-gold' },
    { value: 'glow-white', label: 'توهج أبيض', animation: 'glow-white' },
    { value: 'glow-blue', label: 'توهج أزرق', animation: 'glow-blue' },
    { value: 'glow-red', label: 'توهج أحمر', animation: 'glow-red' },
    { value: 'glow-green', label: 'توهج أخضر', animation: 'glow-green' },
    { value: 'glow-purple', label: 'توهج بنفسجي', animation: 'glow-purple' },
    { value: 'glow-rainbow', label: 'توهج قوس قزح', animation: 'glow-rainbow' },
    { value: 'blink', label: 'وميض', animation: 'blink' },
    { value: 'bounce', label: 'قفز', animation: 'bounce' },
    { value: 'swing', label: 'تأرجح', animation: 'swing' },
    { value: 'wobble', label: 'تمايل', animation: 'wobble' },
    { value: 'zoom', label: 'زوم', animation: 'zoom' },
    { value: 'flip', label: 'انعكاس', animation: 'flip' },
    { value: 'slide', label: 'انزلاق', animation: 'slide' },
    { value: 'fade', label: 'تلاشي', animation: 'fade' },
    { value: 'rotate', label: 'دوران', animation: 'rotate' },
    { value: 'scale', label: 'تكبير', animation: 'scale' },
    { value: 'glitter', label: 'بريق', animation: 'glitter' },
    { value: 'shining', label: 'لمعان', animation: 'shining' },
    { value: 'flashing', label: 'وميض قوي', animation: 'flashing' },
    { value: 'color-change', label: 'تغيير لون', animation: 'color-change' }
];

const frames = [
    { value: 'none', label: 'بدون إطار' },
    { value: 'gold', label: 'إطار ذهبي متوهج' },
    { value: 'rainbow', label: 'إطار قوس قزح' },
    { value: 'white', label: 'إطار أبيض متوهج' },
    { value: 'blue', label: 'إطار أزرق متوهج' },
    { value: 'red', label: 'إطار أحمر متوهج' },
    { value: 'green', label: 'إطار أخضر متوهج' },
    { value: 'purple', label: 'إطار بنفسجي متوهج' }
];

const PEER_SERVERS = [
    { host: '0.peerjs.com', port: 443, secure: true, path: '/' },
    { host: 'peerjs.vercel.app', port: 443, secure: true, path: '/' },
    { host: 'peerjs-server.herokuapp.com', port: 443, secure: true, path: '/' }
];

let currentServerIndex = 0;

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    const targetTab = document.getElementById('tab-' + tab);
    if (targetTab) targetTab.style.display = 'flex';
    if (event && event.target) event.target.classList.add('active');
}

function isOwner() {
    if (!currentUserData) return false;
    return currentUserData.email === OWNER_EMAIL && currentUserData.username === OWNER_USERNAME;
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
    
    try {
        const userCredential = await auth.signInAnonymously();
        currentUser = userCredential.user.uid;
        currentUserData = {
            uid: currentUser,
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
    } catch (err) {
        alert('خطأ في تسجيل الزائر: ' + err.message);
    }
}

async function loadUserData(uid) {
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists) {
        currentUser = uid;
        currentUserData = doc.data();
        currentUserData.uid = uid;
        
        if (currentUserData.textStyle) {
            textStyle = currentUserData.textStyle;
            if (!textStyle.sizeW) textStyle.sizeW = textStyle.size || 22;
            if (!textStyle.sizeH) textStyle.sizeH = textStyle.size || 22;
            if (!textStyle.frame) textStyle.frame = 'none';
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
    listenForMics();
    
    db.collection('messages').add({
        username: 'النظام',
        message: `🌟 ${currentUserData.username} انضم للروم`,
        created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    setTimeout(() => {
        initPeer();
    }, 1000);
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
                    if (!document.querySelector(`[data-id="${change.doc.id}"]`)) {
                        addMessageToScreen(msgData, change.doc.id);
                    }
                }
            });
        });
}

function getEffectAnimation(effect) {
    const validEffects = effects.map(e => e.animation);
    return validEffects.includes(effect) ? effect : 'none';
}

function addMessageToScreen(msg, id) {
    const div = document.createElement('div');
    div.className = 'message';
    if (id) div.dataset.id = id;
    
    const timeStr = msg.created_at ? new Date(msg.created_at.seconds * 1000).toLocaleTimeString('ar') : '';
    
    if (msg.username === 'النظام') {
        div.style.borderRight = '3px solid #4ade80';
        div.style.background = 'rgba(74, 222, 128, 0.1)';
    }
    if (msg.role === 'King') {
        div.style.borderRight = '3px solid #ffd700';
        div.style.background = 'rgba(255, 215, 0, 0.1)';
    }
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'username';
    nameDiv.textContent = `${msg.username} ${msg.role === 'King' ? '👑' : ''}`;
    
    if (msg.textStyle) {
        const ts = msg.textStyle;
        let nameStyle = `font-family:${ts.font};font-size:${Math.round((ts.sizeW || ts.size) * 0.7)}px;color:${ts.color};`;
        nameStyle += ts.bg && ts.bg !== 'transparent' ? `background:${ts.bg};` : 'background:transparent;';
        nameStyle += 'padding: 2px 5px; border-radius: 4px;';
        
        if (ts.frame === 'gold') nameStyle += `border: 2px solid #d4af37; box-shadow: 0 0 10px #d4af37;`;
        if (ts.frame === 'rainbow') nameStyle += `border: 2px solid; border-image: linear-gradient(90deg, red, orange, yellow, green, blue, purple) 1; box-shadow: 0 0 10px #fff;`;
        if (ts.frame === 'white') nameStyle += `border: 2px solid #fff; box-shadow: 0 0 10px #fff;`;
        if (ts.frame === 'blue') nameStyle += `border: 2px solid #0abde3; box-shadow: 0 0 10px #0abde3;`;
        if (ts.frame === 'red') nameStyle += `border: 2px solid #ff0000; box-shadow: 0 0 10px #ff0000;`;
        if (ts.frame === 'green') nameStyle += `border: 2px solid #00ff00; box-shadow: 0 0 10px #00ff00;`;
        if (ts.frame === 'purple') nameStyle += `border: 2px solid #9b59b6; box-shadow: 0 0 10px #9b59b6;`;
        
        const anim = getEffectAnimation(ts.effect);
        if (anim !== 'none') {
            nameStyle += `animation: ${anim} ${3 / (ts.intensity || 5)}s infinite;`;
        }
        nameDiv.style.cssText = nameStyle;
    }
    
    const textDiv = document.createElement('div');
    textDiv.className = 'text';
    textDiv.textContent = msg.message;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'time';
    timeDiv.textContent = timeStr;
    
    div.appendChild(nameDiv);
    div.appendChild(textDiv);
    div.appendChild(timeDiv);
    
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function copyRoomLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert('تم نسخ رابط الغرفة!');
    });
}

function toggleMics() {
    const mics = document.getElementById('mics-bar').querySelector('.mics');
    if (mics) mics.style.display = (mics.style.display === 'none') ? 'flex' : 'none';
}

function toggleMenu(event) {
    if (event) event.stopPropagation();
    openSidebar('left-sidebar');
}

function toggleRooms(event) {
    if (event) event.stopPropagation();
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
    if (event) event.stopPropagation();
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
    coverImg.style.display = currentUserData.coverUrl ? 'block' : 'none';
    if (currentUserData.coverUrl) coverImg.src = currentUserData.coverUrl;
    
    const bgImg = document.getElementById('bg-img');
    bgImg.style.display = currentUserData.backgroundUrl ? 'block' : 'none';
    if (currentUserData.backgroundUrl) bgImg.src = currentUserData.backgroundUrl;
    
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
    if (!currentUserData) return;
    
    const dialog = document.getElementById('name-edit-dialog');
    if (!dialog) return;
    
    dialog.style.display = 'block';
    
    document.getElementById('name-edit-input').value = currentUserData.username || '';
    document.getElementById('name-width-range').value = textStyle.sizeW;
    document.getElementById('name-width-value').textContent = textStyle.sizeW;
}

function closeNameEditDialog() {
    document.getElementById('name-edit-dialog').style.display = 'none';
}

function applyNameEdit() {
    const newName = document.getElementById('name-edit-input').value.trim();
    if (newName && newName !== currentUserData.username) {
        currentUserData.username = newName;
        document.getElementById('profile-name').textContent = newName;
        
        if (currentUser && !currentUserData.isGuest) {
            db.collection('users').doc(currentUser).update({ username: newName });
        }
    }
    
    textStyle.sizeW = parseInt(document.getElementById('name-width-range').value);
    textStyle.sizeH = textStyle.sizeW;
    
    closeNameEditDialog();
    applyStyleToName();
    saveTextStyle();
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
                await db.collection('users').doc(currentUser).update({ bio: newBio });
            }
        }
    }, { once: true });
}

function toggleOptionsMenu() {
    const menu = document.getElementById('options-menu');
    if (menu) menu.style.display = (menu.style.display === 'none' || menu.style.display === '') ? 'flex' : 'none';
}

function closeOptionsMenu() {
    const menu = document.getElementById('options-menu');
    if (menu) menu.style.display = 'none';
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
    const effectList = document.getElementById('effect-list');
    effectList.innerHTML = '';
    
    effects.forEach(effect => {
        const div = document.createElement('div');
        div.className = 'effect-item';
        
        const preview = document.createElement('div');
        preview.className = 'effect-preview';
        preview.textContent = currentUserData?.username || 'قمر الشام';
        
        if (effect.animation !== 'none') {
            preview.style.animation = `${effect.animation} ${3 / (textStyle.intensity || 5)}s infinite`;
        }
        
        div.appendChild(preview);
        div.appendChild(document.createTextNode(effect.label));
        
        div.onclick = function() {
            textStyle.effect = effect.value;
            effectList.querySelectorAll('.effect-item').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
        };
        effectList.appendChild(div);
    });
    
    document.getElementById('effect-dialog').style.display = 'block';
}

function closeEffectDialog() {
    document.getElementById('effect-dialog').style.display = 'none';
}

function openFrameDialog() {
    closeOptionsMenu();
    const frameList = document.getElementById('frame-list');
    frameList.innerHTML = '';
    
    frames.forEach(frame => {
        const div = document.createElement('div');
        div.className = 'frame-item';
        div.textContent = frame.label;
        div.onclick = function() {
            textStyle.frame = frame.value;
            frameList.querySelectorAll('.frame-item').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
        };
        frameList.appendChild(div);
    });
    document.getElementById('frame-dialog').style.display = 'block';
}

function closeFrameDialog() {
    document.getElementById('frame-dialog').style.display = 'none';
}

function openProfileBgDialog() {
    closeOptionsMenu();
    const dialog = document.getElementById('profile-bg-dialog');
    const img = document.getElementById('bg-dialog-img');
    const placeholder = document.getElementById('bg-dialog-placeholder');
    
    if (currentUserData?.backgroundUrl) {
        img.src = currentUserData.backgroundUrl;
        img.style.display = 'block';
        placeholder.style.display = 'none';
    } else {
        img.style.display = 'none';
        placeholder.style.display = 'block';
    }
    
    dialog.style.display = 'block';
}

function closeProfileBgDialog() {
    document.getElementById('profile-bg-dialog').style.display = 'none';
}

async function saveBackground() {
    if (currentUserData?.backgroundUrl && currentUser && !currentUserData.isGuest) {
        await db.collection('users').doc(currentUser).update({
            backgroundUrl: currentUserData.backgroundUrl
        });
    }
    
    const bgImg = document.getElementById('bg-img');
    if (currentUserData?.backgroundUrl) {
        bgImg.src = currentUserData.backgroundUrl;
        bgImg.style.display = 'block';
    }
    
    closeProfileBgDialog();
    alert('تم حفظ الخلفية!');
}

function removeBackgroundFromDialog() {
    currentUserData.backgroundUrl = '';
    document.getElementById('bg-dialog-img').style.display = 'none';
    document.getElementById('bg-dialog-placeholder').style.display = 'block';
    
    const bgImg = document.getElementById('bg-img');
    bgImg.style.display = 'none';
}

function closeAllDialogs() {
    document.querySelectorAll('.color-dialog, .dialog').forEach(el => el.style.display = 'none');
}

function applyColor() { closeColorDialog(); saveTextStyle(); }
function applyBgColor() { closeBgDialog(); saveTextStyle(); }
function applyFont() {
    textStyle.font = document.getElementById('font-select').value;
    closeFontDialog();
    applyStyleToName();
    saveTextStyle();
}
function applyEffect() { closeEffectDialog(); applyStyleToName(); saveTextStyle(); }
function applyFrame() { closeFrameDialog(); applyStyleToName(); saveTextStyle(); }

function saveTextStyle() {
    if (currentUserData) currentUserData.textStyle = textStyle;
    if (currentUser && !currentUserData?.isGuest) {
        db.collection('users').doc(currentUser).update({ textStyle: textStyle });
    }
}

function applyStyleToName() {
    const nameEl = document.getElementById('profile-name');
    if (!nameEl) return;
    
    const smallerSize = Math.round(textStyle.sizeW * 0.7);
    
    let css = `
        font-family: ${textStyle.font}, sans-serif;
        font-size: ${smallerSize}px;
        line-height: ${Math.round(textStyle.sizeH * 0.7)}px;
        color: ${textStyle.color};
        background: transparent;
        border: none;
        box-shadow: none;
        text-shadow: none;
        padding: 0;
    `;
    
    nameEl.style.cssText = css;
    nameEl.style.animation = 'none';
    
    const anim = getEffectAnimation(textStyle.effect);
    if (anim !== 'none') {
        nameEl.style.animation = `${anim} ${3 / (textStyle.intensity || 5)}s infinite`;
    }
}

const widthRange = document.getElementById('name-width-range');
if (widthRange) {
    widthRange.addEventListener('input', function() {
        textStyle.sizeW = parseInt(this.value);
        document.getElementById('name-width-value').textContent = this.value;
        applyStyleToName();
    });
}

const intensityRange = document.getElementById('effect-intensity');
if (intensityRange) {
    intensityRange.addEventListener('input', function() {
        textStyle.intensity = parseInt(this.value);
        document.getElementById('intensity-value').textContent = this.value;
        applyStyleToName();
    });
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

function setUploadType(type) {
    uploadType = type;
}

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!currentUser || currentUserData?.isGuest) {
        alert('الزوار لا يمكنهم رفع صور');
        return;
    }
    
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (event) => { img.src = event.target.result; };
    
    img.onload = async function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.width;
        let height = img.height;
        const maxSize = 800;
        
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
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        if (uploadType === 'cover') {
            currentUserData.coverUrl = compressedBase64;
            document.getElementById('cover-img').src = compressedBase64;
            document.getElementById('cover-img').style.display = 'block';
        } else if (uploadType === 'avatar') {
            currentUserData.avatarUrl = compressedBase64;
            document.getElementById('avatar-img').src = compressedBase64;
            document.getElementById('avatar-img').style.display = 'block';
            document.getElementById('avatar-letter').style.display = 'none';
        } else if (uploadType === 'background') {
            currentUserData.backgroundUrl = compressedBase64;
            const bgImg = document.getElementById('bg-img');
            bgImg.src = compressedBase64;
            bgImg.style.display = 'block';
            
            const dialogImg = document.getElementById('bg-dialog-img');
            const placeholder = document.getElementById('bg-dialog-placeholder');
            if (dialogImg) {
                dialogImg.src = compressedBase64;
                dialogImg.style.display = 'block';
                placeholder.style.display = 'none';
            }
        }
        
        if (uploadType !== 'background') {
            const updateData = {};
            if (uploadType === 'cover') updateData.coverUrl = compressedBase64;
            if (uploadType === 'avatar') updateData.avatarUrl = compressedBase64;
            await db.collection('users').doc(currentUser).update(updateData);
        }
        
        alert('تم اختيار الصورة!');
    };
    
    reader.readAsDataURL(file);
    e.target.value = '';
});

async function removeCover() {
    currentUserData.coverUrl = '';
    document.getElementById('cover-img').style.display = 'none';
    if (currentUser && !currentUserData?.isGuest) {
        await db.collection('users').doc(currentUser).update({ coverUrl: '' });
    }
}

async function removeAvatar() {
    currentUserData.avatarUrl = '';
    document.getElementById('avatar-img').style.display = 'none';
    document.getElementById('avatar-letter').style.display = 'block';
    if (currentUser && !currentUserData?.isGuest) {
        await db.collection('users').doc(currentUser).update({ avatarUrl: '' });
    }
}

function toggleNotifications(event) {
    if (event) event.stopPropagation();
    closeAllSidebars();
    alert('الإشعارات - قريباً');
}

function togglePrivate(event) {
    if (event) event.stopPropagation();
    closeAllSidebars();
    alert('الرسائل الخاصة - قريباً');
}

function toggleMemory(event) {
    if (event) event.stopPropagation();
    closeAllSidebars();
    alert('الذاكرة - قريباً');
}

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// ============ نظام المايكات WebRTC ============
let peer = null;
let myStream = null;
let joinedMicNumber = null;
let activeCalls = {};
let myPeerId = null;

function initPeer() {
    if (peer) return;
    
    const config = PEER_SERVERS[currentServerIndex];
    
    peer = new Peer(undefined, config);
    
    peer.on('open', (id) => {
        myPeerId = id;
        console.log('My Peer ID:', id);
        
        if (currentUser) {
            db.collection('users').doc(currentUser).update({ peerId: id });
        }
    });
    
    peer.on('call', async (call) => {
        if (myStream) {
            call.answer(myStream);
        } else {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            myStream = stream;
            call.answer(stream);
        }
        
        call.on('stream', (remoteStream) => {
            const audio = new Audio();
            audio.srcObject = remoteStream;
            audio.play().catch(() => {});
        });
        
        activeCalls[call.peer] = call;
    });
    
    peer.on('error', (err) => {
        console.error('PeerJS Error:', err.message);
        
        if (err.type === 'network' || err.type === 'server-error' || err.type === 'peer-unavailable') {
            if (currentServerIndex < PEER_SERVERS.length - 1) {
                currentServerIndex++;
                peer.destroy();
                peer = null;
                myPeerId = null;
                initPeer();
            }
        }
    });
}

function connectToPeer(remotePeerId) {
    if (!peer || !myStream) return;
    if (activeCalls[remotePeerId]) return;
    
    try {
        const call = peer.call(remotePeerId, myStream);
        
        call.on('stream', (remoteStream) => {
            const audio = new Audio();
            audio.srcObject = remoteStream;
            audio.play().catch(() => {});
        });
        
        activeCalls[remotePeerId] = call;
    } catch (err) {
        console.error('Call Error:', err);
    }
}

function listenForMics() {
    db.collection('mics').orderBy('micNumber').onSnapshot((snapshot) => {
        for (let i = 1; i <= 4; i++) {
            const micEl = document.getElementById('mic' + i);
            micEl.classList.remove('taken');
            micEl.textContent = '🎙️';
        }
        
        snapshot.forEach((doc) => {
            const micData = doc.data();
            const micEl = document.getElementById('mic' + micData.micNumber);
            if (micEl) {
                micEl.classList.add('taken');
                micEl.textContent = micData.username.charAt(0);
            }
            
            // اتصال تلقائي
            if (micData.userId !== currentUser && micData.peerId && micData.peerId !== 'pending') {
                setTimeout(() => {
                    connectToPeer(micData.peerId);
                }, 3000);
            }
        });
    });
}

async function joinMic(micNumber) {
    if (!currentUserData) {
        alert('سجل دخول أولاً!');
        return;
    }
    
    const micDoc = await db.collection('mics').doc('mic' + micNumber).get();
    if (micDoc.exists && micDoc.data().userId !== currentUser) {
        alert('المايك مأخوذ!');
        return;
    }
    
    if (joinedMicNumber === micNumber) {
        await leaveMic();
        return;
    }
    
    if (joinedMicNumber) {
        await leaveMic();
    }
    
    try {
        if (!peer) initPeer();
        
        myStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        joinedMicNumber = micNumber;
        
        await db.collection('mics').doc('mic' + micNumber).set({
            micNumber: micNumber,
            userId: currentUser,
            username: currentUserData.username,
            peerId: myPeerId || 'pending',
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('✅ انضممت للمايك ' + micNumber);
        
    } catch (err) {
        alert('❌ خطأ: ' + err.message);
    }
}

async function leaveMic() {
    if (!joinedMicNumber) return;
    
    try {
        if (myStream) {
            myStream.getTracks().forEach(track => track.stop());
            myStream = null;
        }
        
        Object.values(activeCalls).forEach(call => call.close());
        activeCalls = {};
        
        await db.collection('mics').doc('mic' + joinedMicNumber).delete();
        
        alert('غادرت المايك');
        joinedMicNumber = null;
    } catch (err) {
        alert('❌ خطأ: ' + err.message);
    }
}

document.getElementById('mic1').addEventListener('click', () => joinMic(1));
document.getElementById('mic2').addEventListener('click', () => joinMic(2));
document.getElementById('mic3').addEventListener('click', () => joinMic(3));
document.getElementById('mic4').addEventListener('click', () => joinMic(4));
