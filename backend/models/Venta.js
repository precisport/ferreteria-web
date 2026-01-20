const db = require("../config/db");

exports.crearVenta = (venta, callback) => {
  db.query(
    "INSERT INTO venta (total, id_cliente, id_empleado) VALUES (?, ?, ?)",
    [venta.total, venta.id_cliente, venta.id_empleado],
    callback
  );
};

exports.crearDetalle = (detalle, callback) => {
  db.query(
    "INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES (?, ?, ?, ?)",
    [
      detalle.id_venta,
      detalle.id_producto,
      detalle.cantidad,
      detalle.subtotal
    ],
    callback
  );
};

exports.obtenerVentas = callback => {
  db.query(
    `SELECT v.id_venta, v.fecha, v.total,
            c.nombre AS cliente,
            e.nombre AS empleado
     FROM venta v
     JOIN cliente c ON v.id_cliente = c.id_cliente
     JOIN empleado e ON v.id_empleado = e.id_empleado`,
    callback
  );
};
