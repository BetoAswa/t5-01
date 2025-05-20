const express = require('express');
const router = express.Router();
const controller = require('../controllers/codigosController');

// GET /codigos
router.get('/', controller.getCodigos);

// GET /codigos/:id 
router.get('/:id', controller.getCodigoById);

// POST /codigos
router.post('/', controller.insertCodigo);

// DELETE /codigos/:id
router.delete('/:id', controller.deleteCodigo);

module.exports = router;
