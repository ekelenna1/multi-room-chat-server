document.addEventListener('DOMContentLoaded', () => {

    const socket = io.connect();

    const loginContainer = document.getElementById('login-container');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username-input');
    const loginError = document.getElementById('login-error');

    const chatContainer = document.getElementById('chat-container');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        if (username) {
            socket.emit('login', {
                username: username
            });
        }
    });

    socket.on('loginSuccess', (data) => {
        loginContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
    });

    socket.on('loginError', (message) => {
        loginError.textContent = message;
    });

});