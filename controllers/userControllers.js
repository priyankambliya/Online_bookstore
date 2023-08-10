const USER = require('../models/userSchema')
const BOOK = require('../models/bookSchema')
const CART = require('../models/cartSchema')
const RECOMMAND = require('../models/recommandationSchema')
const GENRE = require('../models/bookGenreSchema')
const ORDER = require('../models/orderSchema')
const RATING = require('../models/ratingSchema')
const PAYMENT = require('../models/paymentSchema')

const bcrypt = require('bcrypt')
const fs = require('fs')
const nodemailer = require('nodemailer')
const otpGenerator = require('otp-generator')
var jwt = require('jsonwebtoken')

const TokenGenerator = require('token-generator')({
    salt: 'your secret ingredient for this magic recipe',
    timestampMap: 'abcdefghij', // 10 chars array for obfuscation proposes
})

exports.createUser =
    async (req, res) => {
        try {
            const fullname = req.body.fullname
            const email = req.body.email
            const pass = req.body.password

            var token = TokenGenerator.generate();

            const password = await bcrypt.hash(pass, 10)

            const findUserByEmail = await USER.findOne({ email })

            if (findUserByEmail) {
                const error = new Error('This email already in use...')
                throw error
            } else {
                // ========================================== OTP GENERATOR =============================================
                const otp = otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

                const user = await USER.create({
                    fullname,
                    email,
                    password,
                    otp,
                    token
                })
                if (!user) {
                    const error = new Error('User not found...')
                    throw error
                }

                // ========================================== TRANSPORTER FOR NODEMAILER =============================================
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.ADMIN_EMAIL,
                        pass: process.env.ADMIN_PASS
                    }
                })

                // send mail with defined transport object
                const info = await transporter.sendMail({
                    from: process.env.ADMIN_EMAIL, // sender address
                    to: user.email, // list of receivers
                    subject: "Hello ✔", // Subject line
                    text: `Hello ${user.username}, Your otp is ${otp} `, // plain text body
                });
            }

            return res.status(201).json({
                success: true,
                message: "User Created successfully...",
                token
            })
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: error.message
            })
        }
    }

