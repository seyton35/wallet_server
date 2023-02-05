const express = require('express')
const app = express()
const server = require('http').createServer(app)


const admin = require('firebase-admin')
const serviceAccount = require('./config/firebase_key/serviceAccountKey.json')

const config = require('config')

const auth = require('./routes/auth.routes')
const transaction = require('./routes/transaction.routes')
const dataBase = require('./routes/dataBase.routes')
const operationsOnUserConfig = require('./routes/operationsOnUserConfig.routes')
const operationsOnCurrencyAccounts = require('./routes/operationsOnCurrencyAccounts.routes')

const PORT = config.get('port') || 5000

app.use(express.json())

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
app.use((req, res, next) => {
    const firestore = admin.firestore()
    req.firestore = {
        Transaction: firestore.collection("transactions"),
        CurrencyAccounts: firestore.collection("currencyAccounts"),
        Users: firestore.collection("users"),
        UserConfig: firestore.collection("userConfig"),
        WalletConfig: firestore.collection("walletConfig"),
        DeletedUsers: firestore.collection("deletedUsers")
    }
    req.firestore.messaging = admin.messaging()
    return next()
})


app.use('/api/auth', auth)
app.use('/api/transaction', transaction)
app.use('/api/dataBase', dataBase)
app.use('/api/operationsOnUserConfig', operationsOnUserConfig)
app.use('/api/operationsOnCurrencyAccounts', operationsOnCurrencyAccounts)

app.get('/', (req, res) => {
    try {
        res.json({
            message: 'from .../'
        })
    } catch (e) {
        console.log(e);
    }
})
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
        console.log();
        server.listen(PORT, () => console.log(`App has been started on port ${PORT}`))
    } catch (e) {
        console.log("Server error:", e.message);
        process.exit()
    }
}

start()