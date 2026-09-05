const AGORA_APP_ID = 'c0613e123a9f42efa9e899634123435e';
const TOKEN_SERVER_URL = 'https://global-chat-1-2pss.onrender.com/token';

let agoraClient = null;
let localAudioTrack = null;
let joinedMicNumber = null;

function loadAgoraSDK() {
    return new Promise((resolve, reject) => {
        if (window.AgoraRTC) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.22.0.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Agora SDK'));
        document.head.appendChild(script);
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
        await loadAgoraSDK();
        
        const response = await fetch(TOKEN_SERVER_URL);
        const data = await response.json();
        const token = data.token;
        
        agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        await agoraClient.join(AGORA_APP_ID, 'qamar-chat', token, null);
        
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await agoraClient.publish([localAudioTrack]);
        
        joinedMicNumber = micNumber;
        
        await db.collection('mics').doc('mic' + micNumber).set({
            micNumber: micNumber,
            userId: currentUser,
            username: currentUserData.username,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const micEl = document.getElementById('mic' + micNumber);
        micEl.classList.add('taken');
        micEl.textContent = currentUserData.username.charAt(0);
        
        alert('✅ انضممت للمايك ' + micNumber);
        
        agoraClient.on('user-published', async (user, mediaType) => {
            if (mediaType === 'audio') {
                await agoraClient.subscribe(user, mediaType);
                user.audioTrack.play();
            }
        });
        
    } catch (err) {
        alert('❌ خطأ: ' + err.message);
    }
}

async function leaveMic() {
    if (!joinedMicNumber) return;
    
    try {
        if (localAudioTrack) {
            localAudioTrack.close();
            localAudioTrack = null;
        }
        if (agoraClient) {
            await agoraClient.leave();
            agoraClient = null;
        }
        
        await db.collection('mics').doc('mic' + joinedMicNumber).delete();
        
        const micEl = document.getElementById('mic' + joinedMicNumber);
        micEl.classList.remove('taken');
        micEl.textContent = '🎙️';
        
        alert('غادرت المايك');
        joinedMicNumber = null;
    } catch (err) {
        alert('❌ خطأ: ' + err.message);
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
        });
    });
}

const originalEnterChat = window.enterChat;
window.enterChat = function() {
    if (originalEnterChat) originalEnterChat();
    setTimeout(() => {
        listenForMics();
    }, 1000);
};
