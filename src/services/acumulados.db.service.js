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
async function listarAcumulados({rut}) {
  let query = `
    SELECT
    a.rut,
    (
    SELECT t.nombre
    FROM turnos t
    WHERE t.rut = a.rut
    LIMIT 1
)as nombre,
    a.noches_acumuladas,
    a.ultima_fecha
    FROM acumulado_noches a
    WHERE 1=1 `;

  const values = [];
  let i = 1;

  if(rut){
    query += ` AND a.rut = $${i++}`;
    values.push(rut)
  }

  query +=` ORDER BY a.noches_acumuladas DESC`

  const result =  await pool.query(query, values)

  return result.rows
}

module.exports = {
  obtenerAcumulado,
  guardarAcumulado,
  resetearAcumulado,
  listarAcumulados
};