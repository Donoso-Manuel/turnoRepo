const { procesarExcel, obtenerRangoFechas } = require('./excel.service');
const {obtenerTurnoPorCodigo} =  require('./catalogo.service')
const {esTurnoNoche}  = require('./reglas.service')
const {calcularNochesYBeneficios} = require('./beneficios.service')
const {existenTurnosEnRango, insertarTurnos, eliminarTurnoEnRango, insertarTurnoManualDB, obtenerTurnosNocturnosDB, obtenerTurnosDB} = require('./turnos.db.service');
const {insertarBeneficios} = require('./beneficios.db.service')
const {obtenerAcumulado,guardarAcumulado} = require('./acumulados.db.service')

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
async function procesarTurnoIndividual(rut, fecha, esNocheNuevo, esNocheAntes) {

  const acumulado = await obtenerAcumulado(rut);
  let contador = acumulado || 0;

  // 🔥 NORMALIZAR VALORES
  const antes = esNocheAntes === true;
  const nuevo = esNocheNuevo === true;


  let huboCambio = false;

  // 🔥 CASO 1: pasa a nocturno
  if (!antes && nuevo) {
    console.log('SUMANDO +1');
    contador += 1;
    huboCambio = true;
  }

  // 🔥 CASO 2: deja de ser nocturno
  if (antes && !nuevo) {
    console.log('RESTANDO -1');
    contador -= 1;
    huboCambio = true;
  }

  // 🔥 CASO 3: sin cambio
  if (!huboCambio) {
    console.log('SIN CAMBIO');
    return;
  }

  // 🔥 BENEFICIO
  if (contador >= 12) {
    console.log('GENERANDO BENEFICIO');

    await insertarBeneficios(rut, [{
      fecha_generacion: fecha
    }]);

    contador -= 12;
  }

  console.log('FINAL:', contador);

  await guardarAcumulado(rut, contador, fecha);
}
async function listarTurnosNocturnos(filtros) {
  return await obtenerTurnosNocturnosDB(filtros);
}
async function listarTurnos(filtros) {
  return await obtenerTurnosDB(filtros)
}

module.exports = {
  procesarYGuardarTurnos,
  insertarTurnoManual,
  reprocesarDesde,
  procesarTurnoIndividual,
  listarTurnosNocturnos,
  listarTurnos
};