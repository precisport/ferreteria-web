const express = require("express");
require("dotenv").config();
const cors = require("cors");
const multer = require("multer");
const mysql = require("mysql2");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 👇 ESTO ES LO ÚNICO NECESARIO PARA EL FRONTEND
app.use(express.static(path.join(__dirname, "../frontend")));


/* ===============================
   SERVIR FRONTEND Y UPLOADS
================================ */
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/uploads", express.static(path.join(__dirname, "../frontend/uploads")));

/* ===============================
   CONEXIÓN MYSQL
================================ */
const conexion = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

conexion.connect(err => {
  if (err) {
    console.error("❌ Error MySQL:", err);
  } else {
    console.log("✅ Conectado a MySQL");
  }
});


/* ===============================
   MULTER (SUBIDA DE IMÁGENES)
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
app.post("/crear-producto", upload.single("imagen"), (req, res) => {
  const { nombre, descripcion, precio, stock, categoria } = req.body;
  const imagen = req.file ? req.file.filename : null;

  conexion.query(
    `INSERT INTO producto (nombre, descripcion, precio, stock, imagen, id_categoria)
     VALUES (?,?,?,?,?,?)`,
    [nombre, descripcion, precio, stock, imagen, categoria],
    (err, result) => {
      if (err) {
        console.error("❌ Error crear producto:", err);
        return res.status(500).json({ ok: false });
      }
      res.json({ ok: true, id_producto: result.insertId });
    }
  );
});

app.get("/productos", (req, res) => {
  conexion.query(`
    SELECT p.*, c.nombre AS categoria
    FROM producto p
    JOIN categoria c ON p.id_categoria = c.id_categoria
  `, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

/* ===============================
   ACTUALIZAR PRODUCTO
================================ */
app.put("/actualizar-producto/:id", upload.single("imagen"), (req, res) => {
  const { nombre, descripcion, precio, stock, categoria } = req.body;
  const id = req.params.id;

  let sql = `
    UPDATE producto
    SET nombre = ?, descripcion = ?, precio = ?, stock = ?, id_categoria = ?
  `;
  let params = [nombre, descripcion, precio, stock, categoria];

  // si se subió imagen nueva
  if (req.file) {
    sql += `, imagen = ?`;
    params.push(req.file.filename);
  }

  sql += ` WHERE id_producto = ?`;
  params.push(id);

  conexion.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ Error al actualizar producto:", err);
      return res.status(500).json({ ok: false });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false });
    }

    res.json({ ok: true });
  });
});



/* ===============================
   ELIMINAR PRODUCTO
================================ */
app.delete("/eliminar-producto/:id", (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({ ok: false, error: "ID no recibido" });
  }

  // Primero eliminar detalles de venta (si existe relación)
  conexion.query(
    "DELETE FROM detalle_venta WHERE id_producto = ?",
    [id],
    () => {
      // Luego eliminar el producto
      conexion.query(
        "DELETE FROM producto WHERE id_producto = ?",
        [id],
        (err, result) => {
          if (err) {
            console.error("❌ Error al eliminar producto:", err);
            return res.status(500).json({ ok: false });
          }

          if (result.affectedRows === 0) {
            return res
              .status(404)
              .json({ ok: false, error: "Producto no encontrado" });
          }

          res.json({ ok: true });
        }
      );
    }
  );
});


/* ===============================
   CATEGORÍAS
================================ */
app.get("/categorias", (req, res) => {
  conexion.query("SELECT * FROM categoria", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

/* ===============================
   USUARIOS / EMPLEADOS / CLIENTES
================================ */
app.get("/usuarios", (req, res) => {
  conexion.query("SELECT * FROM usuario", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

app.post("/crear-usuario", (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ ok: false });
  }

  conexion.query(
    "INSERT INTO usuario (nombre,email,password,rol) VALUES (?,?,?,?)",
    [nombre, email, password, rol],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.json({ ok: false, error: "Email duplicado" });
        }
        return res.status(500).json({ ok: false });
      }
      res.json({ ok: true, id_usuario: result.insertId });
    }
  );
});

