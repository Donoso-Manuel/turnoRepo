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
async function actualizarEstadoBeneficio(id, estado) {
  const result = await pool.query(
    `UPDATE beneficios
     SET estado = $1
     WHERE id = $2
     RETURNING *`,
    [estado, id]
  );

  return result.rows[0];
}
async function obtenerBeneficioPorId(id) {
  const result = await pool.query(
    `SELECT * FROM beneficios WHERE id = $1`,
    [id]
  );

  return result.rows[0];
}
async function eliminarBeneficiosDesdeFecha(rut, fecha) {
  await pool.query(
    `DELETE FROM beneficios
     WHERE rut = $1 AND fecha_generacion >= $2`,
    [rut, fecha]
  );
}
async function pagarBeneficiosMasivo(ids) {
  const result = await pool.query(
    `UPDATE beneficios
     SET estado = 'PAGADO',
         fecha_pago = NOW()
     WHERE id = ANY($1::int[])
     AND estado = 'PENDIENTE'
     RETURNING *`,
    [ids]
  );

  return result.rows;
}
async function obtenerPagosPorRango(desde, hasta) {
  const result = await pool.query(
    `SELECT 
        b.rut,
        t.nombre,
        b.fecha_generacion,
        b.fecha_pago
     FROM beneficios b
     JOIN turnos t ON t.rut = b.rut
     WHERE b.estado = 'PAGADO'
     AND b.fecha_pago BETWEEN $1 AND $2
     ORDER BY b.rut, b.fecha_pago`,
    [desde, hasta]
  );

  return result.rows;
}
async function obtenerBeneficiosPorIds(ids) {
  const result = await pool.query(
    `SELECT 
        b.id,
        b.rut,
        t.nombre,
        b.fecha_generacion
     FROM beneficios b
     JOIN turnos t ON t.rut = b.rut
     WHERE b.id = ANY($1::int[])
     ORDER BY b.fecha_generacion ASC`,
    [ids]
  );

  return result.rows;
}
async function pagarYObtenerBeneficios(ids, lote) {
  const result = await pool.query(
    `UPDATE beneficios
     SET estado = 'PAGADO',
         fecha_pago = NOW(),
         lote_pago = $2
     WHERE id = ANY($1::int[])
     AND estado = 'PENDIENTE'
     RETURNING id, rut, fecha_generacion`,
    [ids, lote]
  );

  return result.rows;
}
async function obtenerPorLote(lote) {
  const result = await pool.query(
    `SELECT * FROM beneficios WHERE lote_pago = $1`,
    [lote]
  );

  return result.rows;
}
async function eliminarBeneficiosDesde(rut, fecha) {
  await pool.query(
    `DELETE FROM beneficios
     WHERE rut = $1
     AND fecha_generacion >= $2
     AND estado = 'PENDIENTE'`,
    [rut, fecha]
  );
}

module.exports = {
    insertarBeneficios,
    obtenerBeneficiosPorRut,
    eliminarBeneficiosPorRut,
    actualizarEstadoBeneficio,
    obtenerBeneficioPorId,
    eliminarBeneficiosDesdeFecha,
    pagarBeneficiosMasivo,
    obtenerPagosPorRango,
    obtenerBeneficiosPorIds,
    pagarYObtenerBeneficios,
    obtenerPorLote,
    eliminarBeneficiosDesde
}