exports.otpVerification =
    async (req, res) => {
        try {
            const token = req.headers.token
            const otp = req.body.otp

            if (!token) {
                const error = new Error('Token not availabel...')
                throw error
            }

            const user = await USER.findOne({ token })

            if (otp !== user.otp) {
                const error = new Error('Otp not currect...')
                throw error
            }

            if (!user) {
                const error = new Error('User not found...')
                throw error
            }

            const userUpdate = await USER.findByIdAndUpdate(user.id, {
                otpVerification: true
            })

            return res.json({
                success: true,
                message: "You otp verification done..."
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.userLogin =
    async (req, res) => {
        try {
            const email = req.body.email
            const password = req.body.password

            const user = await USER.findOne({ email })

            const pass = await bcrypt.compare(password, user.password)

            if (!pass) {
                const error = new Error('Wrong password...')
                throw error
            }

            if (!user) {
                const error = new Error('User not found...')
                throw error
            }

            if (!user.otpVerification) {
                const error = new Error('Verify OTP first...')
                throw error
            }

            const jwtToken = jwt.sign({ email }, process.env.SECRET, { expiresIn: '12h' })

            if (!jwtToken) {
                const error = new Error('Token not valid...')
                throw error
            }

            res.cookie('JwtToken', jwtToken)

            return res.status(200).json({
                success: true,
                message: "User login successfully..."
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.findAllRecommandation =
    async (req, res) => {
        try {
            const user = req.user

            if (!user) {
                const error = new Error('User not found...')
                throw error
            }

            const allRecommandation = await RECOMMAND.aggregate([
                { $match: { userId: user.id } },
                {
                    $lookup: {
                        from: 'genres',
                        localField: 'recommandId',
                        foreignField: '_id',
                        as: 'recommandId.genre'
                    }
                }
            ]).project({
                '_id': 0,
                '__v': 0,
                'recommandId.genre._id': 0,
                'recommandId.genre.__v': 0,
                'recommandId.genre.status': 0,
            })

            if (!allRecommandation) {
                const error = new Error('recommadation not found...')
                throw error
            }

            return res.json({
                success: true,
                AllGenre: allRecommandation[0].recommandId,
                message: 'All recommandation found...'
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.getAllGenres =
    async (req, res) => {
        try {
            const admin = req.user

            if (!admin) {
                const error = new Error('Admin not login...')
                throw error
            }

            const allGenre = await GENRE.aggregate([
                { $match: { status: 'Available' || 1 } }
            ])
                .project({
                    '_id': 1,
                    'genre': 1
                })

            if (!allGenre) {
                const error = new Error('All genere not found...')
                throw error
            }

            return res.json({
                success: true,
                allGenre
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.recommandBooks =
    async (req, res) => {
        try {
            const user = req.user
            const ids = req.body.ids

            const check = await GENRE.aggregate([
                {
                    $match: {
                        status: 0
                    }
                }
            ])

            for (let i = 0; i < ids.length; i++) {
                for (let j = 0; j < check.length; j++) {
                    if (check[j]._id == ids[i]) {
                        const error = new Error(`You can not access this one ${check[j]._id}`)
                        throw error
                    }
                }
            }

            if (!user) {
                const error = new Error('User not found')
                throw error
            }

            const isAvailable = await RECOMMAND.findOne({ userId: user._id })

            console.log(isAvailable)

            if (isAvailable) {
                let array = []
                array = isAvailable.recommandId
                array = array.concat(ids)
                const findRecomand = await RECOMMAND.findByIdAndUpdate(isAvailable._id, {
                    recommandId: array
                })

                if (!findRecomand) {
                    const error = new Error('Recommand user not found...')
                    throw error
                }
            }
            else {
                const addRecommadation = await RECOMMAND.create({
                    userId: user._id,
                    recommandId: ids
                })

                if (!addRecommadation) {
                    const error = new Error('Id not addedd...')
                    throw error
                }
            }
            return res.json({
                success: true,
                message: 'Add as reccommanded Ids...'
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.updateRecommandation =
    async (req, res) => {
        try {
            const user = req.user
            const ids = req.body.ids

            if (!user) {
                const error = new Error('User not found...')
                throw error
            }

            const findRecommandation = await RECOMMAND.findOne({ userId: user._id })

            for (let i = 0; i < findRecommandation.recommandId.length; i++) {
                console.log(findRecommandation.recommandId[i])
                for (let j = 0; j < ids.length; j++) {
                    if (ids[j] == findRecommandation.recommandId[i]) {
                        const updatedIds = findRecommandation.recommandId.splice(findRecommandation.recommandId[i], i)

                        const updateRecommandation = await RECOMMAND.findOneAndUpdate({ userId: user._id }, {
                            recommandId: updatedIds
                        })

                        if (!updateRecommandation) {
                            const error = new Error('Id not removed..')
                            throw error
                        }

                    }
                }
            }

            return res.json({
                success: true,
                message: 'User Id deleted...'
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.findAllAvailableBooks =
    async (req, res) => {
        try {
            if (!req.user) {
                const error = new Error('User not found...')
                throw error
            }

            const page = req.query.page ? req.query.page : 1
            const actualpage = parseInt(page) - 1
            const record = actualpage * 5

            const totalBook = await BOOK.find().count()
            const totalPages = totalBook / 5
            const pages = Math.ceil(totalPages)

            console.log('pages is : ', pages)

            const searchData = req.query.search ? {
                $match: {
                    $or: [
                        { title: req.query.search },
                        { author: req.query.search },
                        { 'genre.genre': req.query.search }
                    ]
                }
            } : { $match: {} }

            const books = await BOOK.aggregate([
                { $match: { status: 'Available' } },
                {
                    $lookup: {
                        from: 'ratings',
                        let: { id: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: [
                                            "$bookId",
                                            "$$id"
                                        ]
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: 'users',
                                    let: { userId: "$userId" },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: [
                                                        "$_id",
                                                        "$$userId"
                                                    ]
                                                }
                                            }
                                        },
                                    ],
                                    as: 'user'
                                }
                            },
                            { $unwind: '$user' },
                            {
                                $project: {
                                    'user._id': 0,
                                    'user.password': 0,
                                    'user.otp': 0,
                                    'user.token': 0,
                                    'user.otpVerification': 0,
                                    'user.createdAt': 0,
                                    'user.updatedAt': 0,
                                    'user.__v': 0,
                                }
                            }
                        ],
                        as: "ratings_and_reviews"
                    }
                },
                {
                    $lookup: {
                        from: 'genres',
                        localField: 'genre',
                        foreignField: '_id',
                        as: 'genre'
                    }
                },
                {
                    $unwind: {
                        path: '$genre',
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $unset: ['ratings_and_reviews._id', 'ratings_and_reviews.__v', 'ratings_and_reviews.bookId'] },
                searchData,
            ])
                .skip(record)
                .limit(5)
                .project({
                    'genre': '$genre.genre',
                    'rating_and_reviews': '$ratings_and_reviews',
                    'title': 1,
                    'author': 1,
                    'image': 1,
                    'price': 1,
                    'numbersOfBooks': 1,
                    'avg': '$$ratings_and_reviews.ratings' / 2,
                })

            if (!books) {
                const error = new Error('users not found...')
                throw error
            }

            for (let i = 0; i < books.length; i++) {
                if (books[i].rating_and_reviews.length == 0) {
                    books[i].rating_and_reviews = null
                }
            }

            let avg = [];
            for (let i = 0; i < books.length; i++) {
                console.log(books[i]._id)
                const bookId = books[i]._id

                let totalRate = 0;
                const bookName = await RATING.aggregate([
                    { $match: { $expr: { $eq: ['$bookId', { $toObjectId: books[i]._id }] } } }
                ])
                console.log(bookName)
                for (let j = 0; j < bookName.length; j++) {
                    const rating = bookName[j].rating

                    totalRate += rating
                }
                const average_per_book = totalRate / bookName.length
                const obj = {
                    bookId,
                    average_per_book
                }
                if (!obj.average_per_book) {
                    obj.average_per_book = 0;
                }
                avg = [...avg, obj]
            }

            const arrayValue = books.map((book) => {
                const averageBookid = avg.map((avgBook) => {
                    if (book._id == avgBook.bookId) {
                        console.log('matched.. id', book._id)
                        book.avg = avgBook.average_per_book
                    }
                })
            })

            return res.json({
                success: true,
                message: "All books found...",
                books,
                // totalPages: pages
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.addToCart =
    async (req, res) => {
        try {
            if (!req.user) {
                const error = new Error('User not found...')
                throw error
            }

            const bookId = req.body.bookId
            const quntityOfBooks = req.body.quntity
            console.log(quntityOfBooks)
            if (quntityOfBooks < 0) {
                const error = new Error('Books quntity must greater then 0')
                throw error
            }

            const book = await BOOK.findById(bookId)

            if (book.numbersOfBooks == 0) {

                const updateBook = await BOOK.findByIdAndUpdate(bookId, {
                    status: 'Unavailable'
                })

                const error = new Error('Sorry, But this book is Out of stock...')
                throw error
            }

            if (book.numbersOfBooks < quntityOfBooks) {

                const error = new Error('book not add to cart bcz of low quntity..')
                throw error
            }

            const findOldCart = await CART.aggregate([
                { $match: { $expr: { $eq: ['$bookId', { $toObjectId: bookId }] } } },
                { $match: { $expr: { $eq: ['$userId', { $toObjectId: req.user._id }] } } }
            ])

            const userCart = findOldCart.length > 0
                ? await CART.findByIdAndUpdate(findOldCart[0]._id, {
                    quntity: findOldCart[0].quntity + quntityOfBooks
                })
                : await CART.create({
                    bookId,
                    userId: req.user.id,
                    quntity: quntityOfBooks
                })

            if (!userCart) {
                const error = new Error('Cart not created...')
                throw error
            }

            // const updateBook = await BOOK.findByIdAndUpdate(bookId, {
            //     numbersOfBooks: book.numbersOfBooks - quntityOfBooks,
            //     status
            // })

            // console.log(updateBook)

            return res.json({
                success: true,
                message: "Cart creeated successfully..."
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.getCartDetailByLoginUser =
    async (req, res) => {
        try {
            const user = req.user

            if (!user) {
                const error = new Error('user not found...')
                throw error
            }

            const match = req.user ? { $match: { userId: req.user._id } } : { $match: {} }

            const cartDetail = await CART.aggregate(
                [match,
                    {
                        $lookup: {
                            from: 'books',
                            localField: 'bookId',
                            foreignField: '_id',
                            as: 'detail'
                        }
                    },
                    {
                        $lookup: {
                            from: 'genres',
                            localField: 'detail.genre',
                            foreignField: '_id',
                            as: 'genre_of_book'
                        }
                    },
                    { $unset: ['_id'] },
                    { $unwind: '$detail' },
                    { $unwind: '$genre_of_book' }])
                .project({
                    'genre': '$genre_of_book.genre',
                    'title': '$detail.title',
                    'author': '$detail.author',
                    'price': '$detail.price',
                    'bookId': '$detail._id',
                    'quntity': 1
                })
            let totalPrice = 0;
            const price = cartDetail.map((book) => {
                console.log(book)
                const p = book.price
                const original = p.split('$')[0]
                const money = parseInt(original) * book.quntity

                totalPrice += money
            })

            // console.log('total-price', `${totalPrice}$`)

            return res.json({
                success: true,
                books: cartDetail,
                totalAmount: `${totalPrice}$`
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.removeToCart =
    async (req, res) => {
        try {
            const user = req.user

            if (!user) {
                const error = new Error('User not found do login...')
                throw error
            }

            const bookId = req.body.bookId
            const quntity = req.body.quntity

            const book = await CART.aggregate([
                { $match: { $expr: { $eq: ['$bookId', { $toObjectId: bookId }] } } },
                { $match: { $expr: { $eq: ['$userId', { $toObjectId: req.user._id }] } } },
                {
                    $lookup: {
                        from: 'books',
                        localField: 'bookId',
                        foreignField: '_id',
                        as: 'detail'
                    }
                },
                { $unwind: '$detail' }])
                .project({
                    'bookId': 0,
                    'userId': 0,
                    '__v': 0,
                    'detail.__v': 0,
                    'detail.status': 0,
                    'detail.createdAt': 0,
                    'detail.updatedAt': 0,
                    'detail._id': 0
                })

            console.log(book)
            console.log(book[0].quntity)
            console.log(quntity)
            if (book[0].quntity < quntity) {
                const error = new Error('Input Quntity invalid...')
                throw error
            }

            const updateCart = await CART.findByIdAndUpdate(book[0]._id, {
                quntity: book[0].quntity - quntity
            })

            if (!updateCart) {
                const error = new Error('Cart not updated..')
                throw error
            }

            const record = await CART.findById(book[0]._id)

            console.log(record)


            if (record.quntity == 0) {
                const deleteRecord = await CART.findByIdAndDelete(book[0]._id)
            }

            console.log(bookId)
            const findBook = await BOOK.findById(bookId)
            console.log(findBook)

            const bookUpdate = findBook.numbersOfBooks <= 0
                ? await BOOK.findByIdAndUpdate(bookId, {
                    numbersOfBooks: book[0].detail.numbersOfBooks + quntity,
                    status: 'Available'
                })
                : await BOOK.findByIdAndUpdate(bookId, {
                    numbersOfBooks: book[0].detail.numbersOfBooks + quntity,
                })

            if (!bookUpdate) {
                const error = new Error('Book not updated...')
                throw error
            }

            return res.json({
                success: true,
                message: 'remove cart data'
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.updateProfile =
    async (req, res) => {
        try {
            const user = req.user

            const fullname = req.body.fullname
            const email = req.body.email
            const password = req.body.password

            const bcryptPassword = await bcrypt.hash(password, 10)

            const image = req.file.filename

            if (req.user.image) {
                // return true
                fs.unlink(`public/images/${req.user.image}`, (e) => {
                    if (e) {
                        console.log(e)
                    }
                    else {
                        console.log('file deleted success..')
                    }
                })
            }

            const updateUser = await USER.findByIdAndUpdate(user._id, {
                fullname,
                email,
                password: bcryptPassword,
                image
            })

            if (!updateUser) {
                const error = new Error('User not updated...')
                throw error
            }

            return res.json({
                success: true,
                message: 'User profile updated successfully...'
            })

        } catch (error) {
            return res.json({
                success: false,
                message: error
            })
        }
    }

exports.viewProfile =
    async (req, res) => {
        try {
            const user = req.user

            if (!user) {
                const error = new Error('User not found...')
                throw error
            }

            const viewUser = await USER.findById(user._id, { fullname: 1, email: 1, image: 1 })

            if (!viewUser) {
                const error = new Error('User not found pls do login first...')
                throw error
            }

            return res.json({
                success: true,
                viewUser
            })
        } catch (error) {
            return res.json({
                success: true,
                message: error.message
            })
        }
    }

exports.makeOrder =
    async (req, res) => {
        try {
            const user = req.user

            if (!user) {
                const error = new Error('User not found...')
                throw error
            }

            const cartdata = await CART.aggregate([
                { $match: { userId: user._id } }
            ])

            if (cartdata.length == 0) {
                const error = new Error('Cart is empty...')
                throw error
            }

            const b = cartdata.map((data) => {
                const book = data.bookId
                return book
            })

            const q = cartdata.map((e) => {
                console.log(e.quntity)
                return e.quntity
            })
            let array = []
            for (let i = 0; i < b.length; i++) {
                for (let j = 0; j < q.length; j++) {
                    if (i == j) {
                        let obj = {
                            bookId: b[i],
                            quntity: q[j]
                        }
                        array = [...array, obj]
                    }
                }
            }

            const order = await ORDER.create({
                about_book: array,
                userId: user._id,
            })

            if (!order) {
                const error = new Error('Order not sended...')
                throw error
            }

            const detail = await ORDER.aggregate([
                { $match: { userId: user._id } },
                {
                    $lookup: {
                        from: 'books',
                        localField: 'about_book.bookId',
                        foreignField: '_id',
                        as: 'book_details'
                    }
                },
                {
                    $addFields: {
                        'about_book': {
                            $map: {
                                input: '$about_book',
                                as: 'book',
                                in: {
                                    $let: {
                                        vars: {
                                            matchedBook: { $arrayElemAt: ['$book_details', { $indexOfArray: ['$book_details._id', '$$book.bookId'] }] }
                                        },
                                        in: {
                                            $mergeObjects:
                                                [
                                                    '$$book',
                                                    {
                                                        total_price_Of_book: { $multiply: [{ $toInt: '$$book.quntity' }, { $toDouble: '$$matchedBook.price' }] }
                                                    }
                                                ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        "book_details": {
                            $map: {
                                "input": "$book_details",
                                "as": "row",
                                "in": {
                                    "price": "$$row.price",
                                    "quntity": "$$row.quntity",
                                    "total": { $multiply: [{ $toInt: '$$row.quntity' }, { $toDouble: '$$row.price' }] }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        'book_details': 0
                    }
                }
            ]).project({
                'book_details.title': 1,
                'book_details.author': 1,
                'book_details.price': 1,
                'book_details._id': 1,
                'userId': 1,
                'about_book': 1,
                'total_amount': { $sum: '$about_book.total_price_Of_book' },
            })

            console.log(detail)

            if (!detail) {
                const error = new Error('Order not found...')
                throw error
            }

            const findUser = await ORDER.findOne({ userId: user._id })

            if (!findUser) {
                const error = new Error('User not foind..')
                throw error
            }

            const dataCart = await CART.aggregate([
                { $match: { userId: req.user._id } }
            ])

            const bookFind = await BOOK.findById(dataCart[0].bookId)
            const number = parseInt(bookFind.numbersOfBooks)
            const quntity = parseInt(dataCart[0].quntity)
            const result = number - quntity
            if (number < quntity) {
                const error = new Error('not valid..')
                throw error
            }

            const status = result > 0 ? 'Available' : 'Unavailable'

            const updateBook = await BOOK.findByIdAndUpdate(dataCart[0].bookId, {
                numbersOfBooks: number - quntity,
                status
            })

            const deleteData = dataCart.map(async (data) => {
                const rem = await CART.findByIdAndDelete(data._id)

                if (!rem) {
                    const error = new Error('Cart not deleted...')
                    throw error
                }
            })

            if (!deleteData) {
                const error = new Error('Cart not deleted...')
                throw error
            }

            return res.json({
                success: true,
                message: 'Thank you for bussiness with us...',
                detail,
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.viewOrderDetail =
    async (req, res) => {
        try {
            const user = req.user

            if (!user) {
                const error = new Error('User not found...')
                throw error
            }

            // const data = await ORDER.findOne({ userId: user._id })
            const data = await ORDER.aggregate([
                { $match: { userId: user._id } },
                {
                    $lookup: {
                        from: 'books',
                        localField: 'bookId',
                        foreignField: '_id',
                        as: 'book_details'
                    }
                }
            ]).project({
                '_id': 0,
                '__v': 0,
                'book_details.__v': 0,
                'book_details.createdAt': 0,
                'book_details.updatedAt': 0,
                'book_details.status': 0,
                'book_details.numbersOfBooks': 0
            })

            if (!data) {
                const error = new Error('User data not found...')
                throw error
            }

            let totalPrice = 0

            for (let i = 0; i < data[0].bookId.length; i++) {
                const id = data[0].bookId[i]

                const book = await BOOK.findById(id)
                console.log(book)

                const price = book.price
                const money = price.split('$')[0]
                const p = parseInt(money) * data[0].quntity[i]

                totalPrice += p
            }

            return res.json({
                success: true,
                data,
                message: "Data found successfully...",
                totalPrice: `${totalPrice}$`
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.ratingBooks =
    async (req, res) => {
        try {
            const user = req.user

            if (!user) {
                const error = new Error('User not found...')
                throw error
            }

            const book = req.body.book
            const rating = req.body.rating ? req.body.rating : 0
            const review = req.body.review ? req.body.review : ''

            if (rating > 5) {
                const error = new Error('Ratings must in between 0-5')
                throw error
            }

            if (rating < 0) {
                const error = new Error('You can not give negative rating')
                throw error
            }

            const userOrderModel = await ORDER.findOne({ userId: user._id })
            const findBook = await RATING.aggregate([
                { $match: { $expr: { $eq: ['$userId', { $toObjectId: user._id }] } } },
                { $match: { $expr: { $eq: ['$bookId', { $toObjectId: book }] } } },
            ])
            console.log(user._id)
            console.log(userOrderModel)

            if (findBook.length < 0) {
                const error = new Error('You only give one rate of each book...')
                throw error
            }

            for (let i = 0; i < userOrderModel.about_book.length; i++) {
                if (book == userOrderModel.about_book[i].bookId) {
                    console.log('Id found...' + userOrderModel.about_book[i].bookId)

                    const ratingBook = await RATING.create({
                        rating,
                        review,
                        bookId: book,
                        userId: user._id
                    })

                    if (!ratingBook) {
                        const error = new Error('Book not found...')
                        throw error
                    }
                }
            }

            return res.json({
                success: true,
                message: 'Give book rating or review...'
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.updateratingsByUser =
    async (req, res) => {
        try {
            const user = req.user

            const book = req.body.book
            const rate = req.body.rating ? req.body.rating : 0
            const review = req.body.review ? req.body.review : ''

            const rating = parseInt(rate)

            if (!user) {
                const error = new Error('User not login...')
                throw error
            }

            if (rating > 5) {
                const error = new Error('Ratings must in between 0-5')
                throw error
            }

            if (rating < 0) {
                const error = new Error('You can not give negative rating')
                throw error
            }

            const findBook = await RATING.aggregate([
                { $match: { $expr: { $eq: ['$userId', { $toObjectId: user._id }] } } },
                { $match: { $expr: { $eq: ['$bookId', { $toObjectId: book }] } } },
            ])

            if (!findBook) {
                const error = new Error('Book not avvailable...')
                throw error
            }

            const updateRating = await RATING.findOneAndUpdate({ bookId: findBook[0].bookId }, {
                rating,
                review
            })

            if (!updateRating) {
                const error = new Error('Book rating not updated..')
                throw error
            }

            return res.json({
                success: true,
                messsage: 'Book Ratings and review updated ..'
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }

exports.viewratingByBook =
    async (req, res) => {
        try {
            const user = req.user
            const book = req.body.bookId

            const page = req.query.page ? req.query.page : 1
            const actualpage = parseInt(page) - 1
            const record = actualpage * 3

            if (!user) {
                const error = new Error('User not found...')
                throw error
            }

            const bookData = await RATING.aggregate([
                { $match: { $expr: { $eq: ['$bookId', { $toObjectId: book }] } } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user_details'
                    }
                },
                {
                    $unwind: {
                        path: '$user_details',
                    }
                }
            ])
                .project({
                    'rating': 1,
                    'review': 1,
                    'bookId': 1,
                    'user_details.name': '$user_details.fullname',
                    "user_details.email": 1,
                    '_id': 0
                })
                .skip(record)
                .limit(3)

            if (!bookData) {
                const error = new Error('Book not found...')
                throw error
            }

            return res.json({
                success: true,
                message: 'Here are all rating all books which you enterd...',
                bookData
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message,
            })
        }
    }

exports.payment =
    async (req, res) => {
        try {
            const user = req.user
            const orderId = req.body.orderId

            if (!user) {
                const error = new Error('User not found...')
                throw error
            }
            const orderDetail = await ORDER.aggregate([
                { $match: { $expr: { $eq: ['$userId', { $toObjectId: user._id }] } } },
            ])
            console.log('order is ===', orderDetail)

            const findOrder = await ORDER.findById(orderId)
            if (findOrder) {
                let totalPrice = 0

                for (let i = 0; i < findOrder.about_book.length; i++) {
                    const id = findOrder.about_book[i].bookId

                    const book = await BOOK.findById(id)
                    console.log(book)

                    const price = book.price
                    const money = price.split('$')[0]
                    const p = parseInt(money) * findOrder.about_book[i].quntity

                    totalPrice += p
                }

                totalPrice = totalPrice ? totalPrice : 0

                const payment = await PAYMENT
                    .create({
                        userId: user._id,
                        orderId: findOrder._id,
                        totalPrice: `${totalPrice}$`
                    })

                if (!payment) {
                    const error = new Error('Payment not done...')
                    throw error
                }

                const updateOrderStatus = await ORDER.findByIdAndUpdate(findOrder._id, {
                    paymentStatus: 'Done'
                })

                if (!updateOrderStatus) {
                    const error = new Error('Order status not updated..')
                    throw error
                }
            }
            return res.json({
                success: true,
                message: 'USER done payment successfully...',
            })
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            })
        }
    }