const pool = require('../db')

async function insertarBeneficios(rut, beneficios) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const b of beneficios) {
      await client.query(
        `INSERT INTO beneficios (rut, fecha_generacion)
         VALUES ($1, $2)
         ON CONFLICT (rut, fecha_generacion) DO NOTHING`,
        [rut, b.fecha_generacion]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
async function obtenerBeneficiosPorRut(rut) {
  const result = await pool.query(
    `SELECT id, fecha_generacion, estado
     FROM beneficios
     WHERE rut = $1
     ORDER BY fecha_generacion ASC`,
    [rut]
  );

  return result.rows;
}
async function eliminarBeneficiosPorRut(rut) {
  await pool.query(
    'DELETE FROM beneficios WHERE rut = $1',
    [rut]
  );
}

module.exports = {
    insertarBeneficios,
    obtenerBeneficiosPorRut,
    eliminarBeneficiosPorRut
}
