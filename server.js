const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('.'));

const rooms = new Map();
const users = new Map();

io.on('connection', (socket) => {
    console.log('مستخدم دخل:', socket.id);

    socket.on('join', (data) => {
        const { username, room } = data;
        socket.join(room);
        
        if (!rooms.has(room)) {
            rooms.set(room, new Set());
        }
        rooms.get(room).add(socket.id);
        
        users.set(socket.id, { username, room });
        
        socket.to(room).emit('message', {
            username: 'النظام',
            text: `${username} انضم للغرفة`,
            time: new Date().toLocaleTimeString('ar')
        });
        
        socket.emit('joined', { room, username });
        
        const roomUsers = Array.from(rooms.get(room)).map(id => users.get(id)?.username);
        io.to(room).emit('users', roomUsers);
    });

    socket.on('chat', (data) => {
        const user = users.get(socket.id);
        if (user) {
            io.to(user.room).emit('message', {
                username: user.username,
                text: data.text,
                time: new Date().toLocaleTimeString('ar')
            });
        }
    });

    socket.on('disconnect', () => {
        const user = users.get(socket.id);
        if (user && rooms.has(user.room)) {
            rooms.get(user.room).delete(socket.id);
            socket.to(user.room).emit('message', {
                username: 'النظام',
                text: `${user.username} غادر الغرفة`,
                time: new Date().toLocaleTimeString('ar')
            });
            const roomUsers = Array.from(rooms.get(user.room)).map(id => users.get(id)?.username);
            io.to(user.room).emit('users', roomUsers);
        }
        users.delete(socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`الشات شغال على ${PORT}`);
});
