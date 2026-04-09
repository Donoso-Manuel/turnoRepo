const pool = require('../db');

const {eliminarBeneficiosDesdeFecha, insertarBeneficios} =  require('./beneficios.db.service')
const {obtenerTurnosDesdeFecha, obtenerAcumuladoAntesDeFecha, obtenerTurnosNocturnosPorRango} = require('./turnos.db.service')
const {obtenerAcumulado, guardarAcumulado} =  require('./acumulados.db.service')


async function procesarBeneficiosPorRango(fechaInicio, fechaFin) {

  const turnos = await obtenerTurnosNocturnosPorRango(fechaInicio, fechaFin);

  // 🧠 agrupar por rut
  const agrupados = {};

  for (const t of turnos) {
    if (!agrupados[t.rut]) {
      agrupados[t.rut] = [];
    }
    agrupados[t.rut].push(t);
  }

  let totalBeneficios = 0;

  // 🔁 recorrer cada rut
  for (const rut in agrupados) {

    const turnosRut = agrupados[rut].sort(
      (a, b) => new Date(a.fecha) - new Date(b.fecha)
    );

    // 🔍 obtener acumulado
    const acumulado = await obtenerAcumulado(rut);

    const nochesPrevias = acumulado?.noches_acumuladas || 0;
    const ultimaFecha = acumulado?.ultima_fecha;

    // 🔥 filtrar solo nuevos turnos
    const turnosFiltrados = turnosRut.filter(t => {
      if (!ultimaFecha) return true;
      return t.fecha > ultimaFecha;
    });

    if (turnosFiltrados.length === 0) continue;

    // 🧠 calcular beneficios
    const resultado = calcularNochesYBeneficios(
      turnosFiltrados,
      nochesPrevias
    );

    // 💾 guardar beneficios
    await insertarBeneficios(rut, resultado.beneficios);

    // 📅 nueva ultima fecha
    const ultimaFechaNueva =
      turnosFiltrados[turnosFiltrados.length - 1].fecha;

    // 💾 actualizar acumulado
    await guardarAcumulado(
      rut,
      resultado.nochesRestantes,
      ultimaFechaNueva
    );

    totalBeneficios += resultado.beneficios.length;
  }

  return {
    ok: true,
    totalBeneficios
  };
}

function calcularNochesYBeneficios(turnos, acumuladoInicial = 0){
    let contador = acumuladoInicial;
    let beneficios = [];

    for(const t of turnos){
        contador++;

        if(contador === 12){
            beneficios.push({
                fecha_generacion: t.fecha
            });

            contador = 0;
        }
    }
    return{
        nochesRestantes: contador,
        beneficios
    };
}
async function reprocesarDesdeFecha(rut, fecha) {

  let contador = await obtenerAcumuladoAntesDeFecha(rut, fecha);

  await eliminarBeneficiosDesdeFecha(rut, fecha);

  const turnos = await obtenerTurnosDesdeFecha(rut, fecha);

  let beneficios = [];

  for (const t of turnos) {
    contador++;

    if (contador === 12) {
      beneficios.push({
        fecha_generacion: t.fecha
      });

      contador = 0;
    }
  }

  await insertarBeneficios(rut, beneficios);

  return {
    reprocesado: true,
    desde: fecha,
    beneficiosGenerados: beneficios.length,
    nochesRestantes: contador
  };
}
module.exports ={
    calcularNochesYBeneficios,
    reprocesarDesdeFecha,
    procesarBeneficiosPorRango
}