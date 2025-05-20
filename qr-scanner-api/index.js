const express = require('express');
const cors = require('cors');
const app = express();
const codigosRoutes = require('./routes/codigos');

// Middleware para CORS y JSON
app.use(cors());
app.use(express.json());

// Middleware para validar encabezados
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  const accept = req.headers['accept'] || '';

  
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (!contentType.includes('application/json')) {
      return res.status(415).json({
        error: 'Content-Type must include application/json',
      });
    }
  }

  // Validar Accept solo en peticiones que no son del navegador
  if (
    accept &&
    !accept.includes('application/json') &&
    !accept.includes('*/*') &&
    !accept.includes('text/html')
  ) {
    return res.status(406).json({
      error: 'Accept must include application/json',
    });
  }

  next();
});



// Rutas
app.use('/codigos', codigosRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
