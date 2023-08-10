const ADMIN = require('../models/adminSchema')
const GENRE = require('../models/bookGenreSchema')
const BOOK = require('../models/bookSchema')
const NOTIFY = require('../models/notificationSchema')
const RECOMMAND = require('../models/recommandationSchema')
const USER = require('../models/userSchema')
const RATING = require('../models/ratingSchema')
const ORDER = require('../models/orderSchema')
const PAYMENT = require('../models/paymentSchema')

const bcrypt = require('bcrypt')

exports.registerAdmin =
    async (req, res) => {
        try {
            const email = req.body.email
            const password = req.body.password

            const bcryptedPass = await bcrypt.hash(password, 10)

            const admin = await ADMIN.create({
                email,
                password: bcryptedPass
            })


            if (!admin) {
                const error = new Error('admin not created successfully...')
                throw error
            }

            return res.status(201).json({
                success: true,
                message: "admin created successfully..."
            })
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: error.message
            })
        }
    }

exports.loginAdmin =
    async (req, res) => {
        return res.json({
            success: true,
            message: "Admin login successfully..."
        })
    }
// ======================================== Books API =============================================

exports.createBookGenre =
    async (req, res) => {
        try {
            const genre = req.body.genre

            if (!genre) {
                const error = new Error('Genre not found...')
                throw error
            }

            const isAvailable = await GENRE.findOne({ genre })

            if (isAvailable) {
                const error = new Error('Book genre already exist..')
                throw error
            }

            const createGenre = await GENRE.create({
                genre
            })

            if (!createGenre) {
                const error = new Error('Book genre not created...')
                throw error
            }

            return res.json({
                success: true,
                message: 'Genre created successfully...'
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.createBook =
    async (req, res) => {
        try {
            const admin = req.user
            const title = req.body.title
            const author = req.body.author
            const price = req.body.price
            const genre = req.body.genre
            const image = req.file.filename
            const numbersOfBooks = req.body.numbersOfBooks
            const status = numbersOfBooks > 0 ? 'Available' : 'Unavailable'

            if (!admin) {
                const error = new Error('Admin not found...')
                throw error
            }

            const book = await BOOK.create({
                title,
                author,
                genre,
                price,
                numbersOfBooks,
                status,
                image
            })

            if (!book) {
                const error = new Error('Book not create by user...')
                throw book
            }

            const allData = await RECOMMAND.find()

            for (let i = 0; i < allData.length; i++) {
                const id = allData[i].recommandId
                for (let j = 0; j < id.length; j++) {
                    if (id[j] == genre) {
                        console.log('matched', id[j])
                        const data = await NOTIFY.create({
                            notification: `new book ${book.title} created in your recommandation..`,
                            userId: allData[i].userId
                        })
                    }
                }
            }

            return res.status(200).json({
                success: true,
                message: "Book Created successfully..."
            })
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: error.message
            })
        }
    }

exports.findAllBooks =
    async (req, res) => {
        try {
            const admin = req.user
            const page = req.query.page ? req.query.page : 1
            const actualpage = parseInt(page) - 1
            const record = actualpage * 2

            if (!admin) {
                const error = new Error('Admin not log in ...')
                throw error
            }

            const book = await BOOK.aggregate()
                .skip(record)
                .limit(2)
                .project({ createdAt: 0, updatedAt: 0, __v: 0 })

            if (!book) {
                const error = new Error('Book not found...')
                throw error
            }

            return res.status(200).json({
                success: true,
                message: "All users found...",
                book
            })
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: error.message
            })
        }
    }

exports.findBookById =
    async (req, res) => {
        try {
            const admin = req.user
            const id = req.params.id

            if (!admin) {
                const error = new Error('Admin not log in ...')
                throw error
            }

            const book = await BOOK.findById(id)

            if (!book) {
                const error = new Error('Book not found...')
                throw error
            }

            return res.status(200).json({
                success: true,
                message: "All users found...",
                book
            })
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: error.message
            })
        }
    }

