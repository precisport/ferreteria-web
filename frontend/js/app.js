/************ CONFIG ************/
const IVA = 0.19;

let productos = [];


/************ USUARIOS ************/

// 🔐 CARGA SESIÓN DESDE LOCALSTORAGE AL INICIAR
let usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo")) || null;

/************ HEADER USUARIO ************/
function actualizarHeaderUsuario() {
  const div = document.getElementById("usuarioHeader");

  if (!usuarioActivo) {
    div.innerHTML = "";
    return;
  }

  div.innerHTML = `
    <div class="usuario-activo">
      👤 ${usuarioActivo.nombre}
      <small>(${usuarioActivo.rol})</small>
      <button onclick="cerrarSesion()">Cerrar sesión</button>
    </div>
  `;
}

/************ INICIO ************/
function mostrarInicio() {
  document.getElementById("contenido").innerHTML = `
    <section class="inicio">
      <img src="img/logo.jpg" class="logo-inicio">
      <h2>Bienvenido a la Ferretería</h2>
      <p>Todo para Construcción, Herramientas y Electricidad.</p>
      <button onclick="mostrarProductos()">Ver productos</button>
    </section>
  `;
}

/************ LOGIN ************/
function mostrarLogin() {
  document.getElementById("contenido").innerHTML = `
    <h2>Iniciar sesión</h2>
    <input id="email" placeholder="Email">
    <input id="password" type="password" placeholder="Contraseña">
    <button onclick="login()">Ingresar</button>
  `;
}

function login() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  fetch("/usuarios")
    .then(res => res.json())
    .then(data => {
      const u = data.find(
        x => x.email === email && x.password === pass
      );

      if (!u) {
        alert("Credenciales incorrectas");
        return;
      }

      // ✅ GUARDAR SESIÓN
      usuarioActivo = u;
      localStorage.setItem("usuarioActivo", JSON.stringify(usuarioActivo));

      actualizarHeaderUsuario();
      mostrarInicio();
    })
    .catch(err => {
      console.error(err);
      alert("Error de servidor");
    });
}

/************ CERRAR SESIÓN ************/
function cerrarSesion() {
  localStorage.removeItem("usuarioActivo");
  usuarioActivo = null;
  carrito = [];
  actualizarContador();
  actualizarHeaderUsuario();
  mostrarInicio();
}

/************ AL CARGAR LA PÁGINA ************/
actualizarHeaderUsuario();

/************ PRODUCTOS ************/
// Cargar productos desde el backend
function cargarProductos() {
  fetch("/productos")
    .then(res => res.json())
    .then(data => {
      productos = data;
      mostrarProductos();
    })
    .catch(err => console.error("Error cargando productos:", err));
}
function eliminarProductoAdmin(id) {
  if (!confirm("¿Eliminar producto?")) return;

  fetch(`/eliminar-producto/${id}`, {
    method: "DELETE"
  })
    .then(res => {
      if (!res.ok) throw new Error("Error servidor");
      return res.json();
    })
    .then(resp => {
      if (!resp.ok) {
        alert("No se pudo eliminar el producto");
        return;
      }

      alert("Producto eliminado correctamente");
      cargarProductos(); // 🔁 RECARGA REAL
    })
    .catch(err => {
      console.error("Error al eliminar producto:", err);
      alert("Error al eliminar producto");
    });
}



function mostrarProductos() {
  document.getElementById("contenido").innerHTML = `
    <h2>Productos</h2>
    ${usuarioActivo && usuarioActivo.rol === "admin"
      ? `<button onclick="mostrarAdminProductos()">Agregar nuevo producto</button>`
      : ""}
    <div class="productos-grid">
      ${productos.map(p => `
        <div class="producto-card">
        <img src="${p.imagen ? '/uploads/' + p.imagen : '/uploads/default.png'}">
          <h3>${p.nombre}</h3>
          <p>${p.descripcion}</p>
          <p>Precio: $${p.precio.toLocaleString()}</p>
          <p>Stock: ${p.stock}</p>
          <p>Categoría: ${p.categoria}</p>
          <button onclick="agregarCarrito(${p.id_producto})">Agregar</button>
          ${usuarioActivo && usuarioActivo.rol === "admin"
            ? `<button onclick="mostrarEditarProducto(${p.id_producto})">Editar</button>
               <button onclick="eliminarProductoAdmin(${p.id_producto})">Eliminar</button>`
            : ""}
        </div>
      `).join("")}
    </div>
  `;
}

