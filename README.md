# Real-Time Multi-Room Chat Application

### Overview
This is a lightweight, event-driven chat server built with **Node.js** and **Socket.IO**. It enables real-time, bi-directional communication between multiple clients, featuring dynamic room creation, private messaging, and robust administrative controls for room owners.


### Technologies Used
* **Backend:** Node.js, Socket.IO
* **Frontend:** HTML5, CSS3, JavaScript (Client-side Socket.IO)
* **Protocol:** WebSockets (Event-based architecture)

### Key Features
* **Real-Time Communication:** Instant message delivery using WebSockets (Socket.IO) with fallback to HTTP polling.
* **Dynamic Room Management:**
    * Users can create public or **password-protected** private rooms.
    * Room creators are granted admin privileges to **Kick** or **Ban** disruptive users.
* **Advanced Messaging:**
    * **Private Direct Messages:** Users can send confidential messages using the `/pm <username>` command.
    * **@Mentions:** The server parses messages for `@username` tags and highlights them for the recipient.
* **User Experience (UX) Enhancements:**
    * **Typing Indicators:** Real-time feedback when other users are typing.
    * **Live User Lists:** The sidebar updates instantly to show who is currently in the room.



**Project Structure**
   * **server.js:** The core Node.js application handling socket events, room logic, and file serving.

   * **client.js:** Frontend logic for listening to server events and updating the DOM.

   * **style.css:** Custom styling for the chat interface, including specific styles for admin controls and mentions.

### How to Run:
Clone the repository.

Install dependencies:

Bash

npm install socket.io mime
Start the server:

Bash

node server.js
Open your browser and visit: http://localhost:3456 (Open multiple tabs to simulate different users)


### Highlight: Private Messaging Logic
The application handles private routing by mapping usernames to their specific Socket IDs. It also handles edge cases, such as preventing users from messaging themselves or non-existent users.

```javascript
// server.js - Handling Private Messages
socket.on('sendPrivateMessage', function(data) {
    const targetSocketId = findSocketIdByUsername(sender.currentRoom, data.targetUsername);

    if (targetSocketId) {
        // Emit only to the specific socket ID
        socketServer.to(targetSocketId).emit("newPrivateMessage", {
            from: sender.username,
            message: data.message
        });
    }
});

