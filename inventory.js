
// ====== Utilidades de almacenamiento ======
const KEY = {
  ING: 'inv_ingredientes',
  REC: 'inv_recetas',
  TRX: 'inv_transacciones'
};

const nowISO = () => new Date().toISOString();
const byName = (a,b) => a.nombre.localeCompare(b.nombre);

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

// ====== Datos semilla ======
const seedIngredientes = [
  { nombre:'Harina', unidad:'g', cantidad: 5000 },
  { nombre:'Carne', unidad:'g', cantidad: 3000 },
  { nombre:'Pollo', unidad:'g', cantidad: 3000 },
  { nombre:'Queso', unidad:'g', cantidad: 2000 },
  { nombre:'Jamón', unidad:'g', cantidad: 1500 },
  { nombre:'Cebolla', unidad:'g', cantidad: 1200 },
  { nombre:'Choclo', unidad:'g', cantidad: 1000 },
  { nombre:'Huevo', unidad:'u', cantidad: 30 },
  { nombre:'Aceitunas', unidad:'u', cantidad: 50 },
  { nombre:'Leche', unidad:'ml', cantidad: 1000 },
];

// cantidades por UNIDAD de empanada (valores ilustrativos)
const seedRecetas = {
  'Carne': { 'Harina':50, 'Carne':60, 'Cebolla':20, 'Huevo':0.1, 'Aceitunas':0.2 },
  'Pollo': { 'Harina':50, 'Pollo':60, 'Cebolla':15, 'Leche':10 },
  'Jamón y Queso': { 'Harina':50, 'Jamón':30, 'Queso':40 },
  'Humita': { 'Harina':50, 'Choclo':70, 'Cebolla':10, 'Leche':15 },
  'Cordero Patagónico': { 'Harina':55, 'Carne':70, 'Cebolla':20 },
  'Caprese': { 'Harina':50, 'Queso':40 }
};

// ====== Estado ======
let ingredientes = load(KEY.ING, null);
let recetas = load(KEY.REC, null);
let transacciones = load(KEY.TRX, null);

function resetSeeds() {
  ingredientes = [...seedIngredientes].sort(byName);
  recetas = JSON.parse(JSON.stringify(seedRecetas));
  transacciones = [];
  persist();
  renderAll();
  toast('Datos de ejemplo cargados.');
}

function persist() {
  save(KEY.ING, ingredientes);
  save(KEY.REC, recetas);
  save(KEY.TRX, transacciones);
}

// ====== Helpers ======
function el(tag, opts={}) {
  const e = document.createElement(tag);
  if (opts.class) e.className = opts.class;
  if (opts.text) e.textContent = opts.text;
  if (opts.html) e.innerHTML = opts.html;
  if (opts.attrs) for (const [k,v] of Object.entries(opts.attrs)) e.setAttribute(k,v);
  return e;
}

function toast(msg) {
  const dlg = document.getElementById('dlg');
  const span = document.getElementById('dlg-msg');
  span.textContent = msg;
  dlg.showModal();
}

