let peer = null;
let myStream = null;
let joinedMicNumber = null;
let activeCalls = {};
let myPeerId = null;

function initPeer() {
    if (peer) return;
    
    peer = new Peer();
    
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
            alert('📢 استقبلت صوت!');
        });
        
        activeCalls[call.peer] = call;
    });
    
    peer.on('error', (err) => {
        console.error('PeerJS Error:', err.message);
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
        
        const micEl = document.getElementById('mic' + micNumber);
        micEl.classList.add('taken');
        micEl.textContent = currentUserData.username.charAt(0);
        
        alert('✅ انضممت للمايك ' + micNumber);
        
        // اتصل بكل المايكات الأخرى
        setTimeout(async () => {
            const micsSnapshot = await db.collection('mics').get();
            micsSnapshot.forEach((doc) => {
                const micData = doc.data();
                if (micData.userId !== currentUser && micData.peerId && micData.peerId !== 'pending') {
                    connectToPeer(micData.peerId);
                }
            });
        }, 3000);
        
    } catch (err) {
        alert('❌ خطأ: ' + err.message);
    }
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
            alert('📢 استقبلت صوت!');
        });
        
        activeCalls[remotePeerId] = call;
    } catch (err) {
        console.error('Call Error:', err);
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
            
            if (micData.userId !== currentUser && micData.peerId && micData.peerId !== 'pending') {
                setTimeout(() => {
                    connectToPeer(micData.peerId);
                }, 3000);
            }
        });
    });
}

const originalEnterChat = window.enterChat;
window.enterChat = function() {
    if (originalEnterChat) originalEnterChat();
    setTimeout(() => {
        initPeer();
        listenForMics();
    }, 2000);
};
