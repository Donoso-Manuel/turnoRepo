const express = require('express')
const router = express.Router()

const {getKPIs} = require('../controllers/dashboard.controller')

router.get('/kpis', getKPIs )

module.exports = router;