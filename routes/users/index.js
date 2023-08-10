const express = require('express')
const { createUser, otpVerification, userLogin, findAllAvailableBooks, addToCart, getCartDetailByLoginUser, viewratingByBook, removeToCart, updateProfile, viewOrderDetail, viewProfile, makeOrder, ratingBooks, payment, recommandBooks, updateRecommandation, findAllRecommandation, getAllGenres, updateratingsByUser } = require('../../controllers/userControllers')
const router = express.Router()

const jwtAuth = require('../../middleware/jwtAuth')

router.post('/create', createUser)
router.post('/otp', otpVerification)
router.post('/login', userLogin)
router.get('/all-books', jwtAuth, findAllAvailableBooks)

router.post('/add-cart', jwtAuth, addToCart)
router.post('/remove-cart', jwtAuth, removeToCart)
router.get('/show-cart', jwtAuth, getCartDetailByLoginUser)

router.put('/update', jwtAuth, updateProfile)
router.get('/profile', jwtAuth, viewProfile)
router.get('/order', jwtAuth, makeOrder)
router.get('/view-order', jwtAuth, viewOrderDetail)
router.post('/payment', jwtAuth, payment)
router.post('/view-rating', jwtAuth, viewratingByBook)
router.post('/recommand', jwtAuth, recommandBooks)

router.post('/update-recommandation', jwtAuth, updateRecommandation)
router.get('/all-recommandation', jwtAuth, findAllRecommandation)
router.get('/all-genre', jwtAuth, getAllGenres)

router.post('/rating', jwtAuth, ratingBooks)

router.put('/update-rating', jwtAuth, updateratingsByUser)

module.exports = router