function numero(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

// ====== Inicialización ======
if (!ingredientes || !recetas || !transacciones) {
  resetSeeds();
} else {
  renderAll();
}

// ====== Render ======
function renderAll() {
  renderIngredientes();
  renderIngredientesSelects();
  renderTablaIngredientes();
  renderTiposEmpanada();
  renderRecetaEditor();
  renderActividad();
  renderDashboard();
}

function renderIngredientes() {
  // nada adicional
}

function renderIngredientesSelects() {
  const selAj = document.getElementById('aj-ingrediente');
  selAj.innerHTML = '';
  ingredientes.forEach(i => {
    selAj.appendChild(el('option', { text: i.nombre, attrs:{ value:i.nombre }}));
  });

  const selAdd = document.getElementById('rec-add-ing');
  selAdd.innerHTML = '<option value="">— Elegir ingrediente —</option>';
  ingredientes.forEach(i => selAdd.appendChild(el('option', { text: i.nombre, attrs:{ value:i.nombre }})));
}

function renderTablaIngredientes() {
  const tbody = document.querySelector('#tabla-ingredientes tbody');
  tbody.innerHTML = '';
  ingredientes.forEach(i => {
    const tr = el('tr');
    tr.appendChild(el('td', { text: i.nombre }));
    tr.appendChild(el('td', { text: i.unidad }));
    tr.appendChild(el('td', { html: `<div class="text-right">${i.cantidad.toFixed(2)}</div>` }));
    const actions = el('td', { class:'text-right row-actions' });
    const btnX = el('button', { text:'Eliminar', class:'hover:underline' });
    btnX.addEventListener('click', () => {
      if (confirm(`¿Eliminar ingrediente "${i.nombre}"?`)) {
        ingredientes = ingredientes.filter(x => x.nombre !== i.nombre);
        // quitar de recetas
        for (const tipo of Object.keys(recetas)) {
          delete recetas[tipo][i.nombre];
        }
        persist(); renderAll();
      }
    });
    actions.appendChild(btnX);
    tr.appendChild(actions);
    tbody.appendChild(tr);
  });
}

function renderTiposEmpanada() {
  const tipos = Object.keys(recetas).sort();
  const selRecTipo = document.getElementById('rec-tipo');
  const selProdTipo = document.getElementById('prod-tipo');
  selRecTipo.innerHTML = '';
  selProdTipo.innerHTML = '';
  tipos.forEach(t => {
    selRecTipo.appendChild(el('option', { text:t, attrs:{ value:t }}));
    selProdTipo.appendChild(el('option', { text:t, attrs:{ value:t }}));
  });
}

function renderRecetaEditor() {
  const tipo = document.getElementById('rec-tipo').value || Object.keys(recetas)[0];
  if (!tipo) return;
  const cont = document.getElementById('rec-ingredientes');
  cont.innerHTML = '';
  const map = recetas[tipo] || {};
  Object.entries(map).forEach(([ing, cant]) => {
    const row = el('div', { class:'grid grid-cols-5 gap-2 items-center' });
    row.appendChild(el('div', { class:'col-span-2', text: ing }));
    row.appendChild(el('div', { class:'col-span-2' , html:`<input type="number" step="any" min="0" class="input" value="${cant}">` }));
    const btn = el('button', { class:'text-sm text-red-700 hover:underline justify-self-end', text:'Quitar' });
    btn.addEventListener('click', () => {
      delete recetas[tipo][ing];
      persist(); renderRecetaEditor();
    });
    row.appendChild(btn);
    cont.appendChild(row);
  });
}

function renderActividad() {
  const ol = document.getElementById('actividad');
  ol.innerHTML = '';
  const last = [...transacciones].slice(-20).reverse(); // últimas 20
  last.forEach(t => {
    const li = el('li');
    const fecha = new Date(t.fecha).toLocaleString();
    let desc = '';
    if (t.tipo === 'purchase' || t.tipo === 'adjust' || t.tipo === 'waste') {
      desc = `${t.tipo.toUpperCase()}: ${t.ingrediente} ${t.signo}${t.cantidad} ${findIng(t.ingrediente)?.unidad || ''}`;
    } else if (t.tipo === 'production') {
      desc = `PRODUCCIÓN: ${t.empanada} x${t.cantidad}`;
    } else if (t.tipo === 'sale') {
      desc = `VENTA: ${t.empanada} x${t.cantidad}`;
    }
    li.innerHTML = `<span class="badge mr-2">${fecha}</span> ${desc} ${t.nota ? '— '+t.nota : ''}`;
    ol.appendChild(li);
  });
}

function renderDashboard() {
  const { desde, hasta } = getRango();
  const trx = transacciones.filter(t => {
    const f = new Date(t.fecha).getTime();
    return f >= desde && f <= hasta;
  });

  // KPIs
  const prod = trx.filter(t => t.tipo === 'production');
  const ventas = trx.filter(t => t.tipo === 'sale');

  const unidadesProd = prod.reduce((a,b)=>a + b.cantidad, 0);
  const unidadesVend = ventas.reduce((a,b)=>a + b.cantidad, 0);

  // Top tipos por ventas
  const porTipo = {};
  ventas.forEach(v => porTipo[v.empanada] = (porTipo[v.empanada]||0) + v.cantidad);
  const top = Object.entries(porTipo).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>`${k} (${v})`).join(', ') || '—';

  // Insumos usados por producción (sumarizar used map)
  const uso = {};
  prod.forEach(p => {
    if (p.usados) {
      Object.entries(p.usados).forEach(([ing, cant]) => {
        uso[ing] = (uso[ing]||0) + cant;
      });
    }
  });
  const topInsumos = Object.entries(uso).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>`${k}: ${v.toFixed(1)}`).join(', ') || '—';

  document.getElementById('kpi-producidas').textContent = unidadesProd;
  document.getElementById('kpi-vendidas').textContent = unidadesVend;
  document.getElementById('kpi-top').textContent = top;
  document.getElementById('kpi-insumos').textContent = topInsumos;
}

