const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Types.ObjectId,
        ref: "BOOK"
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "USER"
    },
    quntity: {
        type: Number
    }
})

const CART = mongoose.model('CART', cartSchema)
module.exports = CART