const mongoose = require('mongoose')

const bookSchema = new mongoose
    .Schema({
        title: String,
        author: String,
        genre: {
            type: mongoose.Types.ObjectId,
            ref: 'GENRE'
        },
        image: {
            type: String,
            get: (image) => image ? `http://localhost:4000/images/${image}` : null
        },
        price: {
            type: String
        },
        numbersOfBooks: {
            type: Number
        },
        ratingId: {
            type: mongoose.Types.ObjectId,
            ref: 'RATING'
        },
        status: {
            type: String,
            enum: ['Available', 'Unavailable'],
            default: 'Unavailable'
        }
    },
        { timestamps: true })

const BOOK = mongoose.model('BOOK', bookSchema)
module.exports = BOOK