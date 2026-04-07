const express = require('express');
const router = express.Router();

const {probarBeneficios} = require('../controllers/beneficios.controller');

router.get('/beneficios/:rut',probarBeneficios);
router.put('/beneficios/:id/pagar',)
router.put('/beneficios/:id/usar',)
router.get('/beneficios/:rut/listar',)

module.exports = router;