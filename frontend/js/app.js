/************ CONFIG ************/
const API_URL = window.location.origin; // 👈 AGREGAR ESTA LÍNEA
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

    <input id="email" type="email" placeholder="Email">
    <input id="password" type="password" placeholder="Contraseña">

    <button onclick="login()">Ingresar</button>
    <button onclick="mostrarRegistroCliente()">Registrarse</button>
  `;
}

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Complete todos los campos");
    return;
  }

  fetch(`${API_URL}/usuarios`)
    .then(res => res.json())
    .then(usuarios => {
      if (!Array.isArray(usuarios)) {
        alert("Error de servidor");
        return;
      }

      const usuario = usuarios.find(
        u => u.email === email && u.password === password
      );

      if (!usuario) {
        alert("Credenciales incorrectas");
        return;
      }

      // ✅ GUARDAR SESIÓN
      usuarioActivo = usuario;
      localStorage.setItem("usuarioActivo", JSON.stringify(usuarioActivo));

      actualizarHeaderUsuario();
      mostrarInicio();
    })
    .catch(err => {
      console.error(err);
      alert("Error al iniciar sesión");
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

/************ INICIAL ************/
actualizarHeaderUsuario();



/************ PRODUCTOS ************/
// Cargar productos desde el backend
function cargarProductos() {
  fetch(`${API_URL}/productos`)
    .then(res => res.json())
    .then(data => {

      // 🔴 VALIDACIÓN CRÍTICA
      if (!Array.isArray(data)) {
        console.error("Respuesta inválida /productos:", data);
        productos = [];
        mostrarProductos();
        return;
      }

      productos = data;
      mostrarProductos();
    })
    .catch(err => {
      console.error("Error cargando productos:", err);
      productos = [];
      mostrarProductos();
    });
}

function eliminarProductoAdmin(id) {
  if (!confirm("¿Eliminar producto?")) return;

  fetch(`${API_URL}/eliminar-producto/${id}`, {
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

  // 🔐 PROTECCIÓN CRÍTICA
  if (!Array.isArray(productos)) {
    console.warn("productos no es array, se corrige:", productos);
    productos = [];
  }

  document.getElementById("contenido").innerHTML = `
    <h2>Productos</h2>
    ${usuarioActivo && usuarioActivo.rol === "admin"
      ? `<button onclick="mostrarAdminProductos()">Agregar nuevo producto</button>`
      : ""}
    <div class="productos-grid">
      ${productos.map(p => `
        <div class="producto-card">
         <img src="${p.imagen || 'https://via.placeholder.com/200'}">

          <h3>${p.nombre}</h3>
          <p>${p.descripcion}</p>
          <p>Precio: $${Number(p.precio).toLocaleString()}</p>
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
fetch(`${API_URL}/categorias`)
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
<input
  id="pImagen"
  name="imagen"
  placeholder="URL de la imagen (https://...)">
          <button type="button" onclick="crearProducto()">Crear</button>
          <button type="button" onclick="mostrarProductos()">Volver</button>
        </form>
      `;
    });
}