function agregarCarrito(id) {
  const prod = productos.find(p => p.id_producto === id);
  const existe = carrito.find(p => p.id_producto === id);

  if (existe) existe.cantidad++;
  else carrito.push({ ...prod, cantidad: 1 });

  actualizarContador();
}

/************ ADMIN: AGREGAR PRODUCTO ************/
function mostrarAdminProductos() {
  fetch("/categorias")
    .then(res => res.json())
    .then(cats => {
      document.getElementById("contenido").innerHTML = `
        <h2>Agregar Producto</h2>
        <form id="formProducto" enctype="multipart/form-data">
          <input id="pNombre" name="nombre" placeholder="Nombre">
          <input id="pDescripcion" name="descripcion" placeholder="Descripción">
          <input id="pPrecio" name="precio" type="number" placeholder="Precio">
          <input id="pStock" name="stock" type="number" placeholder="Stock">
          <select id="pCategoria" name="categoria">
            ${cats.map(c=>`<option value="${c.id_categoria}">${c.nombre}</option>`).join("")}
          </select>
          <input id="pImagen" name="imagen" type="file" accept="image/*">
          <button type="button" onclick="crearProducto()">Crear</button>
          <button type="button" onclick="mostrarProductos()">Volver</button>
        </form>
      `;
    });
}

