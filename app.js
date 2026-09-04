const SUPABASE_URL = 'https://eqlfuyvndvpmmzfthacr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0RSRXxjdE-w81kXwYUL7kQ_rPSIIl75';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const OWNER_EMAIL = 'emadhlaweh@gmail.com';
const OWNER_USERNAME = 'Emad';

let currentUser = null;
let currentUserData = null;
let messageSubscription = null;

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
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
    '#d4af37', '#ffd700', '#ffffff', '#000000', '#ff0000', '#ff6b6b', '#ff9f43', '#feca57',
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

function switchTab(tab, evt) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    const targetTab = document.getElementById('tab-' + tab);
    if (targetTab) targetTab.style.display = 'flex';
    
    const targetBtn = evt ? evt.target : window.event?.target;
    if (targetBtn) targetBtn.classList.add('active');
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
        alert('يرجى ملء جميع الحقول المطلوبة');
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
    
    const role = (email === OWNER_EMAIL && username === OWNER_USERNAME) ? 'King' : 'Member';
    
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { username: username }
        }
    });

    if (error) {
        alert('خطأ في التسجيل: ' + error.message);
        return;
    }

    if (data.user) {
        await supabase.from('users').insert({
            id: data.user.id,
            username: username,
            email: email,
            role: role,
            bio: '',
            cover_url: '',
            avatar_url: '',
            background_url: '',
            text_style: textStyle
        });
        
        alert('تم التسجيل بنجاح! يمكن الدخول الآن.');
        switchTab('login');
    }
}

async function loginUser() {
    const usernameOrEmail = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!usernameOrEmail || !password) {
        alert('يرجى أدخل اسم المستخدم أو الإيميل وكلمة السر');
        return;
    }
    
    let email = usernameOrEmail;
    if (!usernameOrEmail.includes('@')) {
        const { data: userRecord, error: userErr } = await supabase
            .from('users')
            .select('email')
            .eq('username', usernameOrEmail)
            .maybeSingle();
            
        if (userErr || !userRecord) {
            alert('اسم المستخدم غير موجود');
            return;
        }
        email = userRecord.email;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert('خطأ في تسجيل الدخول: ' + error.message);
        return;
    }

    await loadUserData(data.user.id);
    enterChat();
}

async function guestLogin() {
    const username = document.getElementById('guest-username').value.trim();
    const age = document.getElementById('guest-age').value;
    const gender = document.getElementById('guest-gender').value;
    
    if (!username || !age) {
        alert('يرجى إدخال الاسم والعمر');
        return;
    }
    if (age < 10 || age > 99) {
        alert('يرجى إدخال عمر صحيح بين 10 و 99');
        return;
    }
    
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
        alert('خطأ في دخول الزائر: ' + error.message);
        return;
    }

    currentUser = data.user.id;
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
}

async function loadUserData(uid) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

    if (data && !error) {
        currentUser = uid;
        currentUserData = {
            ...data,
            uid: uid,
            coverUrl: data.cover_url || '',
            avatarUrl: data.avatar_url || '',
            backgroundUrl: data.background_url || '',
            textStyle: data.text_style || textStyle
        };
        
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
    
    loadInitialMessages();
    listenForMessages();
    
    supabase.from('messages').insert({
        username: 'النظام',
        message: `🌟 ${currentUserData.username} انضم للروم`
    });
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUserData) return;
    
    const { error } = await supabase.from('messages').insert({
        username: currentUserData.username,
        message: text,
        uid: currentUser,
        role: currentUserData.role || 'Guest',
        text_style: currentUserData.textStyle || textStyle
    });

    if (error) {
        alert('خطأ في إرسال الرسالة: ' + error.message);
    } else {
        messageInput.value = '';
    }
}

async function loadInitialMessages() {
    messagesDiv.innerHTML = '';
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

    if (data && !error) {
        data.forEach(msg => addMessageToScreen(msg, msg.id));
    }
}

