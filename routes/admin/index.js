const express = require('express')
const router = express.Router()
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

const { registerAdmin, loginAdmin, createBook, findAllBooks, findBookById, updateBookById, deleteBookById, getaAllUsers, createBookGenre, getAllOrders, getAllPaymentList, bookGenreStatus, getAllGenres } = require('../../controllers/adminController')
const ADMIN = require('../../models/adminSchema')


// ====================================== PASSPORT LOCAL STRATEGY ===========================================
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
    try {
        const admin = await ADMIN.findById(id);

        if (admin) {
            return done(null, admin)
        }
    } catch (error) {
        return done(error, false)
    }
});

passport.use(new LocalStrategy({
    usernameField: 'email'
},
    async function (username, password, done) {
        try {
            const admin = await ADMIN.findOne({ email: username })
            const bcryptedPass = await bcrypt.compare(password, admin.password)
            if (!admin) return done(null, false)
            if (!bcryptedPass) return done(null, false)
            if (admin) return done(null, admin)
        } catch (error) {
            return done(error, false)
        }
    }
))

router.use(passport.initialize())
router.use(passport.session())


router.post('/register', registerAdmin)
router.post('/login', passport.authenticate('local'), loginAdmin)

// ========================================= BOOKS API ========================================= //
router.post('/create-book', createBook)
router.post('/genre', createBookGenre)
router.get('/find-all-books', findAllBooks)
router.get('/find-book/:id', findBookById)
router.put('/update-book/:id', updateBookById)
router.delete('/delete-book/:id', deleteBookById)
router.post('/genre-status', bookGenreStatus)
// router.get('/all-genre', getAllGenres)

// ========================================= USERS API ========================================= //
router.get('/all-users', getaAllUsers)


router.get('/all-orders', getAllOrders)


router.get('/payment-list', getAllPaymentList)
module.exports = router