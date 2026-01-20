const db = require("../config/db");

exports.crear = (empleado, callback) => {
  db.query(
    "INSERT INTO empleado (nombre, email, cargo) VALUES (?, ?, ?)",
    [empleado.nombre, empleado.email, empleado.cargo],
    callback
  );
};

exports.obtenerTodos = callback => {
  db.query("SELECT * FROM empleado", callback);
};
