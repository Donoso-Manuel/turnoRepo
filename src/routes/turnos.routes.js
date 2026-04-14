const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const {cargarExcel, corregirTurno, agregarTurnoManual, obtenerTurnosNocturnos, obtenerTurnos} = require('../controllers/turnos.controller');



router.post('/cargar-excel', upload.single('file'), cargarExcel);
router.put('/:id/corregir',corregirTurno)
router.post('/manual', agregarTurnoManual)
router.get('/nocturnos', obtenerTurnosNocturnos);
router.get('/',obtenerTurnos)

module.exports = router;