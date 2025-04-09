// server.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mysql = require('mysql');
const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

const app = express();
const port = 3002;
const dbName = 'pdfdb';

// Campos dinámicos
const campos = ['campo1', 'campo2', 'campo3'];

// Conexión MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: ''
});

// Crea tabla con campos dinámicos
function createTable(callback) {
  let camposSql = campos.map(c => `\`${c}\` VARCHAR(255)`).join(',\n  ');
  camposSql += `,\n  hash VARCHAR(64) NOT NULL,\n  pdf_path VARCHAR(255),\n  details TEXT`;
  const sql = `
    CREATE TABLE IF NOT EXISTS pdfs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ${camposSql}
    )
  `;
  connection.query(sql, err => {
    if (err) throw err;
    console.log("Tabla 'pdfs' lista.");
    callback();
  });
}

// Inicializa BD
function initializeDatabase(callback) {
  connection.query(`SHOW DATABASES LIKE '${dbName}'`, (err, results) => {
    if (err) throw err;
    if (results.length === 0) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(`BD '${dbName}' no existe. Crear? (s/n): `, ans => {
        if (ans.toLowerCase() === 's') {
          connection.query(`CREATE DATABASE ${dbName}`, err2 => {
            if (err2) throw err2;
            console.log(`BD '${dbName}' creada.`);
            connection.changeUser({ database: dbName }, e => {
              if (e) throw e;
              createTable(callback);
              rl.close();
            });
          });
        } else {
          console.log("No se creó la BD.");
          process.exit(0);
        }
      });
    } else {
      connection.changeUser({ database: dbName }, e => {
        if (e) throw e;
        createTable(callback);
      });
    }
  });
}

// Multer (subida individual) - guarda en /public/uploads
const storageSingle = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, path.join(__dirname, 'public/uploads')); },
  filename: (req, file, cb) => { cb(null, file.originalname); }
});
const uploadSingle = multer({ storage: storageSingle }).single('pdfFile');

// Multer (temp en memoria)
const uploadTemp = multer({ storage: multer.memoryStorage() }).single('pdfFile');

// Multer (subida múltiple, memoria)
const uploadMultiple = multer({ storage: multer.memoryStorage() }).array('documents', 10);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ruta inicio
app.get('/', (req, res) => {
  res.render('index');
});

// Ruta buscar
app.get('/search', async (req, res) => {
  const { field, searchText, deepSearch } = req.query;
  const allowedFields = campos.concat(['details']);
  if (!field || !searchText) return res.render('search', { campos: allowedFields, results: [] });

  if (deepSearch === '1') {
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    let results = [];
    try {
      const files = fs.readdirSync(uploadsDir).filter(f => f.toLowerCase().endsWith('.pdf'));
      for (const pdfName of files) {
        const pdfPath = path.join(uploadsDir, pdfName);
        const dataBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdfParse(dataBuffer);
        if (pdfData.text.toLowerCase().includes(searchText.toLowerCase())) {
          let obj = { id: `Archivo: ${pdfName}`, pdf_path: 'uploads/' + pdfName };
          campos.forEach(c => { obj[c] = ''; });
          obj.details = '';
          results.push(obj);
        }
      }
      return res.render('search', { campos: allowedFields, results });
    } catch (err) {
      console.error('Error búsqueda profunda:', err);
      return res.render('search', { campos: allowedFields, results: [] });
    }
  } else {
    if (!allowedFields.includes(field)) return res.render('search', { campos: allowedFields, results: [] });
    connection.query(`SELECT * FROM pdfs WHERE ?? LIKE ?`, [field, `%${searchText}%`], (err, rows) => {
      if (err) return res.render('search', { campos: allowedFields, results: [] });
      res.render('search', { campos: allowedFields, results: rows || [] });
    });
  }
});

// Ruta upload (form)
app.get('/upload', (req, res) => {
  res.render('upload', { file: null, campos, fields: {}, message: null, error: null });
});