function crearProducto() {
  const form = document.getElementById("formProducto");
  const formData = new FormData(form);

  fetch("/crear-producto", {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(resp => {
      if (!resp.ok) {
        alert("No se pudo crear el producto");
        return;
      }

      alert("Producto agregado correctamente");

      // 🔥 SOLUCIÓN REAL: volver a cargar desde la BD
      cargarProductos();
    })
    .catch(err => {
      console.error("Error al crear producto:", err);
      alert("Error al crear el producto");
    });
}



/************ ADMIN: EDITAR PRODUCTO ************/
function mostrarEditarProducto(id) {
  const p = productos.find(x => x.id_producto === id);
  document.getElementById("contenido").innerHTML = `
    <h2>Editar Producto</h2>
    <form id="formEditar" enctype="multipart/form-data">
      <input name="nombre" value="${p.nombre}">
      <input name="descripcion" value="${p.descripcion}">
      <input name="precio" type="number" value="${p.precio}">
      <input name="stock" type="number" value="${p.stock}">
      <select name="categoria">
        <option value="${p.id_categoria}" selected>${p.categoria}</option>
      </select>
      <input name="imagen" type="file" accept="image/*">
      <button type="button" onclick="guardarEdicion(${p.id_producto})">Guardar</button>
      <button type="button" onclick="mostrarProductos()">Cancelar</button>
    </form>
  `;
}

function guardarEdicion(id) {
  const form = document.getElementById("formEditar");
  const datos = new FormData(form);

  fetch(`/actualizar-producto/${id}`, {
    method: "PUT",
    body: datos
  })
    .then(res => {
      if (!res.ok) throw new Error("Error servidor");
      return res.json();
    })
    .then(resp => {
      if (!resp.ok) {
        alert("No se pudo actualizar el producto");
        return;
      }

      alert("Producto actualizado correctamente");
      cargarProductos(); // 🔁 recarga REAL desde BD
    })
    .catch(err => {
      console.error("Error al actualizar producto:", err);
      alert("Error al actualizar el producto");
    });
}



/************ CARRITO ************/
let carrito = [];

function mostrarCarrito() {
  const subtotal = carrito.reduce((a, p) => a + p.precio * p.cantidad, 0);
const iva = Math.round(subtotal * IVA);
const total = subtotal + iva;

  

  document.getElementById("contenido").innerHTML = `
    <h2>Carrito</h2>
    ${carrito.map(p => `
      <div class="carrito-item">
      <img src="${p.imagen ? '/uploads/' + p.imagen : '/uploads/default.png'}">

        <div>
          <strong>${p.nombre}</strong><br>
          $${p.precio.toLocaleString()} x ${p.cantidad}
        </div>
        <div>
          <button onclick="modificarCantidad(${p.id_producto},-1)">−</button>
          <button onclick="modificarCantidad(${p.id_producto},1)">+</button>
          <button onclick="eliminarProducto(${p.id_producto})">Eliminar</button>
        </div>
      </div>
    `).join("")}
    <hr>
    <p>Subtotal: $${subtotal.toLocaleString()}</p>
    <p>IVA: $${iva.toLocaleString()}</p>
    <h3>Total: $${total.toLocaleString()}</h3>
    <button onclick="mostrarDespacho()">Finalizar compra</button>
  `;
}

function modificarCantidad(id, cambio) {
  const p = carrito.find(x => x.id_producto === id);
  p.cantidad += cambio;
  if (p.cantidad <= 0) eliminarProducto(id);
  mostrarCarrito();
}

function eliminarProducto(id) {
  carrito = carrito.filter(p => p.id_producto !== id);
  actualizarContador();
  mostrarCarrito();
}

/************ DESPACHO ************/
function mostrarDespacho() {
  document.getElementById("contenido").innerHTML = `
    <h2>Despacho</h2>
    <p>Ingrese los datos de entrega</p>
    <input id="dNombre" placeholder="Nombre">
    <input id="dApellido" placeholder="Apellido">
    <input id="dDireccion" placeholder="Dirección">
    <input id="dComuna" placeholder="Comuna">
    <input id="dNumero" placeholder="Número de casa">
    <input id="dTelefono" placeholder="Teléfono">
    <button onclick="finalizarCompra()">Confirmar compra</button>
    <button onclick="mostrarCarrito()">Volver</button>
  `;
}

function finalizarCompra() {
  if (!usuarioActivo || carrito.length === 0) {
    alert("Debe iniciar sesión");
    return;
  }

  const despacho = {
    nombre: dNombre.value,
    apellido: dApellido.value,
    direccion: dDireccion.value,
    comuna: dComuna.value,
    numero: dNumero.value,
    telefono: dTelefono.value
  };

  const total = carrito.reduce((a, p) => a + p.precio * p.cantidad, 0);

  fetch("/crear-venta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_usuario: usuarioActivo.id_usuario,
      total,
      productos: carrito.map(p => ({
        id_producto: p.id_producto,
        cantidad: p.cantidad,
        precio: p.precio
      })),
      despacho
    })
  })
  .then(r => r.json())
  .then(resp => {
    alert("Compra realizada. Boleta #" + resp.id_venta);
    carrito = [];
    mostrarVentas();
  });
}


/************ BOLETA ************/
function verBoleta(id) {
  fetch("/ventas")
    .then(r => r.json())
    .then(data => {
      const v = data.find(x => x.id_venta === id);

      document.getElementById("contenido").innerHTML = `
        <h2>Boleta #${v.id_venta}</h2>
        <p>Fecha: ${v.fecha}</p>
        <p>Total: $${v.total.toLocaleString()}</p>

        ${v.direccion ? `
          <h3>Despacho</h3>
          <p>${v.d_nombre} ${v.d_apellido}</p>
          <p>${v.direccion}, ${v.comuna} Nº ${v.numero}</p>
          <p>Tel: ${v.telefono}</p>
        ` : "<p><em>Sin despacho</em></p>"}

        ${usuarioActivo?.rol === "admin"
          ? `<button onclick="eliminarVenta(${v.id_venta})">Eliminar</button>`
          : ""
        }

        <button onclick="mostrarVentas()">Volver</button>
      `;
    });
}

