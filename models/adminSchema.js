const mongoose = require('mongoose')

const adminSchema = new mongoose
    .Schema({
        email: String,
        password: String
    },
        { timestamps: true })

const ADMIN = mongoose.model('ADMIN', adminSchema)
module.exports = ADMIN