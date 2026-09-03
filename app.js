let currentUser = '';
let currentRoom = 'general';

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const roomSelect = document.getElementById('room-select');
const roomName = document.getElementById('room-name');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');

async function joinChat() {
    const username = usernameInput.value.trim();
    const room = roomSelect.value;
    
    if (!username) {
        alert('⚠️ اكتب اسمك أولاً');
        return;
    }
    
    currentUser = username;
    currentRoom = room;
    roomName.textContent = room === 'general' ? 'الروم العام' : 'روم ' + room;
    
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
    
    await loadMessages();
    subscribeToMessages();
    
    await supabase
        .from('message')
        .insert([{ username: 'النظام', message: `🌟 ${username} دخل إلى الغرفة` }]);
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (text && currentUser) {
        await supabase
            .from('message')
            .insert([{ username: currentUser, message: text }]);
        messageInput.value = '';
    }
}

async function loadMessages() {
    const { data, error } = await supabase
        .from('message')
        .select('*')
        .order('id', { ascending: true })
        .limit(100);
    
    if (data) {
        messagesDiv.innerHTML = '';
        data.forEach(msg => addMessageToScreen(msg));
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

function subscribeToMessages() {
    supabase
        .channel('public:message')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'message' }, 
            (payload) => {
                addMessageToScreen(payload.new);
            }
        )
        .subscribe();
}

function addMessageToScreen(msg) {
    const div = document.createElement('div');
    
    if (msg.username === 'النظام') {
        div.className = 'message';
        div.style.borderRight = '3px solid #4ade80';
        div.style.background = 'rgba(74, 222, 128, 0.1)';
        div.innerHTML = `
            <div class="username" style="color: #4ade80;">${msg.username}</div>
            <div class="text">${msg.message}</div>
            <div class="time">${new Date(msg.created_at).toLocaleTimeString('ar')}</div>
        `;
    } else {
        div.className = 'message';
        div.innerHTML = `
            <div class="username">${msg.username}</div>
            <div class="text">${msg.message}</div>
            <div class="time">${new Date(msg.created_at).toLocaleTimeString('ar')}</div>
        `;
    }
    
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

async function leaveChat() {
    if (currentUser) {
        await supabase
            .from('message')
            .insert([{ username: 'النظام', message: `👋 ${currentUser} غادر الغرفة` }]);
    }
    
    currentUser = '';
    chatScreen.style.display = 'none';
    loginScreen.style.display = 'flex';
}