/************ EMPLEADOS ************/
function mostrarEmpleados() {
  const esAdmin = usuarioActivo && usuarioActivo.rol === "admin";

  fetch("/usuarios") // ruta que devuelve todos los usuarios
    .then(res => res.json())
    .then(data => {
      const empleados = data.filter(u => u.rol === "empleado");

      document.getElementById("contenido").innerHTML = `
        <h2>Empleados</h2>
        <p>Listado del personal de la ferretería</p>

        ${esAdmin ? `
          <h3>Agregar empleado</h3>
          <input id="eNombre" placeholder="Nombre">
          <input id="eEmail" placeholder="Email">
          <input id="ePass" type="password" placeholder="Contraseña">
          <button onclick="agregarEmpleado()">Crear empleado</button>
          <hr>
        ` : ""}

        ${empleados.map(u => `
          <div class="empleado-item">
            <strong>${u.nombre}</strong><br>
            Email: ${u.email}<br>
            ${esAdmin ? `<button onclick="eliminarEmpleado(${u.id_usuario})">Eliminar</button>` : ""}
          </div>
        `).join("")}
      `;
    });
}

function agregarEmpleado() {
  const nombre = document.getElementById("eNombre").value.trim();
  const email = document.getElementById("eEmail").value.trim();
  const password = document.getElementById("ePass").value.trim();

  if (!nombre || !email || !password) {
    alert("Completa todos los campos");
    return;
  }

  fetch("/crear-usuario", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre,
      email,
      password,
      rol: "empleado"
    })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.ok) {
        alert(data.error || "No se pudo crear el empleado");
        return;
      }

      alert("Empleado creado correctamente");
      mostrarEmpleados(); // 🔁 recargar lista
    })
    .catch(err => {
      console.error(err);
      alert("Error de servidor");
    });
}

