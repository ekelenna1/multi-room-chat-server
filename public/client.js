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

    function addMessageToWindow(type, data) {
        const msgElement = document.createElement('div');
        msgElement.classList.add('message', type);

        let content = "";
        if (type === 'public') {
            content = `<span class="username">${data.user}:</span> ${data.message}`;
        }

        msgElement.innerHTML = content;
        messages.appendChild(msgElement);
        messages.scrollTop = messages.scrollHeight;
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

    socket.on('loginSuccess', (data) => {
        loginContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
    });

    socket.on('loginError', (message) => {
        loginError.textContent = message;
    });

    socket.on('newMessage', (data) => {
        addMessageToWindow('public', data);
    });

});