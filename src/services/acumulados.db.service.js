const pool = require('../db');

async function obtenerAcumulado(rut) {
  const result = await pool.query(
    'SELECT noches_acumuladas FROM acumulado_noches WHERE rut = $1',
    [rut]
  );

  return result.rows[0]?.noches_acumuladas || 0;
}

async function guardarAcumulado(rut, noches, fecha) {
  await pool.query(
    `INSERT INTO acumulado_noches (rut, noches_acumuladas, ultima_fecha)
     VALUES ($1, $2, $3)
     ON CONFLICT (rut) DO UPDATE
     SET noches_acumuladas = EXCLUDED.noches_acumuladas,
         ultima_fecha = EXCLUDED.ultima_fecha`,
    [rut, noches, fecha]
  );
}

async function resetearAcumulado(rut) {
  await pool.query(
    'DELETE FROM acumulado_noches WHERE rut = $1',
    [rut]
  );
}

module.exports = {
  obtenerAcumulado,
  guardarAcumulado,
  resetearAcumulado
};