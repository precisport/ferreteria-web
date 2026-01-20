const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/productoController");

router.get("/", ctrl.obtenerProductos);
router.post("/", ctrl.crearProducto);
router.put("/:id", ctrl.editarProducto);
router.delete("/:id", ctrl.eliminarProducto);

module.exports = router;
