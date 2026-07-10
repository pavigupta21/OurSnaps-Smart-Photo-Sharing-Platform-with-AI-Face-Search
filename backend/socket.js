let io = null;

const connectedUsers = new Map();

const setIO = (socketIO) => {
    io = socketIO;
};

const getIO = () => io;

module.exports = {
    setIO,
    getIO,
    connectedUsers
};