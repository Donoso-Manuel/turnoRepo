function calcularHoras(horaInicio, horaFin) {
  const [h1, m1] = horaInicio.split(':').map(Number);
  const [h2, m2] = horaFin.split(':').map(Number);

  let inicio = h1 * 60 + m1;
  let fin = h2 * 60 + m2;

  if (fin < inicio) {
    fin += 24 * 60;
  }

  return (fin - inicio) / 60;
}

function calcularSalidaEsperada(horaIngreso, duracionBase) {
  const [h, m] = horaIngreso.split(':').map(Number);

  let totalMin = h * 60 + m + duracionBase * 60;
  totalMin = totalMin % (24 * 60);

  const horas = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const minutos = String(totalMin % 60).padStart(2, '0');

  return `${horas}:${minutos}`;
}


function esTurnoNoche(turnoReal, turnoCatalogo) {
  const { horaIngreso, horaSalida } = turnoReal;

  if (!horaIngreso || !horaSalida) return false;

  const codigo = turnoCatalogo?.codigo;

  const cruzaMedianoche = horaSalida < horaIngreso;
  const salidaTardia = horaSalida >= '01:30';

  // 🟣 LIB / SAL
  if (codigo === 'LIB' || codigo === 'SAL') {
    return cruzaMedianoche && salidaTardia;
  }

  const duracionBase = turnoCatalogo?.duracion_horas || 0;

  const salidaEsperada = calcularSalidaEsperada(horaIngreso, duracionBase);

  // 🔴 IMPORTANTE:
  // evaluar SOLO hasta la salida esperada (ignorar horas extra)
  const salidaEvaluada = salidaEsperada;

  const cruzaMedianocheEvaluado = salidaEvaluada < horaIngreso;
  const salidaTardiaEvaluada = salidaEvaluada >= '01:30';

  // 🌙 CASO 1: turno base nocturno
  if (turnoCatalogo?.es_nocturno_base) {
    return cruzaMedianocheEvaluado && salidaTardiaEvaluada;
  }

  // 🔵 CASO 2: turno base diurno
  // SOLO si su jornada efectiva (sin extra) es nocturna
  if (cruzaMedianocheEvaluado && salidaTardiaEvaluada) {
    return true;
  }

  return false;
}

module.exports = {
  esTurnoNoche
};