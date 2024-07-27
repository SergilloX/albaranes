const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Configurar middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Conectar a la base de datos SQLite
let db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

// Crear tabla albaranes
db.run(`CREATE TABLE albaranes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  albaran TEXT NOT NULL,
  fecha TEXT NOT NULL,
  kilos REAL NOT NULL,
  importe REAL NOT NULL
)`);

// Ruta para obtener todos los albaranes
app.get('/api/albaranes', (req, res) => {
  const sql = 'SELECT * FROM albaranes ORDER BY id';
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// Ruta para añadir un nuevo albarán
app.post('/api/albaranes', (req, res) => {
  const { albaran, fecha, kilos, importe } = req.body;
  const sql = 'INSERT INTO albaranes (albaran, fecha, kilos, importe) VALUES (?, ?, ?, ?)';
  db.run(sql, [albaran, fecha, kilos, importe], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: { id: this.lastID, ...req.body } });
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
