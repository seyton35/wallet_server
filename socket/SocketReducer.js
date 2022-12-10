const Request = require("../models/Request");

function SocketReducer(socket, data, cb) {
    switch (data.way) {
        case 'SUBSCRIBE_BY_ID':
            SUBSCRIBE_BY_ID(socket, data)
            break;
        case 'CHECK_YOUR_ISSUES':
            CHECK_YOUR_ISSUES(socket, data)
            break;
        case 'deleteAllIssues':
            deleteAllIssues()
            break;
        // default:
        //     break;
    }
}
exports.SocketReducer = SocketReducer

function SUBSCRIBE_BY_ID(socket, data) {
    socket.join(data.id)
    console.log(socket.rooms);
}

function CHECK_YOUR_ISSUES(socket, data) {
    socket.to(data.id).emit('/', data)
}

async function deleteAllIssues() {
    console.log('Request.deleteMany');
    await Request.deleteMany({})
}