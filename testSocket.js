import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

// Connect to WebSocket
socket.on("connect", () => {
  console.log("Connected to WebSocket:", socket.id);

  // Send a test message
  socket.emit("sendMessage", {
    senderId: "65d1e77e987a12a3b2a68c56",
    receiverId: "65d1e791ad89a12f2c97e74c",
    message: "Hello from socket.io client!",
  });
});

// Listen for messages
socket.on("receiveMessage", (data) => {
  console.log("New message received:", data);
});
