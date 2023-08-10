const mongoose = require('mongoose')

mongoose.connect(process.env.CONNECTION_URL)
    .then(() => {
        console.log('databse connection established...')
    })
    .catch((error) => {
        console.log(error.message)
    })