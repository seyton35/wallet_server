const express = require('express')
const app = express()
const server = require('http').createServer(app)
const { Server } = require('socket.io')

const io = new Server(server)

const admin = require('firebase-admin')
const serviceAccount = require('./config/firebase_key/serviceAccountKey.json')

const config = require('config')

const auth = require('./routes/auth.routes')
const transaction = require('./routes/transaction.routes')
const dataBase = require('./routes/dataBase.routes')

const SocketReducer = require('./socket/SocketReducer.js')

const PORT = config.get('port') || 5000

app.use(express.json())
app.use((req, res, next) => {
    req.io = io
    return next()
})



admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
app.use((req, res, next) => {
    const firestore = admin.firestore()
    req.firestore = {
        Transaction: firestore.collection("transactions"),
        CurrencyAccounts: firestore.collection("currencyAccounts"),
        Users: firestore.collection("users")
    }
    req.firestore.messaging = admin.messaging()
    return next()
})



// app.use(express.urlencoded({ extended: false }))

app.use('/api/auth', auth)
app.use('/api/transaction', transaction)
app.use('/api/dataBase', dataBase)

app.get('/', (req, res) => {
    try {
        res.json({
            message: 'from .../'
        })
    } catch (e) {
        console.log(e);
    }
})

async function start() {
    try {
        // io.on('connection', (socket) => {
        //     console.log('user ', socket.id, ' connected');

        //     socket.on('TEST', (data, cb) => {
        //         console.log(data);
        //         cb(data.split("").reverse().join(""))
        //     })
        //     socket.on('TEST2', () => {
        //         console.log('emit to id');
        //         socket.to('6384edf6445b37df2373a9fa').emit('/',
        //             {
        //                 way: 'CHECK_YOUR_ISSUES',
        //                 id: '6384edf6445b37df2373a9fa'
        //             })
        //     })

        //     socket.on('/', (data, cb) => {
        //         SocketReducer(socket, data, cb)
        //     })

        //     // transaction(socket)
        //     return socket.on('MONEY_REQUEST:get', (data, cb) => {
        //         console.log(data)
        //         cb
        //     })

        // })

        server.listen(PORT, () => console.log(`App has been started on port ${PORT}`))
    } catch (e) {
        console.log("Server error:", e.message);
        process.exit()
    }
}

start()