app.delete("/eliminar-usuario/:id", (req, res) => {
  conexion.query(
    "DELETE FROM usuario WHERE id_usuario = ?",
    [req.params.id],
    err => {
      if (err) return res.status(500).json({ ok: false });
      res.json({ ok: true });
    }
  );
});

/* ===============================
   VENTAS + DESPACHO (CARRITO)
================================ */
app.post("/crear-venta", (req, res) => {
  const { id_usuario, total, productos, despacho } = req.body;

  conexion.query(
    "SELECT id_cliente FROM cliente WHERE id_usuario = ?",
    [id_usuario],
    (err, rows) => {
      if (err) return res.status(500).json(err);

      const crearVenta = id_cliente => {
        conexion.query(
          "INSERT INTO venta (id_cliente, total) VALUES (?,?)",
          [id_cliente, total],
          (err2, result) => {
            if (err2) return res.status(500).json(err2);

            const idVenta = result.insertId;

            productos.forEach(p => {
              conexion.query(
                "INSERT INTO detalle_venta (id_venta,id_producto,cantidad,subtotal) VALUES (?,?,?,?)",
                [idVenta, p.id_producto, p.cantidad, p.precio * p.cantidad]
              );
            });

            if (despacho) {
              conexion.query(
                `INSERT INTO despacho
                (id_venta,nombre,apellido,direccion,comuna,numero,telefono)
                VALUES (?,?,?,?,?,?,?)`,
                [
                  idVenta,
                  despacho.nombre,
                  despacho.apellido,
                  despacho.direccion,
                  despacho.comuna,
                  despacho.numero,
                  despacho.telefono
                ]
              );
            }

            res.json({ ok: true, id_venta: idVenta });
          }
        );
      };

      if (rows.length) {
        crearVenta(rows[0].id_cliente);
      } else {
        conexion.query(
          "INSERT INTO cliente (id_usuario) VALUES (?)",
          [id_usuario],
          (err3, r) => {
            if (err3) return res.status(500).json(err3);
            crearVenta(r.insertId);
          }
        );
      }
    }
  );
});

/* ===============================
   BOLETAS / PDF
================================ */
app.get("/ventas", (req, res) => {
  conexion.query(`
    SELECT v.*, d.nombre AS d_nombre, d.apellido AS d_apellido,
           d.direccion, d.comuna, d.numero, d.telefono
    FROM venta v
    LEFT JOIN despacho d ON v.id_venta = d.id_venta
    ORDER BY v.id_venta DESC
  `, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

app.get("/venta/:id", (req, res) => {
  conexion.query(`
    SELECT v.id_venta,v.fecha,v.total,
           p.nombre AS producto,dv.cantidad,dv.subtotal,
           d.nombre AS d_nombre,d.apellido AS d_apellido,
           d.direccion,d.comuna,d.numero,d.telefono
    FROM venta v
    JOIN detalle_venta dv ON v.id_venta = dv.id_venta
    JOIN producto p ON dv.id_producto = p.id_producto
    LEFT JOIN despacho d ON v.id_venta = d.id_venta
    WHERE v.id_venta = ?
  `, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

/* ===============================
   ELIMINAR BOLETA (ADMIN)
================================ */
app.delete("/eliminar-venta/:id", (req, res) => {
  const { rol } = req.body;
  const idVenta = req.params.id;

  if (rol !== "admin") {
    return res.status(403).json({ error: "No autorizado" });
  }

  conexion.query("DELETE FROM detalle_venta WHERE id_venta = ?", [idVenta], () => {
    conexion.query("DELETE FROM despacho WHERE id_venta = ?", [idVenta], () => {
      conexion.query("DELETE FROM venta WHERE id_venta = ?", [idVenta], () => {
        res.json({ ok: true });
      });
    });
  });
});

/* ===============================
   SERVER
================================ */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
});
