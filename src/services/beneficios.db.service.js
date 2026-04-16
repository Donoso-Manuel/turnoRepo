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
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 🔥 UPDATE corregido
    const updateResult = await client.query(
      `UPDATE beneficios
       SET estado = 'PAGADO',
           fecha_pago = NOW(),
           lote_pago = $2
       WHERE id = ANY($1::int[])
       AND LOWER(estado) = 'pendiente'`,
      [ids, lote]
    );

    console.log("Filas actualizadas:", updateResult.rowCount);

    // 🔥 SELECT sin duplicados
    const result = await client.query(
      `SELECT DISTINCT ON (b.id)
          b.id,
          b.rut,
          t.nombre,
          b.fecha_generacion
       FROM beneficios b
       LEFT JOIN turnos t ON t.rut = b.rut
       WHERE b.id = ANY($1::int[])
       ORDER BY b.id, t.fecha DESC`,
      [ids]
    );

    await client.query('COMMIT');

    return result.rows;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
async function obtenerPorLote(lote) {
const result = await pool.query(
    `SELECT 
        b.id,
        b.rut,
        (
        SELECT t.nombre
        FROM turnos t
        WHERE t.rut = b.rut
        LIMIT 1
) as nombre,
        b.fecha_generacion,
        b.fecha_pago
     FROM beneficios b
     WHERE b.lote_pago = $1
     ORDER BY nombre, b.fecha_generacion`,
    [lote]
  );

  return result.rows;
}
async function obtenerLotes(desde, hasta) {
  let query= `
    SELECT
    lote_pago,
    COUNT(*) as cantidad,
    MIN(fecha_pago) as fecha_pago
    FROM beneficios
    WHERE lote_pago is NOT NULL`;

    const params = []

    if(desde && hasta){
      query += ` AND fecha_pago BETWEEN $1 AND $2 `;
      params.push(desde, hasta)
    }

    query += ` GROUP BY lote_pago
              ORDER BY fecha_pago DESC`;
    const result =  await pool.query(query,params)
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
async function obtenerBeneficios({ rut, estado, desde, hasta, limit = 10, page = 1, exportar }) {

  const offset = (page - 1) * limit;
  const exportando = exportar === true || exportar === 'true'

  let query = `
    SELECT DISTINCT ON (b.id)
      b.id,
      b.rut,
      t.nombre,
      b.fecha_generacion,
      b.estado,
      b.fecha_pago,
      b.lote_pago
    FROM beneficios b
    LEFT JOIN turnos t ON t.rut = b.rut
    WHERE 1=1
  `;

  const values = [];
  let i = 1;

  if (rut) {
    query += ` AND b.rut = $${i++}`;
    values.push(rut);
  }

  if (estado) {
    query += ` AND LOWER(b.estado) = LOWER($${i++})`;
    values.push(estado);
  }

  if (desde && hasta) {
    query += ` AND b.fecha_generacion BETWEEN $${i++} AND $${i++}`;
    values.push(desde, hasta);
  }

  query += ` ORDER BY b.id DESC`;

  if(!exportar){
    query += ` LIMIT $${i++} OFFSET $${i++}`;
    values.push(limit, offset);
  }

  const result = await pool.query(query, values);


  // 🔥 total registros (para frontend)
  const totalResult = await pool.query(
    `SELECT COUNT(*) FROM beneficios`
  );

  return {
    data: result.rows,
    total: parseInt(totalResult.rows[0].count)
  };
}
module.exports = {
    insertarBeneficios,
    eliminarBeneficiosPorRut,
    actualizarEstadoBeneficio,
    obtenerBeneficioPorId,
    obtenerBeneficiosPorIds,
    pagarYObtenerBeneficios,
    obtenerPorLote,
    eliminarBeneficiosDesde,
    obtenerBeneficios,
    obtenerLotes,
}
