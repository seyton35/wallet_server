const mongoose = require('mongoose')

const Currency = new mongoose.Schema({
    ownerId: { type: String, required: true },
    type: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    registerDate: { type: Date, default: Date.now, required: true },
})

module.exports = mongoose.model('Currency', Currency)