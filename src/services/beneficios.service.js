const pool = require('../db');

const {eliminarBeneficiosDesdeFecha, insertarBeneficios} =  require('./beneficios.db.service')
const {obtenerTurnosDesdeFecha, obtenerAcumuladoAntesDeFecha} = require('./turnos.db.service')

function calcularNochesYBeneficios(turnos){
    let contador = 0;
    let beneficios = [];

    for(const t of turnos){
        contador++;

        if(contador === 4){
            beneficios.push({
                fecha_generacion: t.fecha
            });

            contador = 0;
        }
    }
    return{
        totalNoches: turnos.length,
        beneficiosGenerados: beneficios.length,
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
    reprocesarDesdeFecha
}