function listenForMessages() {
    if (messageSubscription) supabase.removeChannel(messageSubscription);
    
    messageSubscription = supabase
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            const msg = payload.new;
            if (!document.querySelector(`[data-id="${msg.id}"]`)) {
                addMessageToScreen(msg, msg.id);
            }
        })
        .subscribe();
}

function getEffectAnimation(effect) {
    const validEffects = effects.map(e => e.animation);
    return validEffects.includes(effect) ? effect : 'none';
}

function addMessageToScreen(msg, id) {
    const div = document.createElement('div');
    div.className = 'message';
    if (id) div.dataset.id = id;
    
    const timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '';
    
    if (msg.username === 'النظام') {
        div.classList.add('system-msg');
    }
    if (msg.role === 'King') {
        div.classList.add('king-msg');
    }
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'username';
    nameDiv.textContent = `${msg.username} ${msg.role === 'King' ? '👑' : ''}`;
    
    const styleObj = msg.text_style || msg.textStyle;
    if (styleObj) {
        const ts = styleObj;
        let nameStyle = `font-family:${ts.font};font-size:${ts.sizeW || ts.size || 22}px;color:${ts.color};`;
        nameStyle += ts.bg && ts.bg !== 'transparent' ? `background:${ts.bg};` : 'background:transparent;';
        nameStyle += 'padding: 2px 8px; border-radius: 6px; display: inline-block;';
        
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
        alert('تم نسخ رابط الروم بنجاح!');
    });
}

function toggleMics() {
    const micsBar = document.getElementById('mics-bar');
    if (!micsBar) return;
    const mics = micsBar.querySelector('.mics');
    if (mics) {
        const isHidden = mics.style.display === 'none';
        mics.style.display = isHidden ? 'flex' : 'none';
    }
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
    document.getElementById('profile-bio').textContent = currentUserData.bio || 'اضغط لكتابة تعريف رمزي...';
    
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
    if (bio.length > 30) {
        alert('التعريف الرمزي يجب ألا يتجاوز 30 حرفاً');
        return;
    }
    
    currentUserData.bio = bio;
    currentUserData.textStyle = textStyle;
    
    if (currentUser && !currentUserData.isGuest) {
        await supabase.from('users').update({
            bio: bio,
            text_style: textStyle
        }).eq('id', currentUser);
    }
    
    closeProfile();
    alert('تم حفظ البيانات بنجاح!');
}

function editName() {
    document.getElementById('name-edit-input').value = currentUserData.username;
    document.getElementById('name-width-range').value = textStyle.sizeW;
    document.getElementById('name-width-value').textContent = textStyle.sizeW;
    document.getElementById('name-height-range').value = textStyle.sizeH;
    document.getElementById('name-height-value').textContent = textStyle.sizeH;
    document.getElementById('name-edit-dialog').style.display = 'block';
}

function closeNameEditDialog() {
    document.getElementById('name-edit-dialog').style.display = 'none';
}

async function applyNameEdit() {
    const newName = document.getElementById('name-edit-input').value.trim();
    if (newName && newName !== currentUserData.username) {
        currentUserData.username = newName;
        document.getElementById('profile-name').textContent = newName;
        
        if (currentUser && !currentUserData.isGuest) {
            await supabase.from('users').update({ username: newName }).eq('id', currentUser);
        }
    }
    
    textStyle.sizeW = parseInt(document.getElementById('name-width-range').value);
    textStyle.sizeH = parseInt(document.getElementById('name-height-range').value);
    
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
        
        if (newBio.length > 30) {
            alert('التعريف الرمزي يجب ألا يتجاوز 30 حرفاً');
            bioEl.textContent = currentUserData.bio || '';
            return;
        }
        
        if (newBio !== currentUserData.bio) {
            currentUserData.bio = newBio;
            if (currentUser && !currentUserData.isGuest) {
                await supabase.from('users').update({ bio: newBio }).eq('id', currentUser);
            }
        }
    }, { once: true });
}

