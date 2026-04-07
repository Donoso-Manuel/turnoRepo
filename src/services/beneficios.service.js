const pool = require('../db');

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
module.exports ={
    calcularNochesYBeneficios,
}