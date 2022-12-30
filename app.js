const express = require('express')
const app = express()
const server = require('http').createServer(app)
const { Server } = require('socket.io')

const io = new Server(server)


const config = require('config')
const mongoose = require('mongoose')

const auth = require('./routes/auth.routes')
const transaction = require('./routes/transaction.routes')
const dataBase = require('./routes/dataBase.routes')


const PORT = config.get('port') || 5000

app.use(express.json())

// app.use(express.urlencoded({ extended: false }))

app.use('/api/auth', auth)
app.use('/api/transaction', transaction)
app.use('/api/dataBase', dataBase)

app.post('/', (req, res) => {
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
        io.on('connection', (socket) => {
            console.log('user ', socket.id, ' connected');

            socket.on('TEST', (data, cb) => {
                console.log(data);
                cb(data.split("").reverse().join(""))
            })
            socket.on('TEST2', () => {
                console.log('emit to id');
                socket.to('6384edf6445b37df2373a9fa').emit('/',
                    {
                        way: 'CHECK_YOUR_ISSUES',
                        id: '6384edf6445b37df2373a9fa'
                    })
            })

            socket.on('/', (data, cb) => {
                SocketReducer(socket, data, cb)
            })

            // transaction(socket)
            return socket.on('MONEY_REQUEST:get', (data, cb) => {
                console.log(data)
                cb
            })

        })

        await mongoose.connect(config.get('DB_URL'))

        server.listen(PORT, () => console.log(`App has been started on port ${PORT}`))
    } catch (e) {
        console.log("Server error", e.message);
        process.exit()
    }
}

const axios = require('axios');
const { SocketReducer } = require('./socket/SocketReducer')
const flag = true

if (flag) {
    start()
} else axi()



async function axi() {
    try {
        const res = await axios.post(
            'http://192.168.31.254:3000/',
            { num: 5 },
        )
        if (res.status == 200) console.log('status 200');
        else console.log('wrong status')
        console.log(res.data)
    } catch (e) {
        console.error('e.response.data.message');
        console.error(e.response.data.message);
    }
}