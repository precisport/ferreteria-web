const db = require("../config/db");

// OBTENER PRODUCTOS
exports.obtenerProductos = (req, res) => {
  db.query("SELECT * FROM producto", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

// CREAR PRODUCTO (ADMIN)
exports.crearProducto = (req, res) => {
  const { nombre, descripcion, precio, imagen } = req.body;

  db.query(
    "INSERT INTO producto (nombre, descripcion, precio, imagen) VALUES (?,?,?,?)",
    [nombre, descripcion, precio, imagen],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ id: result.insertId });
    }
  );
};

// EDITAR PRODUCTO
exports.editarProducto = (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, imagen } = req.body;

  db.query(
    "UPDATE producto SET nombre=?, descripcion=?, precio=?, imagen=? WHERE id=?",
    [nombre, descripcion, precio, imagen, id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ ok: true });
    }
  );
};

// ELIMINAR PRODUCTO
exports.eliminarProducto = (req, res) => {
  db.query(
    "DELETE FROM producto WHERE id=?",
    [req.params.id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ ok: true });
    }
  );
};
