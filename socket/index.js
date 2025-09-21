// const { Server } = require("socket.io");
// const jwt = require("jsonwebtoken");
// const Message = require("../models");
// const User = require("../models");

// function setupSockets(server) {
//   const io = new Server(server, { cors: { origin: "*" } });

//   // Auth middleware for socket
//   io.use((socket, next) => {
//     const token = socket.handshake.auth?.token;
//     if (!token) return next(new Error("No token"));

//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       socket.user = decoded; // { id, email }
//       next();
//     } catch (err) {
//       next(new Error("Invalid token"));
//     }
//   });

//   io.on("connection", (socket) => {
//     console.log("User connected:", socket.user.email);

//     // Join personal room (for private messages)
//     socket.join(`user_${socket.user.id}`);

//     // Send message
//     socket.on("chatMessage", async ({ to, content }) => {
//       if (!to || !content) return;

//       const msg = await Message.create({
//         senderId: socket.user.id,
//         receiverId: to,
//         content
//       });

//       // Emit to receiver room
//       io.to(`user_${to}`).emit("chatMessage", msg);

//       // Also emit back to sender
//       socket.emit("chatMessage", msg);
//     });

//     socket.on("disconnect", () => {
//       console.log("User disconnected:", socket.user.email);
//     });
//   });

//   return io;
// }

// module.exports = setupSockets;


const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

function setupSockets(server) {
  const io = new Server(server, { cors: { origin: "*" } });

  // Authenticate socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, email }
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.user.email);

    // Join a room specific to the user
    socket.join(`user_${socket.user.id}`);

    // Listen for chat messages
    socket.on("chatMessage", ({ to, content }) => {
      if (!to || !content) return;

      const msg = {
        senderId: socket.user.id,
        receiverId: to,
        content,
        timestamp: new Date(),
      };

      // Send to receiver
      io.to(`user_${to}`).emit("chatMessage", msg);

      // Send back to sender too
      socket.emit("chatMessage", msg);
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.user.email);
    });
  });

  return io;
}

module.exports = setupSockets;