function crearProducto() {
  const data = {
    nombre: document.getElementById("pNombre").value,
    descripcion: document.getElementById("pDescripcion").value,
    precio: document.getElementById("pPrecio").value,
    stock: document.getElementById("pStock").value,
    categoria: document.getElementById("pCategoria").value,
    imagen: document.getElementById("pImagen").value // 👈 URL
  };

  fetch(`${API_URL}/crear-producto`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(resp => {
      if (!resp.ok) {
        alert("No se pudo crear el producto");
        return;
      }

      alert("Producto agregado correctamente");
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

    <form id="formEditar">
      <input name="nombre" value="${p.nombre}" placeholder="Nombre">

      <input name="descripcion" value="${p.descripcion}" placeholder="Descripción">

      <input name="precio" type="number" value="${p.precio}" placeholder="Precio">

      <input name="stock" type="number" value="${p.stock}" placeholder="Stock">

      <select name="categoria">
        <option value="${p.id_categoria}" selected>${p.categoria}</option>
      </select>

      <input
        name="imagen"
        value="${p.imagen || ''}"
        placeholder="URL de la imagen (https://...)">

      <button type="button" onclick="guardarEdicion(${p.id_producto})">
        Guardar
      </button>

      <button type="button" onclick="mostrarProductos()">
        Cancelar
      </button>
    </form>
  `;
}


function guardarEdicion(id) {
  const data = {
    nombre: document.querySelector('#formEditar [name="nombre"]').value,
    descripcion: document.querySelector('#formEditar [name="descripcion"]').value,
    precio: document.querySelector('#formEditar [name="precio"]').value,
    stock: document.querySelector('#formEditar [name="stock"]').value,
    categoria: document.querySelector('#formEditar [name="categoria"]').value,
    imagen: document.querySelector('#formEditar [name="imagen"]').value // URL
  };

  fetch(`${API_URL}/actualizar-producto/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(resp => {
      if (!resp.ok) {
        alert("No se pudo actualizar el producto");
        return;
      }

      alert("Producto actualizado correctamente");
      cargarProductos();
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
<img src="${p.imagen || 'https://via.placeholder.com/100'}">

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

  // 🔴 VALIDACIÓN CLAVE
  if (!dNombre.value || !dDireccion.value || !dComuna.value) {
    alert("Debe completar los datos de despacho");
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

  fetch(`${API_URL}/crear-venta`, {
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
fetch(`${API_URL}/ventas`)
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

  fetch(`${API_URL}/usuarios`)
    .then(res => res.json())
    .then(data => {

      // 🔴 VALIDACIÓN OBLIGATORIA
      if (!Array.isArray(data)) {
        console.error("Respuesta inválida /usuarios:", data);
        document.getElementById("contenido").innerHTML =
          "<p>Error cargando empleados</p>";
        return;
      }

      const empleados = data.filter(u => u.rol === "empleado");

      document.getElementById("contenido").innerHTML = `
        <h2>Empleados</h2>
        <p>Listado del personal de la ferretería</p>

        ${
          esAdmin
            ? `
              <h3>Agregar empleado</h3>
              <input id="eNombre" placeholder="Nombre">
              <input id="eEmail" placeholder="Email">
              <input id="ePass" type="password" placeholder="Contraseña">
              <button onclick="agregarEmpleado()">Crear empleado</button>
              <hr>
            `
            : ""
        }

        ${
          empleados.length === 0
            ? "<p>No hay empleados registrados</p>"
            : empleados.map(u => `
                <div class="empleado-item">
                  <strong>${u.nombre}</strong><br>
                  Email: ${u.email}<br>
                  ${
                    esAdmin
                      ? `<button onclick="eliminarEmpleado(${u.id_usuario})">Eliminar</button>`
                      : ""
                  }
                </div>
              `).join("")
        }
      `;
    })
    .catch(err => {
      console.error("Error cargando empleados:", err);
      document.getElementById("contenido").innerHTML =
        "<p>Error de servidor</p>";
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

fetch(`${API_URL}/crear-usuario`, {
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

fetch(`${API_URL}/eliminar-usuario/${id}`, {
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
fetch(`${API_URL}/categorias`)
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
  fetch(`${API_URL}/productos`)
    .then(res => res.json())
    .then(data => {

      // 🔐 VALIDACIÓN CRÍTICA
      if (!Array.isArray(data)) {
        console.error("Respuesta inválida /productos:", data);
        document.getElementById("listaCategoria").innerHTML =
          "<p>Error cargando productos</p>";
        return;
      }

      const lista = data.filter(p => p.id_categoria === catId);

      document.getElementById("listaCategoria").innerHTML = `
        <h3>Productos de categoría</h3>
        ${
          lista.length === 0
            ? "<p>No hay productos en esta categoría</p>"
            : lista.map(p => `
                <div class="producto-card">
<img src="${p.imagen || 'https://via.placeholder.com/200'}">
                  <h4>${p.nombre}</h4>
                  <p>${p.descripcion}</p>
                  <p>Precio: $${Number(p.precio).toLocaleString()}</p>
                  <p>Stock: ${p.stock}</p>
                  <button onclick="agregarCarrito(${p.id_producto})">Agregar</button>
                  ${usuarioActivo && usuarioActivo.rol === "admin"
                    ? `<button onclick="mostrarEditarProducto(${p.id_producto})">Editar</button>
                       <button onclick="eliminarProductoAdmin(${p.id_producto})">Eliminar</button>`
                    : ""}
                </div>
              `).join("")
        }
      `;
    })
    .catch(err => {
      console.error("Error productos por categoría:", err);
      document.getElementById("listaCategoria").innerHTML =
        "<p>Error de servidor</p>";
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

fetch(`${API_URL}/crear-usuario`, {
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

fetch(`${API_URL}/eliminar-usuario/${id}`, {
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

  fetch(`${API_URL}/usuarios`)
    .then(res => res.json())
    .then(data => {

      // 🔴 VALIDACIÓN CRÍTICA
      if (!Array.isArray(data)) {
        console.error("Respuesta inválida /usuarios:", data);
        document.getElementById("contenido").innerHTML =
          "<p>Error cargando clientes</p>";
        return;
      }

      const clientes = data.filter(u => u.rol === "cliente");

      document.getElementById("contenido").innerHTML = `
        <h2>Clientes</h2>
        <p>Registro de nuevos clientes</p>

        ${
          esAdmin
            ? `<button onclick="mostrarRegistroCliente()">Crear perfil</button>`
            : ""
        }

        <div id="listaClientes">
          ${
            clientes.length === 0
              ? "<p>No hay clientes registrados</p>"
              : clientes.map(c => `
                  <div class="cliente-item">
                    <strong>${c.nombre}</strong><br>
                    Email: ${c.email}<br>

                    ${
                      esAdmin || usuarioActivo?.email === c.email
                        ? `<button onclick="eliminarCliente(${c.id_usuario})">Eliminar</button>`
                        : ""
                    }
                  </div>
                `).join("")
          }
        </div>
      `;
    })
    .catch(err => {
      console.error("Error cargando clientes:", err);
      document.getElementById("contenido").innerHTML =
        "<p>Error de servidor</p>";
    });
}


/************ VENTAS ************/
function mostrarVentas() {
  fetch(`${API_URL}/ventas`)
    .then(res => res.json())
    .then(data => {

      const contenedor = document.getElementById("contenido");

      // 🔴 VALIDACIÓN CRÍTICA
      if (!Array.isArray(data)) {
        console.error("Respuesta inválida /ventas:", data);
        contenedor.innerHTML = "<p>Error cargando ventas</p>";
        return;
      }

      if (data.length === 0) {
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
            Cliente ID: ${v.id_cliente ?? "-"}<br>
            Total: $${Number(v.total).toLocaleString()}<br><br>

            <button onclick="verBoleta(${v.id_venta})">Ver boleta</button>
            <button onclick="generarBoletaPDF(${v.id_venta})">Ver PDF</button>

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
      document.getElementById("contenido").innerHTML =
        "<p>Error de servidor</p>";
    });
}




/************ ELIMINAR VENTA ************/
function eliminarVenta(id) {
  if (!confirm("¿Eliminar boleta?")) return;

fetch(`${API_URL}/eliminar-venta/${id}`, {
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
document.getElementById("contadorCarrito").innerText = totalItems;
}

function generarBoletaPDF(idVenta) {
  fetch(`${API_URL}/venta/${idVenta}`)
    .then(res => res.json())
    .then(data => {

      if (!Array.isArray(data) || data.length === 0) {
        alert("No hay datos para esta boleta");
        return;
      }

      const venta = data[0];
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: "mm", format: [80, 200] });

      let y = 10;

      /* ===== HEADER ===== */
      doc.setFontSize(10);
      doc.text("FERRETERÍA WEB SPA", 40, y, { align: "center" }); y += 5;
      doc.text("VÁLIDO COMO BOLETA", 40, y, { align: "center" }); y += 6;

      doc.setFontSize(8);
      doc.text(`Boleta N°: ${venta.id_venta}`, 10, y); y += 4;
      doc.text(`Fecha: ${new Date(venta.fecha).toLocaleString()}`, 10, y); y += 5;

      doc.text("------------------------------------------", 40, y, { align: "center" });
      y += 5;

      /* ===== DETALLE ===== */
      data.forEach(p => {
        doc.text(`${p.producto} x${p.cantidad}`, 10, y);
        doc.text(`$${Number(p.subtotal).toLocaleString()}`, 70, y, { align: "right" });
        y += 4;
      });

      doc.text("------------------------------------------", 40, y, { align: "center" });
      y += 5;

      /* ===== TOTALES ===== */
      const total = Number(venta.total);
      const iva = Math.round(total * 0.19 / 1.19);
      const neto = total - iva;

      doc.text(`NETO: $${neto.toLocaleString()}`, 10, y); y += 4;
      doc.text(`IVA (19%): $${iva.toLocaleString()}`, 10, y); y += 4;
      doc.text(`TOTAL: $${total.toLocaleString()}`, 10, y); y += 6;

      /* ===== DESPACHO ===== */
      if (venta.d_nombre) {
        doc.text("------------------------------------------", 40, y, { align: "center" });
        y += 5;

        doc.text("DESPACHO", 40, y, { align: "center" }); y += 5;
        doc.text(`${venta.d_nombre} ${venta.d_apellido}`, 10, y); y += 4;
        doc.text(venta.direccion, 10, y); y += 4;
        doc.text(`${venta.comuna} Nº ${venta.numero}`, 10, y); y += 4;
        doc.text(`Tel: ${venta.telefono}`, 10, y); y += 5;
      }

      doc.text("------------------------------------------", 40, y, { align: "center" });
      y += 4;
      doc.text("GRACIAS POR SU COMPRA", 40, y, { align: "center" });

      doc.save(`boleta_${venta.id_venta}.pdf`);
    })
    .catch(err => {
      console.error(err);
      alert("Error generando PDF");
    });
}