function eliminarEmpleado(id) {
  if (!confirm("¿Eliminar empleado?")) return;

  fetch(`/eliminar-usuario/${id}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(resp => {
      if (!resp.ok) {
        alert("No se pudo eliminar");
        return;
      }

      alert("Empleado eliminado");
      mostrarEmpleados();
    });
}


/************ CATEGORÍAS ************/
function mostrarCategorias() {
  fetch("/categorias")
    .then(res => res.json())
    .then(cats => {
      document.getElementById("contenido").innerHTML = `
        <h2>Categorías</h2>
        ${cats.map(c => `
          <button onclick="mostrarProductosCategoria(${c.id_categoria})">${c.nombre}</button>
        `).join("")}
        <div id="listaCategoria"></div>
      `;
    });
}

function mostrarProductosCategoria(catId) {
  fetch("/productos")
    .then(res => res.json())
    .then(data => {
      const lista = data.filter(p => p.id_categoria === catId);
      document.getElementById("listaCategoria").innerHTML = `
        <h3>Productos de categoría</h3>
        ${lista.map(p => `
          <div class="producto-card">
            <img src="${p.imagen ? '/uploads/' + p.imagen : '/uploads/default.png'}">
            <h4>${p.nombre}</h4>
            <p>${p.descripcion}</p>
            <p>Precio: $${p.precio.toLocaleString()}</p>
            <p>Stock: ${p.stock}</p>
            <button onclick="agregarCarrito(${p.id_producto})">Agregar</button>
            ${usuarioActivo && usuarioActivo.rol === "admin"
              ? `<button onclick="mostrarEditarProducto(${p.id_producto})">Editar</button>
                 <button onclick="eliminarProductoAdmin(${p.id_producto})">Eliminar</button>`
              : ""}
          </div>
        `).join("")}
      `;
    });
}
/************ CLIENTES ************/
function mostrarRegistroCliente() {
  document.getElementById("contenido").innerHTML = `
    <h2>Crear perfil de cliente</h2>
    <input id="cNombre" placeholder="Nombre">
    <input id="cEmail" placeholder="Email">
    <input id="cPass" type="password" placeholder="Contraseña">
    <button onclick="registrarCliente()">Registrar</button>
    <button onclick="mostrarClientes()">Volver</button>
  `;
}

function registrarCliente() {
  const nuevoCliente = {
    nombre: document.getElementById("cNombre").value,
    email: document.getElementById("cEmail").value,
    password: document.getElementById("cPass").value,
    rol: "cliente"
  };

  fetch("/crear-usuario", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nuevoCliente)
  })
  .then(() => {
    alert("Cliente registrado correctamente");
    mostrarLogin();
  })
  .catch(err => {
    console.error("Error al registrar cliente:", err);
    alert("Error al registrar cliente");
  });
}

function eliminarCliente(id) {
  if (!confirm("¿Eliminar cliente?")) return;

  fetch(`/eliminar-usuario/${id}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(resp => {
      if (!resp.ok) {
        alert("No se pudo eliminar");
        return;
      }

      alert("Cliente eliminado");
      mostrarClientes(); // 🔁 recarga desde BD
    })
    .catch(err => {
      console.error(err);
      alert("Error de servidor");
    });
}


function mostrarClientes() {
  const esAdmin = usuarioActivo && usuarioActivo.rol === "admin";

  fetch("/usuarios")
    .then(res => res.json())
    .then(data => {
      const clientes = data.filter(u => u.rol === "cliente");

      document.getElementById("contenido").innerHTML = `
        <h2>Clientes</h2>
        <p>Registro de nuevos clientes</p>

        ${esAdmin ? `<button onclick="mostrarRegistroCliente()">Crear perfil</button>` : ""}

        <div id="listaClientes">
          ${clientes.map(c => `
            <div class="cliente-item">
              <strong>${c.nombre}</strong><br>
              Email: ${c.email}<br>

              ${(esAdmin || usuarioActivo?.email === c.email)
                ? `<button onclick="eliminarCliente(${c.id_usuario})">Eliminar</button>`
                : ""
              }
            </div>
          `).join("")}
        </div>
      `;
    })
    .catch(err => {
      console.error("Error cargando clientes:", err);
    });
}


function verBoleta(id) {
  
}

function generarBoletaPDF(idVenta) {
  fetch(`/venta/${idVenta}`)
    .then(res => res.json())
    .then(data => {

      console.log("📦 Datos boleta:", data);

      if (!data.length) {
        alert("No hay datos para esta boleta");
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        unit: "mm",
        format: [80, 220]
      });

      let y = 10;
      const venta = data[0];

      // ENCABEZADO
      doc.setFontSize(10);
      doc.text("FERRETERÍA WEB SPA", 40, y, { align: "center" });
      y += 5;
      doc.text("VÁLIDO COMO BOLETA", 40, y, { align: "center" });
      y += 6;

      doc.setFontSize(8);
      doc.text("Dirección Comercial #1234", 40, y, { align: "center" });
      y += 4;
      doc.text("Paine, Santiago", 40, y, { align: "center" });
      y += 5;

      doc.text("---------------------------------------", 40, y, { align: "center" });
      y += 5;

      doc.text(`Boleta N°: ${venta.id_venta}`, 5, y);
      y += 4;
      doc.text(`Fecha: ${new Date(venta.fecha).toLocaleString()}`, 5, y);
      y += 5;

      doc.text("---------------------------------------", 40, y, { align: "center" });
      y += 5;

      // 🔥 DETALLE DE COMPRA (ESTA ERA LA PARTE QUE FALTABA)
      doc.setFontSize(9);
      doc.text("DETALLE DE COMPRA", 40, y, { align: "center" });
      y += 5;

      doc.setFontSize(8);
      data.forEach(p => {
        doc.text(
          `${p.producto} x${p.cantidad}  $${Number(p.subtotal).toLocaleString()}`,
          5,
          y
        );
        y += 4;
      });

      y += 3;
      doc.text("---------------------------------------", 40, y, { align: "center" });
      y += 5;

      doc.setFontSize(9);
      doc.text(`TOTAL: $${Number(venta.total).toLocaleString()}`, 5, y);
      y += 6;

      // 🚚 DESPACHO (solo si existe)
      if (venta.d_nombre) {
        doc.text("---------------------------------------", 40, y, { align: "center" });
        y += 5;

        doc.setFontSize(9);
        doc.text("DESPACHO", 40, y, { align: "center" });
        y += 5;

        doc.setFontSize(8);
        doc.text(`${venta.d_nombre} ${venta.d_apellido}`, 5, y); y += 4;
        doc.text(venta.direccion, 5, y); y += 4;
        doc.text(`${venta.comuna} Nº${venta.numero}`, 5, y); y += 4;
        doc.text(`Tel: ${venta.telefono}`, 5, y); y += 5;
      }

      doc.text("---------------------------------------", 40, y, { align: "center" });
      y += 5;

      doc.text("IVA INCLUIDO", 40, y, { align: "center" });
      y += 4;
      doc.text("GRACIAS POR SU COMPRA", 40, y, { align: "center" });
      y += 5;

      doc.text(`BOLETA-${venta.id_venta}-1`, 40, y, { align: "center" });

      doc.save(`boleta-${venta.id_venta}.pdf`);
    })
    .catch(err => {
      console.error("❌ Error generando boleta:", err);
    });
}



