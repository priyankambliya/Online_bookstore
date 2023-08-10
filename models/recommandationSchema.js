const mongoose = require('mongoose')

const recommandationSchema = new mongoose.Schema({
    recommandId: {
        type: [mongoose.Types.ObjectId],
        value: []
    },
    userId: {
        type: String
    }
})

const RECOMMAND = mongoose.model('RECOMMAND', recommandationSchema)
module.exports = RECOMMAND