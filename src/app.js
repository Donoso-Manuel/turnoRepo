const express = require('express');
const cors = require('cors');
const turnosRoutes = require('./routes/turnos.routes')
const beneficiosRoutes = require('./routes/beneficios.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/turnos', turnosRoutes)
app.use('/api',beneficiosRoutes)

app.get('/',(req, res)=>{
    res.send('API Funcionando 🚀');
});

module.exports = app;