/************ VENTAS ************/
function mostrarVentas() {
  fetch("/ventas")
    .then(res => res.json())
    .then(data => {

      const contenedor = document.getElementById("contenido");
      contenedor.innerHTML = "";

      if (!data.length) {
        contenedor.innerHTML = `
          <h2>Ventas</h2>
          <p>No hay ventas registradas.</p>
        `;
        return;
      }

      contenedor.innerHTML = `
        <h2>Ventas</h2>
        ${data.map(v => `
          <div class="venta-item">
            <strong>Boleta #${v.id_venta}</strong><br>
            Fecha: ${new Date(v.fecha).toLocaleString()}<br>
            Cliente ID: ${v.id_cliente}<br>
            Total: $${Number(v.total).toLocaleString()}<br><br>

            <button onclick="verBoleta(${v.id_venta})">
              Ver boleta
            </button>

            <button onclick="generarBoletaPDF(${v.id_venta})">
              Ver PDF
            </button>

            ${
              usuarioActivo && usuarioActivo.rol === "admin"
                ? `<button onclick="eliminarVenta(${v.id_venta})">Eliminar</button>`
                : ""
            }
          </div>
        `).join("")}
      `;
    })
    .catch(err => {
      console.error("❌ Error cargando ventas:", err);
      alert("Error al cargar ventas");
    });
}



/************ VER BOLETA ************/
function verBoleta(id) {
  fetch("/ventas")
    .then(res => res.json())
    .then(data => {
      const v = data.find(x => x.id_venta === id);
      if (!v) {
        alert("Boleta no encontrada");
        return;
      }

      const codigoBarra = "BOLETA-" + v.id_venta + "-" + v.id_cliente;

      document.getElementById("contenido").innerHTML = `
        <h2>Boleta #${v.id_venta}</h2>
        <p><strong>Fecha:</strong> ${new Date(v.fecha).toLocaleString()}</p>
        <p><strong>ID Cliente:</strong> ${v.id_cliente}</p>
        <h3>Total: $${Number(v.total).toLocaleString()}</h3>
        <p><strong>Código de barra:</strong> ${codigoBarra}</p>
        <button onclick="mostrarVentas()">Volver</button>
      `;
    })
    .catch(err => {
      console.error("Error al ver boleta:", err);
      alert("Error al cargar boleta");
    });
}


/************ ELIMINAR VENTA ************/
function eliminarVenta(id) {
  if (!confirm("¿Eliminar boleta?")) return;

  fetch("/eliminar-venta/" + id, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rol: usuarioActivo.rol
    })
  })
    .then(res => {
      if (!res.ok) throw new Error("No autorizado");
      return res.json();
    })
    .then(() => {
      alert("Boleta eliminada");

      // 🔥 LIMPIAR PANTALLA ANTES DE VOLVER A CARGAR
      document.getElementById("contenido").innerHTML = "";

      // 🔁 Volver a pedir ventas reales al backend
      mostrarVentas();
    })
    .catch(() => {
      alert("No tienes permisos para eliminar boletas");
    });
}

