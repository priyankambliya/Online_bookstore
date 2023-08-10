const mongoose = require('mongoose')

const ratingSchema = mongoose.Schema({
    rating: {
        type: Number,
        default: 0
    },
    review: {
        type: String
    },
    bookId: {
        type: mongoose.Types.ObjectId,
        ref: 'BOOK'
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'USER'
    }
})

const RATING = mongoose.model('RATING', ratingSchema)
module.exports = RATING