const db = require("../config/db");

const Producto = {
  getAll: (callback) => {
    db.query("SELECT * FROM producto", callback);
  },

  create: (producto, callback) => {
    const sql = `
      INSERT INTO producto (nombre, descripcion, precio, stock, imagen)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [
      producto.nombre,
      producto.descripcion,
      producto.precio,
      producto.stock || 0,
      producto.imagen
    ], callback);
  }
};

module.exports = Producto;