// ====== Buscadores ======
function findIng(nombre) { return ingredientes.find(i => i.nombre === nombre); }

// ====== Reglas de negocio ======
function aplicarAjuste(nombre, cantidad, signo, tipo, nota='') {
  const ing = findIng(nombre);
  if (!ing) throw new Error('Ingrediente inexistente');
  const delta = signo === '-' ? -cantidad : cantidad;
  const nuevo = +(ing.cantidad + delta);
  if (nuevo < 0) throw new Error('El stock no puede quedar negativo');
  ing.cantidad = nuevo;
  transacciones.push({ tipo, ingrediente:nombre, cantidad, signo, nota, fecha: nowISO() });
  persist();
}

function puedeProducir(tipo, cantidad) {
  const receta = recetas[tipo] || {};
  const faltantes = [];
  for (const [ing, cantUnidad] of Object.entries(receta)) {
    const total = cantUnidad * cantidad;
    const obj = findIng(ing);
    if (!obj || obj.cantidad < total) {
      faltantes.push(`${ing} (${total} ${obj?.unidad || ''})`);
    }
  }
  return { ok: faltantes.length === 0, faltantes };
}

function producir(tipo, cantidad) {
  const check = puedeProducir(tipo, cantidad);
  if (!check.ok) {
    throw new Error('Stock insuficiente: ' + check.faltantes.join(', '));
  }
  const usados = {};
  for (const [ing, cantUnidad] of Object.entries(recetas[tipo])) {
    const total = cantUnidad * cantidad;
    findIng(ing).cantidad -= total;
    usados[ing] = total;
  }
  transacciones.push({ tipo:'production', empanada:tipo, cantidad, usados, fecha: nowISO() });
  persist();
}

function vender(tipo, cantidad) {
  transacciones.push({ tipo:'sale', empanada:tipo, cantidad, fecha: nowISO() });
  persist();
}

// ====== Eventos UI ======
document.getElementById('btn-reset').addEventListener('click', () => {
  if (confirm('Esto borrará los datos actuales y cargará los de ejemplo.')) resetSeeds();
});

document.getElementById('btn-borrar-actividad').addEventListener('click', () => {
  if (confirm('¿Borrar TODO el historial de transacciones?')) {
    transacciones = [];
    persist(); renderAll();
  }
});

// Ingrediente
document.getElementById('form-ingrediente').addEventListener('submit', (e) => {
  e.preventDefault();
  const nombre = e.target['ingr-nombre'].value.trim();
  const unidad = e.target['ingr-unidad'].value;
  const cantidad = numero(e.target['ingr-cantidad'].value);
  if (!nombre) return toast('Ingresá un nombre.');
  if (findIng(nombre)) return toast('Ya existe un ingrediente con ese nombre.');
  ingredientes.push({ nombre, unidad, cantidad });
  ingredientes.sort(byName);
  persist(); renderAll();
  e.target.reset();
  toast('Ingrediente agregado.');
});

