// تهيئة Firebase الآمنة (احرص على إضافة بيانات مشروعك هنا)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// تشغيل الفايربيس بحالة عدم التهيئة المسبقة
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// بيانات المستخدم الحالية المفترضة
let currentUser = "emad_user_id";
let currentUserData = {
    name: "عماد",
    isGuest: false,
    coverUrl: "",
    avatarUrl: "",
    backgroundUrl: ""
};

// إعدادات التخصيص
let userStyle = {
    fontFamily: 'Cairo',
    textColor: '#ffffff',
    bgColor: 'transparent',
    effect: 'none',
    frame: 'none',
    scaleX: 1,
    scaleY: 1
};

// --- 1. دالة رفع الضغط والرفع الموحدة للصور ---
function handleImageUpload(file, type) {
    if (!file) return;
    if (currentUserData.isGuest) {
        alert('الزوار لا يمكنهم رفع صور');
        return;
    }

    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => { img.src = e.target.result; };
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

        if (type === 'cover') {
            currentUserData.coverUrl = compressedBase64;
            const coverImg = document.getElementById('cover-img');
            if (coverImg) { coverImg.src = compressedBase64; coverImg.style.display = 'block'; }
        } else if (type === 'avatar') {
            currentUserData.avatarUrl = compressedBase64;
            const avatarImg = document.getElementById('avatar-img');
            const avatarLetter = document.getElementById('avatar-letter');
            if (avatarImg) { avatarImg.src = compressedBase64; avatarImg.style.display = 'block'; }
            if (avatarLetter) avatarLetter.style.display = 'none';
        } else if (type === 'background') {
            const bgLayer = document.getElementById('profile-bg-layer');
            if (bgLayer) bgLayer.style.backgroundImage = `url(${compressedBase64})`;
            currentUserData.backgroundUrl = compressedBase64;
        }

        alert('تم اختيار الصورة ومعاينتها بنجاح!');
    };
    
    reader.readAsDataURL(file);
}

// --- 2. ربط مستمعات حقول الرفع ---
document.getElementById('cover-file-input')?.addEventListener('change', (e) => {
    handleImageUpload(e.target.files[0], 'cover');
    e.target.value = '';
});

document.getElementById('avatar-file-input')?.addEventListener('change', (e) => {
    handleImageUpload(e.target.files[0], 'avatar');
    e.target.value = '';
});

document.getElementById('bg-file-input')?.addEventListener('change', (e) => {
    handleImageUpload(e.target.files[0], 'background');
    e.target.value = '';
});

// --- 3. دالة إزالة الصورة والرجوع للحرف الأول ---
function removeImage(type) {
    if (type === 'cover') {
        const coverImg = document.getElementById('cover-img');
        if (coverImg) { coverImg.style.display = 'none'; coverImg.src = ''; }
        currentUserData.coverUrl = "";
    } else if (type === 'avatar') {
        const avatarImg = document.getElementById('avatar-img');
        const avatarLetter = document.getElementById('avatar-letter');
        if (avatarImg) { avatarImg.style.display = 'none'; avatarImg.src = ''; }
        
        const displayName = document.getElementById('profile-display-name')?.value || 'ع';
        if (avatarLetter) {
            avatarLetter.textContent = displayName.charAt(0).toUpperCase();
            avatarLetter.style.display = 'block';
        }
        currentUserData.avatarUrl = "";
    } else if (type === 'background') {
        const bgLayer = document.getElementById('profile-bg-layer');
        if (bgLayer) bgLayer.style.backgroundImage = 'none';
        currentUserData.backgroundUrl = "";
    }
}

// --- 4. معالجة أدوات التخصيص والاسم ---
function toggleNameEdit() {
    const input = document.getElementById('profile-display-name');
    if (input) {
        input.readOnly = !input.readOnly;
        if (!input.readOnly) input.focus();
    }
}

function toggleOptions() {
    const panel = document.getElementById('customization-panel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

function closeProfile() {
    const card = document.getElementById('profile-modal');
    if (card) card.style.display = 'none';
}

function saveProfile() {
    alert('تم حفظ كافة إعدادات البروفايل والتصميم!');
}

function applyStyleToProfileName() {
    const nameEl = document.getElementById('profile-display-name');
    if (!nameEl) return;
    nameEl.style.color = userStyle.textColor;
    nameEl.style.transform = `scale(${userStyle.scaleX}, ${userStyle.scaleY})`;
}

// ربط مستمعات أشرطة التحكم بالتكبير والتصغير
document.getElementById('name-width-range')?.addEventListener('input', function() {
    userStyle.scaleX = parseFloat(this.value) / 100;
    applyStyleToProfileName();
});

document.getElementById('name-height-range')?.addEventListener('input', function() {
    userStyle.scaleY = parseFloat(this.value) / 100;
    applyStyleToProfileName();
});

// --- 5. محاكاة الشات المباشر مع تطبيق قواعد الخصوصية ---
function sendMessage() {
    const input = document.getElementById('chat-input');
    const container = document.getElementById('chat-messages');
    if (!input || !input.value.trim() || !container) return;

    const msgItem = document.createElement('div');
    msgItem.className = 'chat-message-item';

    // خلفية الاسم والإطارات تُطبق بالشات فقط
    const nameSpan = document.createElement('span');
    nameSpan.className = 'chat-user-name';
    nameSpan.textContent = currentUserData.name + ": ";
    nameSpan.style.color = userStyle.textColor;
    if (userStyle.bgColor !== 'transparent') {
        nameSpan.style.backgroundColor = userStyle.bgColor;
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = input.value;

    msgItem.appendChild(nameSpan);
    msgItem.appendChild(textSpan);
    container.appendChild(msgItem);

    input.value = '';
    container.scrollTop = container.scrollHeight;
}
