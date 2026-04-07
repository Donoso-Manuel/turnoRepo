const { procesarExcel, obtenerRangoFechas } = require('./excel.service');
const { 
  existenTurnosEnRango, 
  insertarTurnos, 
  eliminarTurnoEnRango 
} = require('./turnos.db.service');

async function procesarYGuardarTurnos(data, forzar = false) {

  const turnos = await procesarExcel(data);

  const { min, max } = obtenerRangoFechas(turnos);

  const existen = await existenTurnosEnRango(min, max);


  if (existen && !forzar) {
    return {
      requiereConfirmacion: true,
      mensaje: 'Ya existen turnos en este rango',
      rango: { min, max },
      turnos
    };
  }


  if (existen && forzar) {
    await eliminarTurnoEnRango(min, max);
  }
  await insertarTurnos(turnos);

  return {
    ok: true,
    total: turnos.length,
    rango: { min, max },
    turnos
  };
}

module.exports = {
  procesarYGuardarTurnos
};