// Ajuste
document.getElementById('form-ajuste').addEventListener('submit', (e) => {
  e.preventDefault();
  const ingrediente = e.target['aj-ingrediente'].value;
  const tipo = e.target['aj-tipo'].value;
  const cantidad = numero(e.target['aj-cantidad'].value);
  const signo = e.target['aj-signo'].value;
  const nota = e.target['aj-nota'].value.trim();
  if (!ingrediente || !cantidad) return toast('Completá ingrediente y cantidad.');
  try {
    aplicarAjuste(ingrediente, cantidad, signo, tipo, nota);
    renderAll();
    e.target.reset();
    toast('Ajuste registrado.');
  } catch (err) {
    toast(err.message);
  }
});

// Recetas
document.getElementById('rec-tipo').addEventListener('change', renderRecetaEditor);
document.getElementById('rec-limpiar').addEventListener('click', () => {
  const tipo = document.getElementById('rec-tipo').value;
  recetas[tipo] = {};
  persist(); renderRecetaEditor();
});
document.getElementById('rec-add-btn').addEventListener('click', () => {
  const tipo = document.getElementById('rec-tipo').value;
  const ing = document.getElementById('rec-add-ing').value;
  const cant = numero(document.getElementById('rec-add-cant').value);
  if (!ing) return toast('Elegí un ingrediente.');
  if (cant <= 0) return toast('Ingresá una cantidad mayor a 0.');
  recetas[tipo] ||= {};
  recetas[tipo][ing] = cant;
  persist(); renderRecetaEditor();
  document.getElementById('rec-add-cant').value = '';
});
document.getElementById('form-receta').addEventListener('submit', (e) => {
  e.preventDefault();
  // tomar inputs dinámicos
  const tipo = document.getElementById('rec-tipo').value;
  const rows = document.querySelectorAll('#rec-ingredientes .grid');
  recetas[tipo] = {};
  rows.forEach(r => {
    const ing = r.children[0].textContent;
    const cant = numero(r.querySelector('input').value);
    if (cant > 0) recetas[tipo][ing] = cant;
  });
  persist();
  toast('Receta guardada.');
});

// Producción / Venta
document.getElementById('form-produccion').addEventListener('submit', (e) => {
  e.preventDefault();
  const tipo = e.target['prod-tipo'].value;
  const cantidad = Math.max(1, Math.floor(numero(e.target['prod-cantidad'].value)));
  const accion = e.target['prod-accion'].value;
  try {
    if (accion === 'production') {
      producir(tipo, cantidad);
      toast('Producción registrada y stock descontado.');
    } else {
      vender(tipo, cantidad);
      toast('Venta registrada.');
    }
    renderAll();
    e.target.reset();
  } catch (err) {
    toast(err.message);
  }
});

// Filtro dashboard
document.getElementById('form-filtro').addEventListener('submit', (e) => {
  e.preventDefault();
  renderDashboard();
});

function getRango() {
  const d = document.getElementById('f-desde').value;
  const h = document.getElementById('f-hasta').value;
  const hoy = new Date();
  const start = d ? new Date(d + 'T00:00:00') : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const end = h ? new Date(h + 'T23:59:59') : new Date();
  return { desde: start.getTime(), hasta: end.getTime() };
}

// Exportar CSV de ingredientes
document.getElementById('btn-exportar').addEventListener('click', () => {
  const rows = [['Ingrediente','Unidad','Cantidad']].concat(
    ingredientes.map(i => [i.nombre, i.unidad, i.cantidad])
  );
  const csv = rows.map(r => r.map(x => `"${String(x).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ingredientes.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// ====== Accesibilidad menor: cerrar dialog con Esc ======
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const dlg = document.getElementById('dlg');
    if (dlg.open) dlg.close();
  }
});
