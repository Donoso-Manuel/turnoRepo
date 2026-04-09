const { procesarExcel, obtenerRangoFechas } = require('./excel.service');
const {obtenerTurnoPorCodigo} =  require('./catalogo.service')
const {esTurnoNoche}  = require('./reglas.service')
const {calcularNochesYBeneficios} = require('./beneficios.service')
const {  existenTurnosEnRango, insertarTurnos, eliminarTurnoEnRango, insertarTurnoManualDB, obtenerTurnosNocturnosPorRut} = require('./turnos.db.service');
const {eliminarBeneficiosDesdeFecha, insertarBeneficios} = require('./beneficios.db.service')

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

async function insertarTurnoManual(data) {
  const turnoCatalogo = await obtenerTurnoPorCodigo(data.codigoTurno);

  const esNoche = esTurnoNoche(
    {
      horaIngreso: data.horaIngreso,
      horaSalida: data.horaSalida
    },
    turnoCatalogo
  );

  const turno = {
    ...data,
    esNoche,
    origen: 'MANUAL'
  };

  await insertarTurnoManualDB(turno);

  const reproceso = await reprocesarDesde(data.rut, data.fecha)

  return{
    turno,
    reproceso
  }
}
async function reprocesarDesde(rut, fechaInicio) {

  await eliminarBeneficiosDesde(rut, fechaInicio);

  const turnos = await obtenerTurnosNocturnosPorRut(rut);

  const turnosFiltrados = turnos.filter(t => 
    new Date(t.fecha) >= new Date(fechaInicio)
  );

  const resultado = calcularNochesYBeneficios(turnosFiltrados);

  await insertarBeneficios(rut, resultado.beneficios);

  return resultado;
}

module.exports = {
  procesarYGuardarTurnos,
  insertarTurnoManual,
  reprocesarDesde
};