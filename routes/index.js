const express = require('express')
const router = express.Router()

const userRoutes = require('./users/index')
const adminRoutes = require('./admin/index')

router.use('/user', userRoutes)
router.use('/admin', adminRoutes)

module.exports = router