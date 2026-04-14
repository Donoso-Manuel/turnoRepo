const XLSX = require('xlsx');
const { procesarYGuardarTurnos, insertarTurnoManual,procesarTurnoIndividual, listarTurnosNocturnos, listarTurnos } = require('../services/turnos.service');
const {obtenerTurnoPorId, actualizarTurno} = require('../services/turnos.db.service');
const {obtenerTurnoPorCodigo} = require('../services/catalogo.service')
const {esTurnoNoche} = require('../services/reglas.service')
const {procesarBeneficiosPorRango, reprocesarRangoCompleto} = require('../services/beneficios.service')

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


    if(resultado.requiereConfirmacion){
      return res.json({
        requiereConfirmacion: true,
        mensaje: resultado.mensaje,
        rango: resultado.rango
      })
    }

    if(resultado.ok){
      if(forzar){
        await reprocesarRangoCompleto(
          resultado.rango.min,
          resultado.rango.max
        );
      }else{
        await procesarBeneficiosPorRango(
          resultado.rango.min,
          resultado.rango.max
        );
      }
    }

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

const corregirTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const { horaIngreso, horaSalida } = req.body;

    // 🔥 1. obtener turno ORIGINAL (ANTES de modificar)
    const turnoAntes = await obtenerTurnoPorId(id);

    const turnoCatalogo = await obtenerTurnoPorCodigo(turnoAntes.codigo_turno);

    // 🔥 2. calcular nuevo estado
    const esNocheNuevo = esTurnoNoche(
      { horaIngreso, horaSalida },
      turnoCatalogo
    ) === true;

    const esNocheAntes = turnoAntes.es_noche;


    // 🔥 3. procesar impacto (ANTES de actualizar)
    await procesarTurnoIndividual(
      turnoAntes.rut,
      turnoAntes.fecha,
      esNocheNuevo,
      esNocheAntes
    );
    console.log(esNocheNuevo)
    // 🔥 4. ahora sí actualizar BD
    await actualizarTurno(id, {
      horaIngreso,
      horaSalida,
      esNoche: esNocheNuevo
    });

    res.json({
      mensaje: 'Turno corregido y procesado correctamente'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al corregir turno' });
  }
};
const agregarTurnoManual = async (req, res) => {
  try {
    const {
      rut,
      nombre,
      fecha,
      horaIngreso,
      horaSalida,
      codigoTurno
    } = req.body;

    if (!rut || !fecha || !horaIngreso || !horaSalida) {
      return res.status(400).json({
        error: 'Faltan datos obligatorios'
      });
    }

    const resultado = await insertarTurnoManual({
      rut,
      nombre,
      fecha,
      horaIngreso,
      horaSalida,
      codigoTurno
    });

    res.json({
      mensaje: 'Turno manual agregado',
      turno: resultado
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al insertar turno manual' });
  }
};

const obtenerTurnosNocturnos = async (req, res) => {
  try {
    const { rut, desde, hasta } = req.query;

    const turnos = await listarTurnosNocturnos({ rut, desde, hasta });

    res.json(turnos);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener turnos nocturnos' });
  }
};
const obtenerTurnos = async (req, res) =>{
  try{
    const {rut, desde, hasta} =  req.query;

    const turnos =  await listarTurnos({rut, desde, hasta});

    res.json(turnos)
  }catch(error){
    console.error(error)
    res.status(500).json({error: "Error al obtener los turnos"})
  }
}

module.exports = {
  cargarExcel,
  corregirTurno,
  agregarTurnoManual,
  obtenerTurnosNocturnos,
  obtenerTurnos
};