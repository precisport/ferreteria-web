const db = require("../config/db");

// OBTENER PRODUCTOS
exports.obtenerProductos = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM producto");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

// CREAR PRODUCTO
exports.crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, imagen } = req.body;

    const [result] = await db.query(
      "INSERT INTO producto (nombre, descripcion, precio, imagen) VALUES (?,?,?,?)",
      [nombre, descripcion, precio, imagen]
    );

    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Error al crear producto" });
  }
};

// EDITAR PRODUCTO
exports.editarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen } = req.body;

    await db.query(
      "UPDATE producto SET nombre=?, descripcion=?, precio=?, imagen=? WHERE id_producto=?",
      [nombre, descripcion, precio, imagen, id]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al editar producto" });
  }
};

// ELIMINAR PRODUCTO
exports.eliminarProducto = async (req, res) => {
  try {
    await db.query("DELETE FROM producto WHERE id_producto=?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar producto" });
  }
};
