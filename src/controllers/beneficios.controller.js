const { obtenerTurnosNocturnosPorRut } = require('../services/turnos.db.service');
const { calcularNochesYBeneficios } = require('../services/beneficios.service');
const { insertarBeneficios, obtenerBeneficiosPorRut, eliminarBeneficiosPorRut } = require('../services/beneficios.db.service');
const {obtenerAcumulado, guardarAcumulado, resetearAcumulado} = require('../services/acumulados.db.service')

const probarBeneficios = async (req, res) => {
  try {
    const { rut } = req.params;
    const reprocesar = req.query.reprocesar === 'true';

    // 🔥 REPROCESO
    if (reprocesar) {
      await eliminarBeneficiosPorRut(rut);
      await resetearAcumulado(rut);
    }

    // 1️⃣ Turnos nocturnos
    const turnos = await obtenerTurnosNocturnosPorRut(rut);

    // 2️⃣ Acumulado actual
    let acumulado = await obtenerAcumulado(rut);

    let contador = acumulado;
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

    // 3️⃣ Insertar beneficios
    await insertarBeneficios(rut, beneficios);

    // 4️⃣ Guardar acumulado final
    const ultimaFecha = turnos.length > 0 ? turnos[turnos.length - 1].fecha : null;

    await guardarAcumulado(rut, contador, ultimaFecha);

    // 5️⃣ Respuesta
    res.json({
      rut,
      totalTurnosNocturnos: turnos.length,
      beneficiosGenerados: beneficios.length,
      nochesRestantes: contador,
      reprocesado: reprocesar
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al calcular beneficios' });
  }
};

module.exports = {
    probarBeneficios
}