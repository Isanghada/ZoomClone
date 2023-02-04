import http from "http";
// import WebSocket from "ws";
// import { Server } from "socket.io";
// import { instrument } from "@socket.io/admin-ui";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(3000, handleListen);

let users = {};

let socketToRoom = {};

const maximum = 4;

wsServer.on("connection", (socket) => {
  socket.on("join_room", ({ roomName, username, nickname }) => {
    if (users[roomName]) {
      const length = users[roomName].length;
      if (length == maximum) {
        socket.emit("room_full");
        return;
      }
      users[roomName].push({ id: socket.id, user: username });
    } else {
      users[roomName] = [{ id: socket.id, user: username }];
    }
    socketToRoom[socket.id] = roomName;

    socket.join(roomName);

    socket.to(roomName).emit("welcome", socket.id, { username, nickname });
  });
  socket.on("offer", (offer, socketId, roomName, userInfo) => {
    socket.to(socketId).emit("offer", offer, socket.id, userInfo);
  });
  socket.on("answer", (answer, socketId, roomName) => {
    socket.to(socketId).emit("answer", answer, socket.id);
  });
  socket.on("ice", (ice, socketId, roomName) => {
    socket.to(socketId).emit("ice", ice, socket.id);
  });

  socket.on("disconnect", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    delete socketToRoom[socket.id];
    socket.leave(roomID);
    if (room) {
      room = room.filter((user) => user.id !== socket.id);
      users[roomID] = room;
      if (room.length === 0) {
        delete users[roomID];
        return;
      }
    }
    socket.to(roomID).emit("user_exit", { id: socket.id });
  });
});
