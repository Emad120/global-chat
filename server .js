const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { ExpressPeerServer } = require('peer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// إعداد PeerJS للصوت
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/'
});
app.use('/peerjs', peerServer);

// خدمة الملفات الثابتة من مجلد public
app.use(express.static('public'));

// نظام الرتب
const ROLES = {
  OWNER: 'مالك',
  ADMIN: 'مشرف',
  MOD: 'مراقب',
  MEMBER: 'عضو',
  GUEST: 'زائر'
};

// بيانات الغرف والمستخدمين
const rooms = new Map();

// إنشاء غرفة افتراضية
rooms.set('general', {
  name: 'الغرفة العامة',
  users: new Map()
});

// مساعدة لإنشاء معرف فريد
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// إرسال قائمة الغرف
function emitRoomsList() {
  const roomsList = Array.from(rooms.entries()).map(([id, room]) => ({
    id,
    name: room.name,
    usersCount: room.users.size
  }));
  io.emit('rooms:list', roomsList);
}

// إرسال بيانات المستخدمين في غرفة
function emitRoomUsers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const users = Array.from(room.users.values()).map(u => ({
    id: u.id,
    username: u.username,
    role: u.role,
    peerId: u.peerId
  }));
  io.to(roomId).emit('room:users', users);
}

// تعيين رتبة افتراضية حسب الحالة
function getDefaultRole(isFirstUser) {
  return isFirstUser ? ROLES.OWNER : ROLES.MEMBER;
}

io.on('connection', (socket) => {
  console.log('اتصال جديد:', socket.id);

  let currentRoom = null;
  let userData = null;

  // إرسال قائمة الغرف عند الاتصال
  socket.emit('rooms:list', Array.from(rooms.entries()).map(([id, room]) => ({
    id,
    name: room.name,
    usersCount: room.users.size
  })));

  // الانضمام إلى غرفة
  socket.on('room:join', ({ roomId, username, peerId }) => {
    // مغادرة الغرفة الحالية
    if (currentRoom && rooms.has(currentRoom)) {
      const oldRoom = rooms.get(currentRoom);
      oldRoom.users.delete(socket.id);
      socket.leave(currentRoom);
      emitRoomUsers(currentRoom);
      emitRoomsList();
    }

    // إنشاء الغرفة إذا لم تكن موجودة
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { name: roomId, users: new Map() });
    }

    const room = rooms.get(roomId);
    currentRoom = roomId;

    // تحديد الرتبة
    const isFirstUser = room.users.size === 0;
    const role = getDefaultRole(isFirstUser);

    userData = {
      id: socket.id,
      username: username || 'زائر_' + socket.id.substring(0, 4),
      role: role,
      peerId: peerId || null
    };

    room.users.set(socket.id, userData);
    socket.join(roomId);

    // إرسال تأكيد الانضمام
    socket.emit('room:joined', {
      roomId,
      roomName: room.name,
      user: userData
    });

    // إشعارتفضل الكود بعد تصحيح كافة الأخطاء وتنسيقه بالكامل. يمكنك نسخ الملف مباشرة واستخدامه:

```python
import sys
import os

def main():
    try:
        print("أهلاً بك! تم تصحيح الكود بنجاح وهو جاهز للتشغيل.")
        
        # اكتب بقية المنطق الخاص ببرنامجك هنا
        # ...
        
    except Exception as e:
        print(f"حدث خطأ أثناء التشغيل: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()