function toggleOptionsMenu() {
    const menu = document.getElementById('options-menu');
    menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
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
    transparentDiv.style.border = '2px dashed #aaa';
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

async function saveTextStyle() {
    if (currentUserData) currentUserData.textStyle = textStyle;
    if (currentUser && !currentUserData?.isGuest) {
        await supabase.from('users').update({ text_style: textStyle }).eq('id', currentUser);
    }
}

function applyStyleToName() {
    const nameEl = document.getElementById('profile-name');
    if (!nameEl) return;
    
    let css = `
        font-family: '${textStyle.font}', sans-serif;
        font-size: ${textStyle.sizeW}px;
        line-height: ${textStyle.sizeH}px;
        color: ${textStyle.color};
        background: transparent;
        border: none;
        box-shadow: none;
        padding: 0;
    `;
    
    nameEl.style.cssText = css;
    nameEl.style.animation = 'none';
    
    const anim = getEffectAnimation(textStyle.effect);
    if (anim !== 'none') {
        nameEl.style.animation = `${anim} ${3 / (textStyle.intensity || 5)}s infinite`;
    }
}

// السلايدرات البرمجية
const widthRange = document.getElementById('name-width-range');
if (widthRange) {
    widthRange.addEventListener('input', function() {
        textStyle.sizeW = parseInt(this.value);
        document.getElementById('name-width-value').textContent = this.value;
        applyStyleToName();
    });
}

const heightRange = document.getElementById('name-height-range');
if (heightRange) {
    heightRange.addEventListener('input', function() {
        textStyle.sizeH = parseInt(this.value);
        document.getElementById('name-height-value').textContent = this.value;
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

async function logout() {
    if (messageSubscription) supabase.removeChannel(messageSubscription);
    await supabase.auth.signOut();
    currentUser = null;
    currentUserData = null;
    profileOverlay.classList.remove('show');
    chatScreen.style.display = 'none';
    loginScreen.style.display = 'flex';
}

let uploadType = '';

function triggerUpload(type) {
    uploadType = type;
    fileInput.value = '';
    fileInput.accept = 'image/*';
    fileInput.click();
}

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!currentUser || currentUserData?.isGuest) {
        alert('الزوار لا يمكنهم تغيير الصور');
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
        
        const updateData = {};
        if (uploadType === 'cover') {
            currentUserData.coverUrl = compressedBase64;
            document.getElementById('cover-img').src = compressedBase64;
            document.getElementById('cover-img').style.display = 'block';
            updateData.cover_url = compressedBase64;
        } else if (uploadType === 'avatar') {
            currentUserData.avatarUrl = compressedBase64;
            document.getElementById('avatar-img').src = compressedBase64;
            document.getElementById('avatar-img').style.display = 'block';
            document.getElementById('avatar-letter').style.display = 'none';
            updateData.avatar_url = compressedBase64;
        } else {
            currentUserData.backgroundUrl = compressedBase64;
            document.getElementById('bg-img').src = compressedBase64;
            document.getElementById('bg-img').style.display = 'block';
            updateData.background_url = compressedBase64;
        }
        
        await supabase.from('users').update(updateData).eq('id', currentUser);
        alert('تم رفع الصورة بنجاح!');
    };
    
    reader.readAsDataURL(file);
    e.target.value = '';
});

async function removeCover() {
    currentUserData.coverUrl = '';
    document.getElementById('cover-img').style.display = 'none';
    if (currentUser && !currentUserData?.isGuest) {
        await supabase.from('users').update({ cover_url: '' }).eq('id', currentUser);
    }
}

async function removeAvatar() {
    currentUserData.avatarUrl = '';
    document.getElementById('avatar-img').style.display = 'none';
    document.getElementById('avatar-letter').style.display = 'block';
    if (currentUser && !currentUserData?.isGuest) {
        await supabase.from('users').update({ avatar_url: '' }).eq('id', currentUser);
    }
}

async function removeBackground() {
    currentUserData.backgroundUrl = '';
    document.getElementById('bg-img').style.display = 'none';
    if (currentUser && !currentUserData?.isGuest) {
        await supabase.from('users').update({ background_url: '' }).eq('id', currentUser);
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
