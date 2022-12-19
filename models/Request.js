const mongoose = require('mongoose')

const Request = new mongoose.Schema({
    status: { type: String, required: true, default: 'active' },
    type: { type: String, required: true },
    sender: {
        id: { type: String, required: true },
        number: { type: Number, required: true },
        sum: { type: Number, required: true },
        currency: { type: String, required: true },
    },
    receiver: {
        id: { type: String, required: true },
        number: { type: Number, required: true },
        sum: { type: Number, },
        currency: { type: String, },
    },
    registerDate: { type: Date, default: Date.now, required: true },
    paymentDate: { type: Date, default: null },
    comment: { type: String, },
})

module.exports = mongoose.model('Request', Request)