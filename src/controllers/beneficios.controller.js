const XLSX = require('xlsx');
const { obtenerTurnosNocturnosPorRut } = require('../services/turnos.db.service');
const { calcularNochesYBeneficios, reprocesarDesdeFecha } = require('../services/beneficios.service');
const { insertarBeneficios, obtenerBeneficiosPorRut, eliminarBeneficiosPorRut, actualizarEstadoBeneficio, obtenerBeneficioPorId, obtenerPagosPorRango, pagarBeneficiosMasivo } = require('../services/beneficios.db.service');
const {obtenerAcumulado, guardarAcumulado, resetearAcumulado} = require('../services/acumulados.db.service')
const {obtenerBeneficiosPorIds, pagarYObtenerBeneficios, obtenerPorLote} = require('../services/beneficios.db.service')

const probarBeneficios = async (req, res) => {
  try {
    const { rut } = req.params;
    const reprocesar = req.query.reprocesar === 'true';

    // 🔥 REPROCESO
    if (reprocesar) {
      await eliminarBeneficiosPorRut(rut);
      await resetearAcumulado(rut);
    }

    // 1️⃣ Turnos nocturnos
    const turnos = await obtenerTurnosNocturnosPorRut(rut);

    // 2️⃣ Acumulado actual
    let acumulado = await obtenerAcumulado(rut);

    let contador = acumulado;
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

    const ultimaFecha = turnos.length > 0 ? turnos[turnos.length - 1].fecha : null;

    await guardarAcumulado(rut, contador, ultimaFecha);

    // 5️⃣ Respuesta
    res.json({
      rut,
      totalTurnosNocturnos: turnos.length,
      beneficiosGenerados: beneficios.length,
      nochesRestantes: contador,
      reprocesado: reprocesar
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al calcular beneficios' });
  }
};
const listarBeneficios = async(req, res) =>{
  try{
    const {rut} =req.params;

    const beneficios = await obtenerBeneficiosPorRut(rut)

    res.json({
      rut,
      total: beneficios.length,
      beneficios
    });
  }catch(error){
    console.error(error);
    res.status(500).json({error: "Error al Obtener los Beneficios"})
  }
}
const pagarBeneficio =  async(req, res)=>{
  try{
    const {id} = req.params;

    const beneficio = await obtenerBeneficioPorId(id)

    if(!beneficio){
      return res.status(404).json({Error: "Beneficio no encontrado"})
    }

    if(beneficio.estado !== "PENDIENTE"){
      return res.status(400).json({
        error:`El beneficio ya fue procesado como ${beneficio.estado}` 
      });
    }

    const actualizado =  await actualizarEstadoBeneficio(id,"PAGADO");

    if(!actualizado){
      return res.status(404).json({error: "Beneficio no Encontrado"})
    }
    res.json({
      mensaje: "Beneficio Pagado",
      Beneficio: actualizado
    });
  }catch(error){
    console.error(error);
    res.status(500).json({error: "Error al pagar el beneficio"})
  }
}
const usarBeneficio =  async(req, res) =>{
  try{
    const {id} = req.params;

    const beneficio = await obtenerBeneficioPorId(id)

    if(!beneficio){
      return res.status(404).json({Error: "Beneficio no encontrado"})
    }

    if(beneficio.estado !== "PENDIENTE"){
      return res.status(400).json({
        error:`El beneficio ya fue procesado como ${beneficio.estado}` 
      });
    }

    const actualizado = await actualizarEstadoBeneficio(id, "USADO");

    if(!actualizado){
      return res.status(404).json({error: "Beneficio no encontrado"})
    }
    res.json({
      mensaje: "Beneficio Usado(descanso)",
      beneficios: actualizado
    });
  }catch(error){
    console.error(error);
    res.status(500).json({error: "Error al usar el beneficio"})
  }
}
const reprocesarDesde = async (req, res) => {
  try {
    const { rut } = req.params;
    const { fecha } = req.body;

    if (!fecha) {
      return res.status(400).json({ error: 'Debe enviar fecha' });
    }

    const resultado = await reprocesarDesdeFecha(rut, fecha);

    res.json({
      rut,
      ...resultado
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en reproceso' });
  }
};
const exportarPagosHistorico = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Debe enviar desde y hasta' });
    }

    const data = await obtenerPagosPorRango(desde, hasta);

    const formato = data.map(d => ({
      RUT: d.rut,
      NOMBRE: d.nombre,
      FECHA_GENERACION: d.fecha_generacion,
      FECHA_PAGO: d.fecha_pago
    }));

    const worksheet = XLSX.utils.json_to_sheet(formato);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial Pagos');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=historial_pagos.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
};
const pagarMasivo = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Debe enviar un array de IDs'
      });
    }

    const beneficiosPagados = await pagarBeneficiosMasivo(ids);

    res.json({
      mensaje: 'Pago masivo realizado',
      totalPagados: beneficiosPagados.length,
      beneficios: beneficiosPagados
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en pago masivo' });
  }
};
const exportarSeleccionados = async (req, res) => {
  try {
    const { ids } = req.body;

    // 🛑 validación
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Debe enviar un array de IDs'
      });
    }

    // 📦 obtener datos
    const data = await obtenerBeneficiosPorIds(ids);

    if (data.length === 0) {
      return res.status(404).json({
        error: 'No se encontraron beneficios'
      });
    }

    // 🧾 formato Excel
    const formato = data.map(d => ({
      RUT: d.rut,
      NOMBRE: d.nombre,
      FECHA: d.fecha_generacion,
      MONTO: 10000 // 🔥 puedes cambiar después
    }));

    const worksheet = XLSX.utils.json_to_sheet(formato);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pagos');

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    });

    // 📤 respuesta descarga
    res.setHeader('Content-Disposition', 'attachment; filename=pagos_seleccionados.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al exportar Excel' });
  }
};
const exportarYPagar = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Debe enviar IDs'
      });
    }

    // 🏷️ generar lote único
    const lote = `LOTE-${Date.now()}`;

    // 💰 pagar + obtener datos
    const data = await pagarYObtenerBeneficios(ids, lote);

    if (data.length === 0) {
      return res.status(400).json({
        error: 'No hay beneficios pendientes para pagar'
      });
    }

    // 🧾 formato Excel
    const formato = data.map(d => ({
      RUT: d.rut,
      FECHA: d.fecha_generacion,
      LOTE: lote,
      MONTO: 10000 // 🔥 configurable después
    }));

    const worksheet = XLSX.utils.json_to_sheet(formato);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pagos');

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    });

    // 📤 descarga
    res.setHeader('Content-Disposition', `attachment; filename=pagos_${lote}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en proceso de pago' });
  }
};
const obtenerLote = async (req, res) => {
  const { lote } = req.params;

  const data = await obtenerPorLote(lote);

  res.json({
    lote,
    total: data.length,
    beneficios: data
  });
};
const exportarPorLote = async (req, res) => {
  try {
    const { lote } = req.params;

    const data = await obtenerPorLote(lote);

    if (data.length === 0) {
      return res.status(404).json({
        error: 'No hay datos para este lote'
      });
    }

    const formato = data.map(d => ({
      RUT: d.rut,
      FECHA: d.fecha_generacion,
      FECHA_PAGO: d.fecha_pago,
      LOTE: d.lote_pago,
      MONTO: 10000
    }));

    const worksheet = XLSX.utils.json_to_sheet(formato);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lote');

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    });

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=lote_${lote}.xlsx`
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.send(buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al exportar lote' });
  }
};

module.exports = {
    probarBeneficios,
    listarBeneficios,
    usarBeneficio,
    pagarBeneficio,
    reprocesarDesde,
    exportarPagosHistorico,
    pagarMasivo,
    exportarSeleccionados,
    exportarYPagar,
    obtenerLote,
    exportarPorLote
}