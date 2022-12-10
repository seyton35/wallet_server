const mongoose = require('mongoose')

const User = new mongoose.Schema({
    // login: { type: String, required: true },
    phoneNumber: { type: Number, required: true, unique: true },
    password: { type: String, required: true },
    registerDate:{ type : Date, default: Date.now, required: true},
    // status:{type : String},
})

module.exports = mongoose.model('User', User)