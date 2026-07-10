const express = require("express");
const cors = require("cors");
require("dotenv").config();
const http = require("http");

const app = express();

const server = http.createServer(app);

const AuthRoutes = require("./routes/AuthRoutes");
const AlbumRoutes = require("./routes/AlbumRoutes");
const FaceSearchRoutes = require("./routes/FaceSearchRoutes");

const {setIO,connectedUsers} = require("./socket");
const { emitToAlbum } = require("./socketEvents");

app.use(cors());

app.use(express.json({
  limit: "2mb"
}));

app.use("/api/auth", AuthRoutes);
app.use("/api/albums", AlbumRoutes);
app.use("/api/face-search", FaceSearchRoutes);
const { getIO } = require("./socket");

app.post("/internal/face-index-ready", (req, res) => {

    const { albumId } = req.body;
    getIO().emit("faceIndexReady", {
        albumId
    });
    res.json({
        success: true
    });

});

app.post("/internal/photo-indexed", (req, res) => {

    const { albumId, photoId } = req.body;

    getIO().emit("photoIndexed", {
        albumId,
        photoId
    });

    res.json({
        success: true
    });

});

app.get("/", (req, res) => {
    res.json({
        message: "Event Photo Retrieval Backend Running"
    });
});

const PORT = 5000;

const { Server } = require("socket.io");

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});
setIO(io);
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


io.on("connection", (socket) => {
    socket.on("joinAlbum", ({ albumId }) => {

    socket.join(`album_${albumId}`);
    console.log(socket.rooms);

    console.log(
        `Socket ${socket.id} joined album_${albumId}`
    );

});

socket.on("leaveAlbum", ({ albumId }) => {

    socket.leave(`album_${albumId}`);

    console.log(
        `Socket ${socket.id} left album_${albumId}`
    );

});

    console.log("User connected:", socket.id);

    socket.on("registerUser", ({ userId }) => {

        connectedUsers.set(userId, socket.id);

        console.log(
            "Registered:",
            userId,
            socket.id
        );

    });
    socket.on("disconnect", () => {

        for (const [userId, socketId] of connectedUsers.entries()) {

            if (socketId === socket.id) {

                connectedUsers.delete(userId);
                break;

            }
        }

        console.log("Disconnected:", socket.id);

    });

});