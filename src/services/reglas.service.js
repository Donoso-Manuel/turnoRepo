function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
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

  const ingresoMin = horaAMinutos(horaIngreso);
  const salidaMinReal = horaAMinutos(horaSalida);

  // 🟣 LIB / SAL (siempre con hora REAL)
  if (codigo === 'LIB' || codigo === 'SAL') {
    const cruza = salidaMinReal < ingresoMin;
    const salidaReal = cruza ? salidaMinReal + 1440 : salidaMinReal;

    return cruza && salidaReal >= (24 * 60 + 90); // 01:30
  }

  const duracionBase = turnoCatalogo?.duracion_horas || 0;
  const salidaEsperada = calcularSalidaEsperada(horaIngreso, duracionBase);

  const salidaMinEsperada = horaAMinutos(salidaEsperada);

  // 🔴 evaluar cruce para ambos escenarios
  const cruzaReal = salidaMinReal < ingresoMin;
  const salidaRealAjustada = cruzaReal
    ? salidaMinReal + 1440
    : salidaMinReal;

  const cruzaEsperada = salidaMinEsperada < ingresoMin;
  const salidaEsperadaAjustada = cruzaEsperada
    ? salidaMinEsperada + 1440
    : salidaMinEsperada;

  const HORA_MIN_NOCTURNA = 24 * 60 + 90; // 01:30

  // 🌙 CASO 1: turno base nocturno → VALIDAR CON REAL
  if (turnoCatalogo?.es_nocturno_base) {

    if (!cruzaReal) return false;

    if (salidaRealAjustada < HORA_MIN_NOCTURNA) return false;

    return true;
  }

  // 🔵 CASO 2: turno base diurno → VALIDAR CON ESPERADO (evitar horas extra)
  if (cruzaEsperada && salidaEsperadaAjustada >= HORA_MIN_NOCTURNA) {
    return true;
  }

  return false;
}

module.exports = {
  esTurnoNoche
};