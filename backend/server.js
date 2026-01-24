const express = require("express");
require("dotenv").config();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const db = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   SERVIR FRONTEND Y UPLOADS
================================ */
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/uploads", express.static(path.join(__dirname, "../frontend/uploads")));

/* ===============================
   MULTER (IMÁGENES)
================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../frontend/uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

/* ===============================
   PRODUCTOS
================================ */
app.get("/productos", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.nombre AS categoria
      FROM producto p
      JOIN categoria c ON p.id_categoria = c.id_categoria
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error productos:", err);
    res.status(500).json([]);
  }
});

app.post("/crear-producto", upload.single("imagen"), async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria } = req.body;
    const imagen = req.file ? req.file.filename : null;

    const [result] = await db.query(
      `INSERT INTO producto (nombre, descripcion, precio, stock, imagen, id_categoria)
       VALUES (?,?,?,?,?,?)`,
      [nombre, descripcion, precio, stock, imagen, categoria]
    );

    res.json({ ok: true, id_producto: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

app.put("/actualizar-producto/:id", upload.single("imagen"), async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria } = req.body;
    const id = req.params.id;

    let sql = `
      UPDATE producto
      SET nombre=?, descripcion=?, precio=?, stock=?, id_categoria=?
    `;
    let params = [nombre, descripcion, precio, stock, categoria];

    if (req.file) {
      sql += ", imagen=?";
      params.push(req.file.filename);
    }

    sql += " WHERE id_producto=?";
    params.push(id);

    await db.query(sql, params);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

app.delete("/eliminar-producto/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM detalle_venta WHERE id_producto=?", [req.params.id]);
    await db.query("DELETE FROM producto WHERE id_producto=?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

/* ===============================
   CATEGORÍAS
================================ */
app.get("/categorias", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM categoria");
  res.json(rows);
});

/* ===============================
   USUARIOS
================================ */
app.get("/usuarios", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM usuario");
  res.json(rows);
});

app.post("/crear-usuario", async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    const [result] = await db.query(
      "INSERT INTO usuario (nombre,email,password,rol) VALUES (?,?,?,?)",
      [nombre, email, password, rol]
    );
    res.json({ ok: true, id_usuario: result.insertId });
  } catch (err) {
    res.json({ ok: false, error: "Email duplicado" });
  }
});

app.delete("/eliminar-usuario/:id", async (req, res) => {
  await db.query("DELETE FROM usuario WHERE id_usuario=?", [req.params.id]);
  res.json({ ok: true });
});

/* ===============================
   VENTAS
================================ */
app.post("/crear-venta", async (req, res) => {
  try {
    const { id_usuario, total, productos, despacho } = req.body;

    const [venta] = await db.query(
      "INSERT INTO venta (id_cliente,total) VALUES (?,?)",
      [id_usuario, total]
    );

    for (const p of productos) {
      await db.query(
        "INSERT INTO detalle_venta (id_venta,id_producto,cantidad,precio) VALUES (?,?,?,?)",
        [venta.insertId, p.id_producto, p.cantidad, p.precio]
      );
    }

if (despacho) {
  await db.query(
    `INSERT INTO despacho 
     (id_venta,nombre,apellido,direccion,comuna,numero,telefono)
     VALUES (?,?,?,?,?,?,?)`,
    [
      venta.insertId,
      despacho.nombre,
      despacho.apellido,
      despacho.direccion,
      despacho.comuna,
      despacho.numero,
      despacho.telefono
    ]
  );
}


    res.json({ id_venta: venta.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({});
  }
});

app.get("/ventas", async (req, res) => {
  const [rows] = await db.query(`
    SELECT v.*, d.nombre AS d_nombre, d.apellido AS d_apellido,
           d.direccion, d.comuna, d.numero, d.telefono
    FROM venta v
    LEFT JOIN despacho d ON v.id_venta = d.id_venta
    ORDER BY v.id_venta DESC
  `);
  res.json(rows);
});

app.get("/venta/:id", async (req, res) => {
  const [rows] = await db.query(`
    SELECT v.*, p.nombre AS producto,
           dv.cantidad, (dv.cantidad * dv.precio) AS subtotal
    FROM venta v
    JOIN detalle_venta dv ON v.id_venta = dv.id_venta
    JOIN producto p ON dv.id_producto = p.id_producto
    LEFT JOIN despacho d ON v.id_venta = d.id_venta
    WHERE v.id_venta = ?
  `, [req.params.id]);

  res.json(rows);
});

app.delete("/eliminar-venta/:id", async (req, res) => {
  await db.query("DELETE FROM despacho WHERE id_venta=?", [req.params.id]);
  await db.query("DELETE FROM detalle_venta WHERE id_venta=?", [req.params.id]);
  await db.query("DELETE FROM venta WHERE id_venta=?", [req.params.id]);
  res.json({ ok: true });
});

/* ===============================
   SERVER
================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor activo en puerto", PORT);
});
