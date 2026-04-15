function validarRut(rutCompleto) {
  if (!rutCompleto) return false;

  const rut = rutCompleto.replace(/\./g, '').replace('-', '');
  
  if (rut.length < 2) return false;

  const cuerpo = rut.slice(0, -1);
  let dv = rut.slice(-1).toUpperCase();

  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += multiplo * parseInt(cuerpo[i]);
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const dvEsperado = 11 - (suma % 11);

  let dvFinal = '';
  if (dvEsperado === 11) dvFinal = '0';
  else if (dvEsperado === 10) dvFinal = 'K';
  else dvFinal = String(dvEsperado);

  return dv === dvFinal;
}
function normalizarRut(rut) {
  return rut.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
}

module.exports ={
    validarRut,
    normalizarRut
}