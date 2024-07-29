const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const port = 3001;

// Configurar middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Conectar a la base de datos SQLite
const absolutePath = path.join(__dirname, 'albaranes.db');
let db = new sqlite3.Database(absolutePath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

// Agregar columna invernadero a la tabla albaranes si no existe
db.run(`ALTER TABLE albaranes ADD COLUMN invernadero TEXT`, (err) => {
  if (err) {
    if (err.message.includes("duplicate column name")) {
      console.log('La columna invernadero ya existe.');
    } else {
      console.error('Error al agregar la columna invernadero:', err.message);
    }
  } else {
    console.log('Columna invernadero agregada a la tabla albaranes.');
  }
});

// Crear tabla albaranes si no existe
db.run(`CREATE TABLE IF NOT EXISTS albaranes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  albaran TEXT NOT NULL,
  fecha TEXT NOT NULL,
  kilos REAL NOT NULL,
  importe REAL NOT NULL,
  invernadero TEXT
)`, (err) => {
  if (err) {
    console.error('Error al crear la tabla de albaranes:', err.message);
  } else {
    console.log('Tabla de albaranes creada o ya existe.');
  }
});

// Crear tabla cobros si no existe
db.run(`CREATE TABLE IF NOT EXISTS cobros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  importe REAL NOT NULL
)`, (err) => {
  if (err) {
    console.error('Error al crear la tabla de cobros:', err.message);
  } else {
    console.log('Tabla de cobros creada o ya existe.');
  }
});

// Crear tabla gastos si no existe
db.run(`CREATE TABLE IF NOT EXISTS gastos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  concepto TEXT NOT NULL,
  fecha TEXT NOT NULL,
  importe REAL NOT NULL
)`, (err) => {
  if (err) {
    console.error('Error al crear la tabla de gastos:', err.message);
  } else {
    console.log('Tabla de gastos creada o ya existe.');
  }
});

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
  const { albaran, fecha, kilos, importe, invernadero } = req.body;
  const sql = 'INSERT INTO albaranes (albaran, fecha, kilos, importe, invernadero) VALUES (?, ?, ?, ?, ?)';
  db.run(sql, [albaran, fecha, kilos, importe, invernadero], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: { id: this.lastID, albaran, fecha, kilos, importe, invernadero } });
  });
});

// Ruta para eliminar un albarán
app.delete('/api/albaranes/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM albaranes WHERE id = ?';
  db.run(sql, [id], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'Albarán eliminado' });
  });
});

// Ruta para obtener todos los cobros
app.get('/api/cobros', (req, res) => {
  const sql = 'SELECT * FROM cobros ORDER BY id';
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// Ruta para añadir un nuevo cobro
app.post('/api/cobros', (req, res) => {
  const { fecha, importe } = req.body;
  const sql = 'INSERT INTO cobros (fecha, importe) VALUES (?, ?)';
  db.run(sql, [fecha, importe], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: { id: this.lastID, fecha, importe } });
  });
});

// Ruta para eliminar un cobro
app.delete('/api/cobros/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM cobros WHERE id = ?';
  db.run(sql, [id], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'Cobro eliminado' });
  });
});

// Ruta para obtener todos los gastos
app.get('/api/gastos', (req, res) => {
  const sql = 'SELECT * FROM gastos ORDER BY id';
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// Ruta para añadir un nuevo gasto
app.post('/api/gastos', (req, res) => {
  const { concepto, fecha, importe } = req.body;
  const sql = 'INSERT INTO gastos (concepto, fecha, importe) VALUES (?, ?, ?)';
  db.run(sql, [concepto, fecha, importe], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: { id: this.lastID, concepto, fecha, importe } });
  });
});

// Ruta para añadir múltiples gastos
app.post('/api/gastos/multiple', (req, res) => {
  const gastos = req.body;
  const sql = 'INSERT INTO gastos (concepto, fecha, importe) VALUES (?, ?, ?)';
  const stmt = db.prepare(sql);

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    for (const gasto of gastos) {
      stmt.run(gasto.concepto, gasto.fecha, gasto.importe, (err) => {
        if (err) {
          db.run("ROLLBACK");
          res.status(400).json({ error: err.message });
          return;
        }
      });
    }
    db.run("COMMIT", (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
      } else {
        res.json({ message: 'Gastos añadidos correctamente' });
      }
    });
  });

  stmt.finalize();
});

// Ruta para eliminar un gasto
app.delete('/api/gastos/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM gastos WHERE id = ?';
  db.run(sql, [id], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'Gasto eliminado' });
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
