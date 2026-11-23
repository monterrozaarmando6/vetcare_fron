(() => {
  const API = window.APP_CONFIG?.API_BASE_URL || "http://localhost:8080/api";
  const session = JSON.parse(localStorage.getItem("vetcare_session") || "null");
  const state = { session, current: "dashboard", records: [] };
  const modules = {
    dashboard: { title: "Panel principal", icon: "⌂", roles: ["ADMIN", "VETERINARIAN", "RECEPTIONIST", "OWNER"] },
    owners: { title: "Propietarios", singular: "propietario", icon: "♙", fields: ["name", "document", "phone", "email"], roles: ["ADMIN", "RECEPTIONIST"] },
    pets: { title: "Mascotas", singular: "mascota", icon: "🐾", fields: ["name", "species", "breed", "sex", "birthDate", "weight", "ownerId"], roles: ["ADMIN", "VETERINARIAN", "RECEPTIONIST", "OWNER"] },
    appointments: { title: "Citas", singular: "cita", icon: "◷", fields: ["petId", "date", "time", "veterinarianId", "status"], roles: ["ADMIN", "VETERINARIAN", "RECEPTIONIST", "OWNER"] },
    consultations: { title: "Consultas", singular: "consulta", icon: "⌁", fields: ["petId", "veterinarianId", "symptoms", "diagnosis", "observations"], roles: ["ADMIN", "VETERINARIAN", "OWNER"] },
    vaccines: { title: "Vacunas", singular: "vacuna", icon: "✚", fields: ["petId", "name", "appliedDate", "nextDose"], roles: ["ADMIN", "VETERINARIAN", "OWNER"] },
    treatments: { title: "Tratamientos", singular: "tratamiento", icon: "♡", fields: ["petId", "medication", "dose", "frequency", "startDate", "endDate", "status"], roles: ["ADMIN", "VETERINARIAN", "OWNER"] },
    allergies: { title: "Alergias y antecedentes", singular: "registro", icon: "!", fields: ["petId", "type", "description"], roles: ["ADMIN", "VETERINARIAN"] },
    medications: { title: "Medicamentos", singular: "medicamento", icon: "◈", fields: ["name", "presentation", "price"], roles: ["ADMIN", "VETERINARIAN", "RECEPTIONIST"] },
    inventory: { title: "Inventario", singular: "producto", icon: "▣", fields: ["name", "quantity", "minimumStock", "unit"], roles: ["ADMIN", "VETERINARIAN", "RECEPTIONIST"] },
    services: { title: "Servicios", singular: "servicio", icon: "◇", fields: ["name", "price", "active"], roles: ["ADMIN", "RECEPTIONIST"] },
    payments: { title: "Pagos", singular: "pago", icon: "$", fields: ["amount", "method", "appointmentId", "status"], roles: ["ADMIN", "RECEPTIONIST"] },
    invoices: { title: "Facturas", singular: "factura", icon: "▤", fields: ["paymentId", "amount", "status"], roles: ["ADMIN", "RECEPTIONIST", "OWNER"] },
    notifications: { title: "Notificaciones", singular: "notificación", icon: "◉", fields: ["type", "message", "date"], roles: ["ADMIN", "VETERINARIAN", "RECEPTIONIST", "OWNER"] },
    hospitalizations: { title: "Hospitalizaciones", singular: "hospitalización", icon: "✦", fields: ["petId", "admissionDate", "observations", "status", "dischargeDate"], roles: ["ADMIN", "VETERINARIAN"] },
    users: { title: "Usuarios y roles", singular: "usuario", icon: "♧", fields: ["name", "email", "role", "password"], roles: ["ADMIN"] }
  };
  const $ = (s) => document.querySelector(s);
  const content = $("#content");

  async function request(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (state.session?.token) headers.Authorization = `Bearer ${state.session.token}`;
    let response;
    try { response = await fetch(`${API}${path}`, { ...options, headers }); }
    catch { throw new Error("No se pudo conectar con el backend. Verifica la URL de la API y CORS."); }
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "La solicitud no pudo completarse");
    return payload;
  }
  function notify(message, error = false) { const el = document.createElement("div"); el.className = `toast${error ? " error" : ""}`; el.textContent = message; $("#toast-region").append(el); setTimeout(() => el.remove(), 4000); }
  function friendly(key) { return ({ ownerId:"Propietario", petId:"Mascota", veterinarianId:"Veterinario", admissionDate:"Ingreso", dischargeDate:"Alta", birthDate:"Nacimiento", appliedDate:"Aplicación", nextDose:"Próxima dosis", minimumStock:"Stock mínimo", appointmentId:"Cita", paymentId:"Pago", email:"Correo", name:"Nombre", document:"Documento", phone:"Teléfono", symptoms:"Síntomas", diagnosis:"Diagnóstico", observations:"Observaciones", amount:"Valor", method:"Método", quantity:"Cantidad", status:"Estado", role:"Rol", password:"Contraseña" }[key] || key.replace(/([A-Z])/g, " $1")); }
  function permitted(module) { return modules[module].roles.includes(state.session?.role); }
  function setupNavigation() {
    $("#navigation").innerHTML = Object.entries(modules).filter(([id]) => permitted(id)).map(([id, m]) => `<button class="nav-button ${state.current === id ? "active" : ""}" data-route="${id}"><b>${m.icon}</b><span>${m.title}</span></button>`).join("");
    document.querySelectorAll("[data-route]").forEach(b => b.onclick = () => { state.current = b.dataset.route; setupNavigation(); render(); $("#sidebar").classList.remove("open"); });
  }
  async function render() {
    const meta = modules[state.current];
    $("#page-title").textContent = meta.title; $("#page-kicker").textContent = state.current === "dashboard" ? "VISTA GENERAL" : "GESTIÓN";
    if (state.current === "dashboard") return renderDashboard();
    content.innerHTML = `<div class="section-head"><div><h2>${meta.title}</h2><p>Consulta y administra los registros del módulo.</p></div>${state.session.role !== "OWNER" ? `<button id="add-button" class="primary">+ Nuevo ${meta.singular}</button>` : ""}</div><div class="toolbar"><input id="search" placeholder="Buscar en ${meta.title.toLowerCase()}…" type="search" /></div><div class="table-wrap"><table class="data-table"><thead id="table-head"></thead><tbody id="table-body"><tr><td class="empty" colspan="1"><b>◌</b>Cargando información…</td></tr></tbody></table></div>`;
    $("#add-button")?.addEventListener("click", () => openForm(meta)); $("#search").addEventListener("input", () => drawTable(meta, state.records));
    try { state.records = await request(`/${state.current}`); drawTable(meta, state.records); } catch (e) { content.querySelector("#table-body").innerHTML = `<tr><td class="empty"><b>!</b>${e.message}</td></tr>`; }
  }
  async function renderDashboard() {
    content.innerHTML = `<div class="stats" id="stats"><div class="stat"><p>Cargando datos…</p><strong>—</strong></div></div><div class="dashboard-grid"><section class="panel"><h2>Actividad de atención</h2><div class="chart"><span data-label="Lun" style="height:45%"></span><span data-label="Mar" style="height:72%"></span><span data-label="Mié" style="height:55%"></span><span data-label="Jue" style="height:85%"></span><span data-label="Vie" style="height:63%"></span><span data-label="Sáb" style="height:38%"></span></div></section><section class="panel"><h2>Estado del sistema</h2><div class="activity"><p><span class="pill">EN LÍNEA</span></p><p>La información se consulta directamente desde la API.<br><small>Los indicadores se actualizan al recargar.</small></p><p><b>Consejo:</b> registra una cita o mascota para empezar.</p></div></section></div>`;
    try { const d = await request("/reports/dashboard"); const cards = [["Mascotas", d.pets, "🐾"], ["Propietarios", d.owners, "♙"], ["Citas", d.appointments, "◷"], ["Consultas", d.consultations, "⌁"]]; $("#stats").innerHTML = cards.map(([label,n,icon]) => `<article class="stat"><i>${icon}</i><p>${label}</p><strong>${n ?? 0}</strong></article>`).join(""); } catch (e) { $("#stats").innerHTML = `<article class="stat"><p>No fue posible cargar el panel</p><strong>!</strong></article>`; notify(e.message, true); }
  }
  function drawTable(meta, rows) {
    const term = $("#search")?.value.toLowerCase() || ""; const filtered = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(term)));
    const keys = [...new Set(filtered.flatMap(Object.keys).filter(k => !["id", "createdAt", "updatedAt", "passwordHash"].includes(k)))].slice(0, 6);
    $("#table-head").innerHTML = `<tr>${keys.map(k => `<th>${friendly(k)}</th>`).join("")}<th></th></tr>`;
    $("#table-body").innerHTML = filtered.length ? filtered.map(row => `<tr>${keys.map(k => `<td>${escapeHtml(row[k] ?? "—")}</td>`).join("")}<td>${state.session.role === "ADMIN" ? `<button class="link delete" data-id="${row.id}">Eliminar</button>` : ""}</td></tr>`).join("") : `<tr><td class="empty" colspan="${keys.length + 1}"><b>⌕</b>No hay registros para mostrar.</td></tr>`;
    document.querySelectorAll(".delete").forEach(b => b.onclick = async () => { if (!confirm("¿Eliminar este registro?")) return; try { await request(`/${state.current}/${b.dataset.id}`, { method:"DELETE" }); notify("Registro eliminado"); render(); } catch(e) { notify(e.message, true); } });
  }
  function openForm(meta) { const dialog = $("#record-dialog"); $("#dialog-title").textContent = `Nuevo ${meta.singular}`; $("#form-fields").innerHTML = meta.fields.map(f => `<label>${friendly(f)}<input name="${f}" ${f.includes("Date") || f === "date" ? "type=\"date\"" : f === "password" ? "type=\"password\"" : ""} required /></label>`).join(""); dialog.showModal(); }
  $("#record-form").addEventListener("submit", async (event) => { if (event.submitter?.value === "cancel") return; event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); try { await request(`/${state.current}`, { method:"POST", body: JSON.stringify(data) }); $("#record-dialog").close(); notify("Registro guardado correctamente"); render(); } catch(e) { notify(e.message, true); } });
  async function checkApi() { try { await fetch(`${API}/health`); $("#api-status").textContent = "● API conectada"; } catch { $("#api-status").textContent = "● API no disponible. Configura config.js"; } }
  $("#login-form").addEventListener("submit", async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); try { const result = await request("/auth/login", { method:"POST", body:JSON.stringify(data) }); state.session = result; localStorage.setItem("vetcare_session", JSON.stringify(result)); startApp(); } catch(e) { notify(e.message, true); } });
  $("#recover-button").onclick = async () => { const email = prompt("Escribe tu correo electrónico:"); if (!email) return; try { await request("/auth/recover", { method:"POST", body:JSON.stringify({email}) }); notify("Solicitud de recuperación registrada."); } catch(e) { notify(e.message, true); } };
  $("#logout-button").onclick = () => { localStorage.removeItem("vetcare_session"); state.session = null; $("#app-view").classList.add("hidden"); $("#auth-view").classList.remove("hidden"); };
  $("#theme-button").onclick = () => { document.body.dataset.theme = document.body.dataset.theme === "dark" ? "" : "dark"; };
  $("#menu-button").onclick = () => $("#sidebar").classList.toggle("open");
  function startApp() { $("#auth-view").classList.add("hidden"); $("#app-view").classList.remove("hidden"); $("#role-chip").textContent = state.session.role; $("#avatar").textContent = state.session.role[0]; if (!permitted(state.current)) state.current = "dashboard"; setupNavigation(); render(); }
  function escapeHtml(text) { const d=document.createElement("div"); d.textContent=text; return d.innerHTML; }
  checkApi(); if (state.session) startApp();
})();
