const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const {cargarExcel, corregirTurno, agregarTurnoManual} = require('../controllers/turnos.controller');
const {probarBeneficios} = require('../controllers/beneficios.controller')


router.post('/cargar-excel', upload.single('file'), cargarExcel);
router.put('/:id/corregir',corregirTurno)
router.post('/manual', agregarTurnoManual)

module.exports = router;