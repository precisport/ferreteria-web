const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.USUARIO_MYSQL,
  password: process.env.CONTRASEÑA_MYSQL,
  database: process.env.BASE_DE_DATOS_MYSQL,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
