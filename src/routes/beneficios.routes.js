const express = require('express');
const router = express.Router();

const {probarBeneficios, listarBeneficios, usarBeneficio, pagarBeneficio, 
    reprocesarDesde, exportarBeneficios, exportarSeleccionados,
     exportarYPagar, listarLotes, exportarLote, obtenerDetalleLote,
     getListaAcumulados,
     exportarAcumulados} = require('../controllers/beneficios.controller');


// Pruebas y Calculos
router.get('/calcular/:rut', probarBeneficios)

//listar Beneficio por Rut
router.get('/beneficios',listarBeneficios)

//reprocesos por rut
router.post('/:rut/reprocesar-desde', reprocesarDesde)

// Pago individual
router.put('/:id/pagar', pagarBeneficio)
router.put('/:id/usar', usarBeneficio)

//Pago masivo
router.post('/exportar-pagar', exportarYPagar)
//Acumulados

router.get('/acumulados',getListaAcumulados)
router.get('/acumulados/exportar',exportarAcumulados)

//reportes
router.get('/exportar-beneficios', exportarBeneficios)
router.get('/exportar-seleccionados', exportarSeleccionados)

//lotes
router.get('/lotes', listarLotes)
router.get('/lotes/:lote', obtenerDetalleLote);
router.get('/lotes/:lote/exportar',exportarLote);


module.exports = router;