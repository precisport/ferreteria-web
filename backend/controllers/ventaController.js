const Venta = require("../models/Venta");

const obtenerVentas = (req, res) => {
  Venta.obtenerTodas((err, ventas) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.json(ventas);
  });
};

const registrarVenta = (req, res) => {
  const { id_cliente, id_empleado, total } = req.body;

  Venta.crear({ id_cliente, id_empleado, total }, (err, resultado) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.json({ mensaje: "Venta registrada", id: resultado.insertId });
  });
};

module.exports = {
  obtenerVentas,
  registrarVenta
};
