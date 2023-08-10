const mongoose = require('mongoose')

const orderSchema = mongoose.Schema({
    about_book: {
        type: [mongoose.Schema.Types.Mixed]
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'USER'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Done'],
        default: 'Pending'
    }
})

const ORDER = mongoose.model('ORDER', orderSchema)
module.exports = ORDER