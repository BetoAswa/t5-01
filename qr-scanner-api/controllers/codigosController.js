const sqlite3 = require('sqlite3').verbose();
const { randomUUID } = require('crypto');

const db = new sqlite3.Database('./qr-scanner.db');

// Crear tabla 
db.run(`
  CREATE TABLE IF NOT EXISTS codigos (
    id TEXT PRIMARY KEY NOT NULL,
    data TEXT NOT NULL,
    type TEXT NOT NULL
  )
`);

// GET /codigos
const getCodigos = (req, res) => {
  db.all('SELECT * FROM codigos', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};
{}
// GET /codigos/:id
const getCodigoById = (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM codigos WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Código no encontrado' });
    res.json(row);
  });
};

// POST /codigos
const insertCodigo = (req, res) => {
  const { data, type } = req.body;
  const id = randomUUID();

  if (!data || !type) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  db.run(
    'INSERT INTO codigos (id, data, type) VALUES (?, ?, ?)',
    [id, data, type],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, data, type });
    }
  );
};

// DELETE /codigos/:id
const deleteCodigo = (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM codigos WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Código no encontrado' });
    }

    res.json({ message: 'Código eliminado correctamente' });
  });
};

module.exports = {
  getCodigos,
  getCodigoById,
  insertCodigo,
  deleteCodigo,
};
