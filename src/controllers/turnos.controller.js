const XLSX = require('xlsx');
const { procesarYGuardarTurnos } = require('../services/turnos.service');

const cargarExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se envió archivo" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const forzar = req.body.forzar === 'true';

    const resultado = await procesarYGuardarTurnos(data, forzar);

    //console.log(resultado)

    //console.log('Muestra turnos:', resultado.turnos.slice(0, 1));
    //console.log('Rango:', resultado.rango);
    //console.log('Existen en BD:', resultado.existen);


    
    res.json({
      totalTurnos: resultado.turnos.length,
      rango: resultado.rango,
      existenDatos: resultado.existen,
      muestra: resultado.turnos.slice(0, 1)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar el archivo', detalle: error.message });
  }
};

module.exports = {
  cargarExcel,
};