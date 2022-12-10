const mongoose = require('mongoose')

const Request = new mongoose.Schema({
    status: { type: String, required: true, default: 'waiting' },
    sum: { type: Number, required: true },
    currency: { type: String, required: true },
    // sender: { type: Number, required: true },
    // receiver:{type:Number, required:true},
    sender: {
        id: { type: String, required: true },
        phoneNumber: { type: Number, required: true },
    },
    receiver: {
        id: { type: String, required: true },
        phoneNumber: { type: Number, required: true },
    },
    registerDate: { type: Date, default: Date.now, required: true },
    comment: { type: String, },
})

module.exports = mongoose.model('Request', Request)