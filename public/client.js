document.addEventListener('DOMContentLoaded', () => {

    const socket = io.connect();

    const loginContainer = document.getElementById('login-container');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username-input');
    const loginError = document.getElementById('login-error');

    const chatContainer = document.getElementById('chat-container');

    const messages = document.getElementById('messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');

    const createRoomForm = document.getElementById('create-room-form');
    const roomNameInput = document.getElementById('room-name-input');
    const roomPasswordInput = document.getElementById('room-password-input');

    const roomList = document.getElementById('room-list');
    const userList = document.getElementById('user-list');
    const userListTitle = document.getElementById('user-list-title');

    let currentUsername = "";
    let currentRoom = "Lobby";

    function addMessageToWindow(type, data) {
        const msgElement = document.createElement('div');
        msgElement.classList.add('message', type);

        let content = "";
        if (type === 'public') {
            content = `<span class="username">${data.user}:</span> ${data.message}`;
        } else if (type === 'system') {
            content = data.message;
        }

        msgElement.innerHTML = content;
        messages.appendChild(msgElement);
        messages.scrollTop = messages.scrollHeight;
    }

    function updateRoomListUI(rooms) {
        roomList.innerHTML = "";
        for (const roomName in rooms) {
            const room = rooms[roomName];
            const li = document.createElement('li');
            li.dataset.roomName = roomName;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'room-name';
            nameSpan.textContent = roomName;
            li.appendChild(nameSpan);

            const infoSpan = document.createElement('span');
            infoSpan.className = 'room-info';
            let infoText = `(${room.userCount}) `;
            if (room.hasPassword) {
                infoText += '🔒';
            } 
            infoSpan.textContent = infoText;
            li.appendChild(infoSpan);

            if (roomName !== currentRoom) {
                li.addEventListener('click', () => {
                    let password = "";
                    if (room.hasPassword) {
                        password = prompt('Enter password for room "${roomName}":');
                        if (password === null) return;
                    }
                    socket.emit('joinRoom', {
                        roomName: roomName,
                        password: password
                    });
                });
            } else {
                li.style.backgroundColor = '#e0e0e0';
            }
            roomList.appendChild(li);
        }
    }

    function updateUserListUI(users) {
        userList.innerHTML = "";
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user.username;
            userList.appendChild(li);
        });
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        if (username) {
            socket.emit('login', {
                username: username
            });
        }
    });

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (!message) return;

        socket.emit('sendMessage', {
            message: message
        });
        
        messageInput.value = "";
    });

    createRoomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const roomName = roomNameInput.value.trim();
        const password = roomPasswordInput.value.trim();
        if (roomName) {
            socket.emit('createRoom', {
                roomName: roomName,
                password: password
            });
            roomNameInput.value = "";
            roomPasswordInput.value = "";
        }
    });
    
    socket.on('loginSuccess', (data) => {
        loginContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        currentUsername = data.username;
        currentRoom = data.currentRoom;
        userListTitle.textContent = `Users in ${currentRoom}`;
        addMessageToWindow('system', {
            message: `Welcome, ${currentUsername}! You are in the ${currentRoom}.`
        });
    });

    socket.on('loginError', (message) => {
        loginError.textContent = message;
    });

    socket.on('newMessage', (data) => {
        addMessageToWindow('public', data);
    });

    socket.on('updateRoomList', (rooms) => {
        updateRoomListUI(rooms);
    });

    socket.on('updateUserList', (users) => {
        updateUserListUI(users);
    });

    socket.on('joinSuccess', (roomName) => {
        currentRoom = roomName;
        userListTitle.textContent = `Users in ${currentRoom}`;
        messages.innerHTML = "";
        addMessageToWindow('system', {
            message: `You have joined the room: ${roomName}`
        });
    });

    socket.on('roomError', (message) => {
        alert(message);
    });

});