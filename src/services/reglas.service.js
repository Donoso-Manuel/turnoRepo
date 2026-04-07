function esTurnoNoche(turnoReal, turnoCatalogo) {
  const { horaIngreso, horaSalida } = turnoReal;

  if (!horaIngreso || !horaSalida) return false;

  // 🔥 detectar código directo (más seguro)
  const codigo = turnoCatalogo?.codigo;

  // 🟣 CASO ESPECIAL: LIB / SAL
  if (codigo === 'LIB' || codigo === 'SAL') {

    // cruza medianoche
    if (horaSalida < horaIngreso) return true;

    // empieza tarde
    if (horaIngreso >= '18:00') return true;

    return false;
  }

  // 🔵 CASO NORMAL

  if (horaSalida < horaIngreso) return true;

  if (turnoCatalogo?.es_nocturno_base) return true;

  if (turnoCatalogo?.duracion_horas >= 10) return true;

  if (horaIngreso >= '18:00') return true;

  return false;
}

module.exports = {
  esTurnoNoche
};