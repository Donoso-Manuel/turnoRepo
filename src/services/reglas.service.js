function esTurnoNoche(turnoReal, turnoCatalogo) {
  const { horaIngreso, horaSalida } = turnoReal;

  if (!horaIngreso || !horaSalida) return false;


  if (['LIB', 'SAL'].includes(turnoCatalogo?.codigo)) {
    if (horaSalida < horaIngreso) return true;
    if (horaIngreso >= '18:00') return true;
    return false;
  }

  if (horaSalida < horaIngreso) return true;

  if (turnoCatalogo?.es_nocturno_base) return true;

  if (turnoCatalogo?.duracion_horas >= 10) return true;

  if (horaIngreso >= '18:00') return true;

  return false;
}

module.exports = {
  esTurnoNoche
};