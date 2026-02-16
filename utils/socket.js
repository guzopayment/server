// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("newBooking", (data) => {
    io.emit("bookingAdded", data);
  });
});

server.listen(5000, () => console.log("Server running on 5000"));
