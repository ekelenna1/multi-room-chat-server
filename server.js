const http = require('http');
const url = require('url');
const mime = require('mime');
const path = require('path');
const fs = require('fs');
const socketio = require('socket.io');

const users = {};
const rooms = {
    "Lobby": {
        creator: null,
        password: null,
        bannedUsers: []
    }
};

const server = http.createServer(function(req, resp) {
    const filename = path.join(__dirname, "public", url.parse(req.url).pathname);

    (fs.exists || path.exists)(filename, function(exists) {
        if (exists) {
            fs.readFile(filename, function(err, data) {
                if (err) {
                    resp.writeHead(500, {
                        "Content-Type": "text/plain"
                    });
                    resp.write("Internal server error: could not read file");
                    resp.end();
                    return;
                }
                const mimetype = mime.getType(filename);
                resp.writeHead(200, {
                    "Content-Type": mimetype
                });
                resp.write(data);
                resp.end();
                return;
            });
        } else {
            resp.writeHead(404, {
                "Content-Type": "text/plain"
            });
            resp.write("Requested file not found: " + filename);
            resp.end();
            return;
        }
    });
});

const io = socketio(server);
const socketServer = io;

function getUsersInRoom(roomName) {
    const usersInRoom = [];
    for (const socketId in users) {
        if (users[socketId].currentRoom === roomName) {
            usersInRoom.push(users[socketId].username);
        }
    }
    return usersInRoom;
}

function broadcastRoomList() {
    const roomListForClient = {};
    for (const roomName in rooms) {
        roomListForClient[roomName] = {
            userCount: getUsersInRoom(roomName).length,
            hasPassword: !!rooms[roomName].password
        };
    }
    socketServer.sockets.emit("updateRoomList", roomListForClient);
}

function broadcastUserList(roomName) {
    const usersInRoom = [];
    for (const socketId in users) {
        if (users[socketId].currentRoom === roomName) {
            usersInRoom.push({
                username: users[socketId].username
            });
        }
    }
    socketServer.to(roomName).emit("updateUserList", usersInRoom);
}

function handleJoinRoom(socket, roomName) {
    const user = users[socket.id];
    const oldRoom = user.currentRoom;

    socket.leave(oldRoom);

    socket.join(roomName);
    user.currentRoom = roomName;

    socket.emit("joinSuccess", roomName);

    broadcastUserList(oldRoom);
    broadcastUserList(roomName);

    broadcastRoomList();
}

socketServer.on("connection", function(socket) {

    socket.on('login', function(data) {
        const username = data.username.trim();

        let isTaken = false;
        for (const socketId in users) {
            if (users[socketId].username.toLowerCase() === username.toLowerCase()) {
                isTaken = true;
                break;
            }
        }

        if (isTaken) {
            socket.emit("loginError", "This username is already taken.");
            return;
        }

        users[socket.id] = {
            username: username,
            currentRoom: "Lobby"
        };

        socket.emit("loginSuccess", {
            username: username,
            currentRoom: "Lobby"
        });

        socket.join("Lobby");

        broadcastUserList("Lobby");
        broadcastRoomList();
    });

    socket.on('sendMessage', function(data) {
        const user = users[socket.id];
        if (!user) return;

        socketServer.to(user.currentRoom).emit("newMessage", {
            user: user.username,
            message: data.message
        });
    });

    socket.on('createRoom', function(data) {
        const roomName = data.roomName.trim();
        const password = data.password.trim() || null;
        const user = users[socket.id];

        if (!user) return;

        if (rooms[roomName]) {
            socket.emit("roomError", "A room with this name already exists.");
            return;
        }

        rooms[roomName] = {
            creator: socket.id,
            password: password,
            bannedUsers: []
        };

        handleJoinRoom(socket, roomName);
    });

    socket.on('joinRoom', function(data) {
        const roomName = data.roomName;
        const password = data.password || null;
        const user = users[socket.id];

        if (!user) return;
        if (!rooms[roomName]) {
            socket.commit("roomError", "This room does not exist.");
            return;
        }

        if (rooms[roomName].password && rooms[roomName].password !== password) {
            socket.emit("roomError", "Incorrect password.");
            return;
        }

        handleJoinRoom(socket, roomName);
    });

    socket.on('disconnect', function() {
        const user = users[socket.id];

        if (user) {
            const oldRoom = user.currentRoom;
            delete users[socket.id];

            broadcastUserList(oldRoom);
            broadcastRoomList();
        }
    });
});

server.listen(3456, function() {
    console.log("Server running at http://localhost:3456/");
});