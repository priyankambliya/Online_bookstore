require('dotenv').config();
require('./config/db')
const express = require('express')
const session = require('express-session')
var cookieParser = require('cookie-parser')
const multer = require('multer')

const app = express()

const routes = require('./routes/index')

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {  // do not use file name that contain ":"(colon) in name
        cb(null, new Date().getTime() + '_' + file.originalname);
    }

})

app.use(multer({ storage: fileStorage }).single('image'))

app.use(express.static('public'))
app.use('/images', express.static(__dirname + '/images'));

app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.json())
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
}))
app.use('/api', routes)

app.listen(process.env.PORT, () => {
    console.log(`Server running on port : ${process.env.PORT}`)
})