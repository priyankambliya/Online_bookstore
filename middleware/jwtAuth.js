const jwt = require('jsonwebtoken')
const USER = require('../models/userSchema')

module.exports = async (req, res, next) => {

    console.log(req.cookies)

    try {
        let decodedToken = await jwt.verify(req.cookies.JwtToken, process.env.SECRET)
        if (!decodedToken) {
            const error = new Error('Token not valid...')
            throw error
        }
        const user = await USER.findOne({ email: decodedToken.email })

        if (!user) {
            const error = new Error('USer not found...')
            throw error
        }

        req.user = user
        next()
    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        })
    }

}