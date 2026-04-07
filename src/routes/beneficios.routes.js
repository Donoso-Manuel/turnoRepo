const express = require('express');
const router = express.Router();

const {probarBeneficios, listarBeneficios, usarBeneficio, pagarBeneficio, 
    reprocesarDesde, exportarPagosHistorico, exportarSeleccionados,
    pagarMasivo, exportarYPagar, obtenerLote, exportarPorLote} = require('../controllers/beneficios.controller');

router.get('/beneficios/:rut',probarBeneficios);
router.put('/beneficios/:id/pagar', pagarBeneficio)
router.put('/beneficios/:id/usar', usarBeneficio)
router.get('/beneficios/:rut/listar',listarBeneficios)
router.post('/beneficios/:rut/reprocesar-desde', reprocesarDesde)
router.get('/beneficios/reporte-pagos', exportarPagosHistorico);
router.post('/Beneficios/pagar-masivo', pagarMasivo)
router.get('/beneficios/exportar-seleccionados', exportarSeleccionados)
router.post('/beneficios/exportar-pagar', exportarYPagar)
router.get('/beneficios/lote/:lote', obtenerLote)
router.get('/beneficios/lote/:lote/exportar', exportarPorLote);

module.exports = router;