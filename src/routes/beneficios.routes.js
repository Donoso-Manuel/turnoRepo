const express = require('express');
const router = express.Router();

const {probarBeneficios, listarBeneficios, usarBeneficio, pagarBeneficio, 
    reprocesarDesde, exportarPagosHistorico, exportarSeleccionados,
    pagarMasivo, exportarYPagar, obtenerLote, exportarPorLote} = require('../controllers/beneficios.controller');


// Pruebas y Calculos
router.get('/calcular/:rut', probarBeneficios)

//listar Beneficio por Rut
router.get('/:rut/listar',listarBeneficios)

//reprocesos por rut
router.post('/:rut/reprocesar-desde', reprocesarDesde)

// Pago individual
router.put('/:id/pagar', pagarBeneficio)
router.put('/:id/usar', usarBeneficio)

//Pago masivo
router.post('/pagar-masivo', pagarMasivo)
router.post('/exportar-pagar', exportarYPagar)

//reportes
router.get('/reporte-pagos', exportarPagosHistorico);
router.get('/exportar-seleccionados', exportarSeleccionados)

//lotes
router.get('/lote/:lote', obtenerLote)
router.get('/lote/:lote/exportar', exportarPorLote);


module.exports = router;