const pool = require('../db/index')

async function obtenerKPIs({ year, month }) {

  // 📅 rango fechas mes
  const desde = `${year}-${month}-01`;

  const hasta = new Date(year, month, 0)
    .toISOString()
    .split('T')[0];

  // 🔥 1. beneficios pendientes
  const pendientes = await pool.query(`
    SELECT COUNT(*) 
    FROM beneficios
    WHERE LOWER(estado) = 'pendiente'
  `);

  // 🔥 2. total pagados en el mes
  const pagados = await pool.query(
    `
    SELECT COUNT(*) 
    FROM beneficios
    WHERE LOWER(estado) = 'pagado'
    AND fecha_pago BETWEEN $1 AND $2
  `,
    [desde, hasta]
  );

  // 🔥 3. acumulados >= 10
  const acumulados = await pool.query(`
    SELECT COUNT(*) 
    FROM acumulado_noches
    WHERE noches_acumuladas >= 10
  `);

  return {
    pendientes: parseInt(pendientes.rows[0].count),
    pagadosMes: parseInt(pagados.rows[0].count),
    acumuladosCriticos: parseInt(acumulados.rows[0].count)
  };
}
module.exports = {
    obtenerKPIs
};