// Extraer campos PDF (temp)
app.post('/upload/temp', uploadTemp, async (req, res) => {
  if (!req.file) return res.json({ error: 'Sin archivo.' });
  try {
    const data = await pdfParse(req.file.buffer, { max: 1 });
    const text = data.text || '';
    let extracted = {};
    campos.forEach(c => { extracted[c] = ''; });
    // Ejemplo de regex minimal. Ajustar si se requiere.
    // extracted.campo1 = (text.match(/campo1:\s*(.+)/i) || [])[1] || '';
    // ...
    return res.json({ fields: extracted });
  } catch (e) {
    console.error("Error extrayendo campos:", e);
    return res.json({ error: 'Error al extraer.' });
  }
});

// Guardar (subida individual)
app.post('/upload/save', uploadSingle, (req, res) => {
  if (!req.file) {
    return res.render('upload', {
      file: null, campos, fields: req.body, message: null, error: 'Sin archivo.'
    });
  }
  let hash = '';
  try {
    const buffer = fs.readFileSync(req.file.path);
    hash = crypto.createHash('sha256').update(buffer).digest('hex');
  } catch (e) {
    console.error("Error leyendo archivo:", e);
    return res.render('upload', {
      file: req.file.originalname, campos, fields: req.body, message: null, error: 'Error al leer PDF.'
    });
  }
  connection.query("SELECT id FROM pdfs WHERE hash = ?", [hash], (err, rows) => {
    if (err) {
      console.error("Error consulta:", err);
      return res.render('upload', {
        file: req.file.originalname, campos, fields: req.body, message: null, error: 'Error en BD.'
      });
    }
    if (rows.length > 0) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.render('upload', {
        file: req.file.originalname, campos, fields: req.body, message: null, error: 'Duplicado.'
      });
    }
    const cols = campos.concat(['hash','pdf_path','details']);
    const placeholders = cols.map(() => '?').join(', ');
    const sql = `INSERT INTO pdfs (${cols.join(', ')}) VALUES (${placeholders})`;
    let vals = campos.map(c => req.body[c] || '');
    vals.push(hash);
    let relativePath = req.file.path.replace(/^.*public[\\/]/, '');
    vals.push(relativePath);
    vals.push(req.body.details || '');
    connection.query(sql, vals, err2 => {
      if (err2) {
        console.error("Error insert:", err2);
        return res.render('upload', {
          file: req.file.originalname, campos, fields: req.body, message: null, error: 'Error guardando.'
        });
      }
      res.render('upload', {
        file: req.file.originalname, campos, fields: {}, message: 'Guardado.', error: null
      });
    });
  });
});

// Ruta upload-multiple (form)
app.get('/upload-multiple', (req, res) => {
  res.render('upload-multiple', { uploadedList: [] });
});

// Procesa subida múltiple
app.post('/upload-multiple', uploadMultiple, async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.render('upload-multiple', { uploadedList: [] });
  }
  let results = [];
  const uploadsDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

  for (const file of req.files) {
    let hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    try {
      let [rows] = await new Promise((resolve, reject) => {
        connection.query("SELECT id FROM pdfs WHERE hash = ?", [hash], (err, r) => {
          if (err) reject(err); else resolve([r]);
        });
      });
      if (rows && rows.length > 0) {
        results.push({ file: file.originalname, status: 'Duplicado' });
        continue;
      }
      let destination = path.join(uploadsDir, file.originalname);
      fs.writeFileSync(destination, file.buffer);
      // Extraer campos
      let extracted = {};
      campos.forEach(c => { extracted[c] = ''; });
      // Podrías usar pdfParse para setear extracted según sea necesario
      const cols = campos.concat(['hash','pdf_path']);
      const placeholders = cols.map(() => '?').join(', ');
      const sql = `INSERT INTO pdfs (${cols.join(', ')}) VALUES (${placeholders})`;
      let vals = campos.map(c => extracted[c] || '');
      vals.push(hash);
      let relPath = destination.replace(/^.*public[\\/]/, '');
      vals.push(relPath);
      await new Promise((resolve, reject) => {
        connection.query(sql, vals, err2 => {
          if (err2) reject(err2); else resolve();
        });
      });
      results.push({ file: file.originalname, status: 'Guardado' });
    } catch (e) {
      console.error("Error guardando:", e);
      results.push({ file: file.originalname, status: 'Error' });
    }
  }
  res.render('upload-multiple', { uploadedList: results });
});

// Inicia
initializeDatabase(() => {
  app.listen(port, () => console.log(`Servidor en puerto ${port}`));
});
