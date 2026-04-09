const pool = require('../db');

async function obtenerTurnoPorCodigo(codigo) {
    console.log(codigo)
    const result = await pool.query(
        `SELECT codigo, hora_inicio, hora_fin, duracion_horas, es_nocturno_base
        FROM turnos_catalogo
        WHERE codigo = $1 AND activo = true`,
        [codigo]);

    if(result.rows.length === 0){
        return null;
    }
    return result.rows[0];
}

module.exports = {
    obtenerTurnoPorCodigo
};