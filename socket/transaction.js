export function transaction (socket) {
    return socket.on('MONEY_REQUEST/get', (data, cb) => {
        console.log(data)
        cb
    })
}