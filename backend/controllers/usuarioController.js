const db = require('../config/db');
const bcrypt = require('bcrypt');

// REGISTRAR USUARIO (ADMIN)
exports.registrarUsuario = async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO usuario (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hash, rol]
    );

    res.json({ message: 'Usuario creado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.query(
    'SELECT * FROM usuario WHERE email = ?',
    [email]
  );

  if (rows.length === 0) {
    return res.status(401).json({ message: 'Usuario no encontrado' });
  }

  const usuario = rows[0];
  const valido = await bcrypt.compare(password, usuario.password);

  if (!valido) {
    return res.status(401).json({ message: 'Contraseña incorrecta' });
  }

  res.json({
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    rol: usuario.rol
  });
};
