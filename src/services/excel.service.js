const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');

const {obtenerTurnoPorCodigo} = require('./catalogo.service');
const {esTurnoNoche} = require('./reglas.service');

dayjs.extend(customParseFormat);

function parseFecha(fecha){
    return dayjs(fecha,'DD/MM/YYYY').format('YYYY-MM-DD');
}
function limpiarHora(hora){

  if (hora === null || hora === undefined || hora === '') return null;

  // 🔤 string
  if (typeof hora === 'string') {

    const limpio = hora.replace(/[^0-9:]/g, '');

    if (limpio === '0') return '00:00';

    // 🔴 caso "0:00"
    if (/^\d{1}:\d{2}$/.test(limpio)) {
      const [h, m] = limpio.split(':');
      return `${h.padStart(2, '0')}:${m}`;
    }

    return limpio;
  }


  if (typeof hora === 'number') {

    const totalMinutos = Math.round(hora * 24 * 60);

    const horas = String(Math.floor(totalMinutos / 60)).padStart(2, '0');
    const minutos = String(totalMinutos % 60).padStart(2, '0');

    return `${horas}:${minutos}`;
  }

  if (hora instanceof Date) {
    const horas = String(hora.getHours()).padStart(2, '0');
    const minutos = String(hora.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
  }

  return null;
}

async function procesarExcel(data){
    const resultados = [];

    for(const row of data){
            const rut = `${row.RUT}-${row.DV}`;
            const nombre = row.NOMBRE?.trim().toUpperCase();
            const fecha = parseFecha(row.FECHA_JORNADA);

            const codigoTurno = row.CODIGO_TURNO?.trim();

            const horaIngreso = limpiarHora(row.HORARIO_REAL_ENTRADA);
            const horaSalida = limpiarHora(row.HORARIO_REAL_SALIDA);

            if(!rut || !fecha || !horaIngreso || !horaSalida){
                continue;
            }

            const turnoCatalogo = await obtenerTurnoPorCodigo(codigoTurno);

            const esNoche = esTurnoNoche(
                {horaIngreso, horaSalida},
                turnoCatalogo || {codigo: codigoTurno}
            );

            resultados.push({
                rut,
                nombre,
                fecha,
                codigoTurno,
                horaIngreso,
                horaSalida,
                esNoche,
            });
    }
    return resultados;
}
function obtenerRangoFechas(turnos) {
  const fechas = turnos.map(t => t.fecha); // ya viene YYYY-MM-DD

  const min = fechas.sort()[0];
  const max = fechas.sort().reverse()[0];

  return { min, max };
}


module.exports = {
    procesarExcel,
    obtenerRangoFechas,
}