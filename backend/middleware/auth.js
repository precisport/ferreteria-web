function verificarRol(rolesPermitidos) {
  return (req, res, next) => {
    const rol = req.headers["rol"];

    if (!rol || !rolesPermitidos.includes(rol)) {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    next();
  };
}

module.exports = { verificarRol };