exports.updateBookById =
    async (req, res) => {
        try {
            const admin = req.user
            const id = req.params.id
            const title = req.body.title
            const author = req.body.author
            const genre = req.body.genre
            const price = req.body.price
            const numbersOfBooks = req.body.numbersOfBooks

            const status = numbersOfBooks > 0 ? 'Available' : 'Unavailable'

            if (!admin) {
                const error = new Error('Admin not found...')
                throw error
            }

            const book = await BOOK.findByIdAndUpdate(id, {
                title,
                author,
                genre,
                price,
                numbersOfBooks,
                status
            })

            if (!book) {
                const error = new Error('Book not updated...')
                throw error
            }

            return res.json({
                success: true,
                message: "book Updated successfully...",
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.deleteBookById =
    async (req, res) => {
        try {
            const admin = req.user
            const id = req.params.id

            if (!admin) {
                const error = new Error('Admin not found...')
                throw error
            }

            const book = await BOOK.findByIdAndRemove(id)

            if (!book) {
                const error = new Error('Book not deleted...')
                throw error
            }

            return res.json({
                success: true,
                message: "book Deleted successfully...",
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.bookGenreStatus =
    async (req, res) => {
        try {
            const admin = req.user

            if (!admin) {
                const error = new Error('Admin not login...')
                throw error
            }

            const bookGenre = req.body.genre
            const status = req.body.status

            const updateGenre = await GENRE.findOneAndUpdate({ genre: bookGenre },
                {
                    status
                })

            if (!updateGenre) {
                const error = new Error('Book genre not found...')
                throw error
            }

            return res.json({
                success: true,
                message: 'Book genre status changed...'
            })
        } catch (error) {
            return res.json({
                success: false,
                messsage: error.message
            })
        }
    }

// ======================================== Users API =============================================

exports.getaAllUsers =
    async (req, res) => {
        try {
            const admin = req.user
            const page = req.query.page ? req.query.page : 1
            const actualpage = parseInt(page) - 1
            const record = actualpage * 2

            if (!admin) {
                const error = new Error('Admin not found...')
                throw error
            }

            const allUsers = await USER
                .aggregate()
                .skip(record)
                .limit(2)
                .project({ otpVerification: 0, createdAt: 0, password: 0, token: 0, updatedAt: 0, otp: 0 })

            // const users = allUsers.map(doc => USER.hydrate({
            //     Id: doc._id,
            //     email: doc.email,
            //     image: doc.image
            // }))

            return res.json({
                success: true,
                messsage: "All users found...",
                allUsers
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }

    }

// ======================================== Orders API =============================================

exports.getAllOrders =
    async (req, res) => {
        try {
            const admin = req.user

            if (!admin) {
                const error = new Error('Admin not found...')
                throw error
            }

            const page = req.query.page ? req.query.page : 1
            const actualpage = parseInt(page) - 1
            const record = actualpage * 2

            const allOrders = await ORDER.find().count()

            const totalPage = parseInt(allOrders / 2)

            const ordersList = await ORDER.aggregate()
                .skip(record)
                .limit(2)
                .project({ createdAt: 0, updatedAt: 0, __v: 0 })

            if (!ordersList) {
                const error = new Error('All orders not found...')
                throw error
            }

            const orders = allOrders.length > 0 ? allOrders : 'Not any pending oredrs available...'

            console.log(orders)

            return res.json({
                success: true,
                data: orders,
                totalPage
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

// ======================================== Payment API =============================================

exports.getAllPaymentList =
    async (req, res) => {
        try {
            const admin = req.user
            if (!admin) {
                const error = new Error('Admin not found...')
                throw error
            }

            const page = req.query.page ? req.query.page : 1
            const actualpage = parseInt(page) - 1
            const record = actualpage * 2

            const allPayment = await PAYMENT.find().count()

            const totalPage = parseInt(allPayment / 2)

            const paymentList = await PAYMENT.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' }
            ])
                .skip(record)
                .limit(2)
                .project({ createdAt: 0, updatedAt: 0, __v: 0, 'user._id': 0, 'user.token': 0, 'user.otpVerification': 0, 'user.otp': 0, 'user.password': 0, 'user.createdAt': 0, 'user.updatedAt': 0, 'user.__v': 0 })

            if (!paymentList) {
                const error = new Error('Payment list not found....')
                throw error
            }

            return res.json({
                success: true,
                list: paymentList,
                totalPage
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }