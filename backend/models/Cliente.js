const db = require("../config/db");

exports.crear = (cliente, callback) => {
  db.query(
    "INSERT INTO cliente (nombre, email, telefono) VALUES (?, ?, ?)",
    [cliente.nombre, cliente.email, cliente.telefono],
    callback
  );
};

exports.obtenerTodos = callback => {
  db.query("SELECT * FROM cliente", callback);
};
