const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // للسماح بالاتصال من أي مكان بدون مشاكل CORS
  }
});

// خدمة الملفات الثابتة (index.html, client.js, style.css)
app.use(express.static(path.join(__dirname)));

// إعداد الاتصال عبر Socket.io
io.on('connection', (socket) => {
  console.log('مستخدم جديد اتصل بالدردشة:', socket.id);

  // استقبال الرسائل وإعادة إرسالها للجميع
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('مستخدم غادر الدردشة:', socket.id);
  });
});

// تحديد المنفذ الممرر من Render تلقائياً والاستماع على 0.0.0.0
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