/************ INICIAL ************/
mostrarInicio();
cargarProductos();


/************ CONTADOR DEL CARRITO ************/
function actualizarContador() {
  const totalItems = carrito.reduce((a, p) => a + p.cantidad, 0);
  document.getElementById("contadorCarrito").innerText = `Carrito (${totalItems})`;
}

function generarBoletaPDF(idVenta) {
  fetch(`/venta/${idVenta}`)
    .then(res => res.json())
    .then(data => {

      console.log("📦 Datos boleta:", data);

      if (!data.length) {
        alert("No hay datos para esta boleta");
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        unit: "mm",
        format: [80, 200]
      });

      let y = 10;
      const venta = data[0]; // datos generales

      /* ================= CÁLCULOS IVA ================= */
      const total = Number(venta.total);
      const iva = Math.round(total * 0.19 / 1.19); // IVA incluido
      const neto = total - iva;

      /* ================= HEADER ================= */
      doc.setFontSize(10);
      doc.text("FERRETERÍA WEB SPA", 40, y, { align: "center" });
      y += 5;
      doc.text("VÁLIDO COMO BOLETA", 40, y, { align: "center" });
      y += 6;

      doc.setFontSize(8);
      doc.text("Dirección Comercial #1234", 40, y, { align: "center" });
      y += 4;
      doc.text("Paine, Santiago", 40, y, { align: "center" });
      y += 6;

      doc.text("------------------------------------------", 40, y, { align: "center" });
      y += 5;

      doc.text(`Boleta N°: ${venta.id_venta}`, 10, y);
      y += 4;
      doc.text(`Fecha: ${new Date(venta.fecha).toLocaleString()}`, 10, y);
      y += 5;

      doc.text("------------------------------------------", 40, y, { align: "center" });
      y += 5;

      /* ================= DETALLE COMPRA ================= */
      doc.setFontSize(9);
      doc.text("DETALLE DE COMPRA", 40, y, { align: "center" });
      y += 5;

      doc.setFontSize(8);
      data.forEach(p => {
        doc.text(`${p.producto} x${p.cantidad}`, 10, y);
        doc.text(
          `$${Number(p.subtotal).toLocaleString()}`,
          70,
          y,
          { align: "right" }
        );
        y += 4;
      });

      y += 3;
      doc.text("------------------------------------------", 40, y, { align: "center" });
      y += 5;

      /* ================= TOTALES ================= */
      doc.setFontSize(8);
      doc.text(`NETO: $${neto.toLocaleString()}`, 10, y);
      y += 4;

      doc.text(`IVA (19%): $${iva.toLocaleString()}`, 10, y);
      y += 4;

      doc.setFontSize(9);
      doc.text(`TOTAL: $${total.toLocaleString()}`, 10, y);
      y += 6;

      /* ================= DESPACHO ================= */
      if (venta.d_nombre) {
        doc.text("------------------------------------------", 40, y, { align: "center" });
        y += 5;

        doc.text("DESPACHO", 40, y, { align: "center" });
        y += 5;

        doc.setFontSize(8);
        doc.text(`${venta.d_nombre} ${venta.d_apellido}`, 10, y); y += 4;
        doc.text(venta.direccion, 10, y); y += 4;
        doc.text(`${venta.comuna} Nº ${venta.numero}`, 10, y); y += 4;
        doc.text(`Tel: ${venta.telefono}`, 10, y); y += 5;
      }

      /* ================= FOOTER ================= */
      doc.text("------------------------------------------", 40, y, { align: "center" });
      y += 5;

      doc.setFontSize(8);
      doc.text("IVA INCLUIDO", 40, y, { align: "center" });
      y += 4;
      doc.text("GRACIAS POR SU COMPRA", 40, y, { align: "center" });
      y += 5;

      doc.text(`BOLETA-${venta.id_venta}`, 40, y, { align: "center" });

      doc.save(`boleta_${venta.id_venta}.pdf`);
    })
    .catch(err => {
      console.error("❌ Error PDF:", err);
      alert("Error generando PDF");
    });
}
