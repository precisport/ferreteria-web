const express = require("express");
const router = express.Router();
const ventaController = require("../controllers/ventaController");

router.get("/", ventaController.obtenerVentas);
router.post("/", ventaController.registrarVenta);

module.exports = router;
