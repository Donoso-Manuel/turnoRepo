const pool = require('../db');


async function existenTurnosEnRango(fechaInicio, fechaFin) {
  
  console.log(fechaFin, fechaFin)
  const result = await pool.query(
    `SELECT COUNT(*) 
     FROM turnos 
     WHERE fecha BETWEEN $1 AND $2`,
    [fechaInicio, fechaFin]
  );

  return parseInt(result.rows[0].count) > 0;
}

async function insertarTurnos(turnos) {
  const client = await pool.connect();

  try{
    await client.query('BEGIN');

    for(const t of turnos){
      await client.query(

        `INSERT INTO turnos
        (rut, nombre, fecha, codigo_turno, hora_ingreso, hora_salida, es_noche)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (rut, fecha) DO UPDATE
        SET
          nombre = EXCLUDED.nombre,
          codigo_turno = EXCLUDED.codigo_turno,
          hora_ingreso = EXCLUDED.hora_ingreso,
          hora_salida = EXCLUDED.hora_salida,
          es_noche = EXCLUDED.es_noche`,
      [
        t.rut,
        t.nombre,
        t.fecha,
        t.codigoTurno,
        t.horaIngreso,
        t.horaSalida,
        t.esNoche
      ]
    );
    }
    await client.query('COMMIT');
  }catch(error){
    await client.query('ROLLBACK');
    throw error;
  }finally{
    client.release();
  }
}

async function eliminarTurnoEnRango(fechaInicio, fechaFin) {
  await pool.query(
    'DELETE FROM turnos WHERE fecha BETWEEN $1 AND $2',
    [fechaInicio, fechaFin]
  );
  
}

async function obtenerTurnosNocturnosPorRut(rut) {
  const result = await pool.query(
    `SELECT fecha FROM turnos 
    WHERE rut = $1 AND es_noche = true
    ORDER BY  fecha ASC `,
    [rut]
    );
  return result.rows;
}
async function obtenerTurnoPorId(id) {
  const result = await pool.query(
    `SELECT * FROM turnos WHERE id = $1`,
    [id]
  );

  return result.rows[0];
}
async function actualizarTurno(id, datos) {
  const {horaIngreso, horaSalida, esNoche} = datos;

  const result =  await pool.query(
    `UPDATE turnos
     SET hora_ingreso = $1,
         hora_salida = $2,
         es_noche = $3
     WHERE id = $4
     RETURNING *`,
     [horaIngreso, horaSalida, esNoche, id]
  );
  return result.rows[0];
}
async function obtenerTurnosDesdeFecha(rut, fecha) {
  const result = await pool.query(
    `SELECT fecha
     FROM turnos
     WHERE rut = $1
     AND es_noche = true
     AND fecha >= $2
     ORDER BY fecha ASC`,
    [rut, fecha]
  );

  return result.rows;
}
async function obtenerAcumuladoAntesDeFecha(rut, fecha) {
  const result = await pool.query(
    `SELECT COUNT(*) as total
     FROM turnos
     WHERE rut = $1
     AND es_noche = true
     AND fecha < $2`,
    [rut, fecha]
  );

  return parseInt(result.rows[0].total);
}
async function insertarTurnoManualDB(t) {
  await pool.query(
    `INSERT INTO turnos
    (rut, nombre, fecha, codigo_turno, hora_ingreso, hora_salida, es_noche, origen)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (rut, fecha) DO UPDATE
    SET
      nombre = EXCLUDED.nombre,
      codigo_turno = EXCLUDED.codigo_turno,
      hora_ingreso = EXCLUDED.hora_ingreso,
      hora_salida = EXCLUDED.hora_salida,
      es_noche = EXCLUDED.es_noche,
      origen = 'MANUAL'`,
    [
      t.rut,
      t.nombre,
      t.fecha,
      t.codigoTurno,
      t.horaIngreso,
      t.horaSalida,
      t.esNoche,
      t.origen
    ]
  );
}

async function obtenerTurnosNocturnosPorRango(fechaInicio, fechaFin) {
  const result =  await pool.query(
    `SELECT rut, fecha
    FROM turnos
    WHERE es_noche = true
    AND fecha BETWEEN $1 AND $2
    ORDER BY rut, fecha ASC`,
    [fechaInicio, fechaFin]
  );
  return result.rows;
}

module.exports = {
  existenTurnosEnRango,
  insertarTurnos,
  eliminarTurnoEnRango,
  obtenerTurnosNocturnosPorRut,
  obtenerTurnoPorId,
  actualizarTurno,
  obtenerTurnosDesdeFecha,
  obtenerAcumuladoAntesDeFecha,
  insertarTurnoManualDB,
  obtenerTurnosNocturnosPorRango
};