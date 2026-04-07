const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const {cargarExcel} = require('../controllers/turnos.controller');
const {probarBeneficios} = require('../controllers/beneficios.controller')


router.post('/cargar-excel', upload.single('file'), cargarExcel);
router.get('/prueba-beneficios/:rut', probarBeneficios);

module.exports = router;