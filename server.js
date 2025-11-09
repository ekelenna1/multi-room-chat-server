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

const io = socketio(http, {
    wsEngine: 'ws'
});
const socketServer = io.listen(server);

socketServer.sockets.on("connection", function(socket) {

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
    });

    socket.on('sendMessage', function(data) {
        const user = users[socket.id];
        if (!user) return;

        socketServer.to(user.currentRoom).emit("newMessage", {
            user: user.username,
            message: data.message
        });
    });
});

server.listen(3456, function() {
    console.log("Server running at http://localhost:3456/");
});