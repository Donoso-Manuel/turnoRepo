const {obtenerKPIs} = require('../services/dashboard.db.service')

const getKPIs = async(req, res)=>{
    try{
        const {year, month} = req.query;

        const data =  await obtenerKPIs({year, month});

        res.json(data)
    }catch(error){
        console.error(error)
        res.status(500).json({error: "Error al obtener los KPIs"})
    }
}
module.exports = {
    getKPIs
}