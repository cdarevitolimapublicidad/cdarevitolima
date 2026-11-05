/* ═══════════════════════════════════════════════════════════════
   CDA REVITOLIMA · Conexión con Supabase
   - Público (web y portal cliente): solo llama funciones seguras (RPC).
   - Administrativo: inicia sesión con correo + contraseña (Supabase Auth),
     carga los datos y guarda automáticamente cada cambio.
   ═══════════════════════════════════════════════════════════════ */
const SUPABASE_URL = 'https://lskgxaufwecslzkslxzq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxza2d4YXVmd2Vjc2x6a3NseHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTA4NDcsImV4cCI6MjEwNzY2Njg0N30.94xDTi-3Dqvmrl9lX0gOCjTWC5OeXsmHjSjVWEPrwkE';

/* Código de verificación por correo.
   false = se entra solo con usuario y contraseña (estado TEMPORAL).
   true  = además pide un código que llega al correo de la persona.
   Para volver a activarlo: configurar el SMTP en Supabase (Authentication → Emails),
   pegar la plantilla "Magic link" con {{ .Token }} y cambiar esto a true.
   Con usuario = contraseña, este código es la protección real. */
/* ACCESO AL ADMIN · modo de ingreso:
   'link'     = la persona escribe su usuario, le llega un enlace al buzón y entra al abrirlo (sin contraseña ni código).
   'password' = usuario + contraseña (sin correo).
   'code'     = usuario + contraseña + código de 6 dígitos al buzón.
   Para 'link' y 'code' hace falta el SMTP activo en Supabase. */
const ADMIN_LOGIN_MODE = 'code';
/* Buzón ÚNICO al que llega el enlace/código, entre quien entre. Debe existir en Authentication. */
const ADMIN_2FA_MAILBOX = 'cdarevitolimapublicidad@gmail.com';
/* FormSubmit: servicio que envía el código al correo SIN SMTP ni Supabase.
   Igual que en Electronics BGA. La primera vez hay que activar el correo (un clic
   en el correo de bienvenida de FormSubmit). */
const FS_ENDPOINT = 'https://formsubmit.co/ajax/' + ADMIN_2FA_MAILBOX;
let   _adminCode = null, _adminCodeExp = 0, _adminCodeUser = null;
const ADMIN_EMAIL_2FA = (ADMIN_LOGIN_MODE === 'code');
/* Minutos de inactividad antes de cerrar la sesión del administrativo. */
const ADMIN_IDLE_MIN = 30;

let SB = null;
try {
  SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
} catch (e) { console.warn('Supabase no disponible', e); }

/* ---------- Colecciones y permisos (espejo del servidor; la autoridad es RLS) ---------- */
const SB_COLLS = ['clients','vehicles','appts','revisions','credits','cartera','reminders','cashLedger','bankAccounts','followups','advisors'];
const SB_OPS   = ['clients','vehicles','appts','reminders','revisions'];
const sbCan = {
  read:  (role, c) => role !== 'asesor' || [...SB_OPS, 'config', 'log'].includes(c),
  write: (role, c) =>
    role === 'superusuario' || role === 'superadministrador' ? true :
    role === 'administrador' ? c !== 'config' :
    role === 'asesor' ? [...SB_OPS, 'log', 'advisors'].includes(c) : false
};

let sbRole = null, sbReady = false, sbBusy = false, sbStage = '';
let sbSnap = {};                       // coll -> Map(id -> JSON guardado)
let sbLast = '1970-01-01T00:00:00Z';   // último updated_at recibido del servidor
let sbFlushTimer = null, sbPullTimer = null;

/* ---------- Indicador de guardado (nunca más fallos silenciosos) ---------- */
function sbPill(state, msg) {
  let el = document.getElementById('sbStatus');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sbStatus';
    el.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:9999;font:600 12px/1.2 system-ui,sans-serif;' +
      'padding:8px 13px;border-radius:99px;box-shadow:0 4px 14px rgba(0,0,0,.18);display:none;max-width:78vw';
    document.body.appendChild(el);
  }
  if (state === 'hide') { el.style.display = 'none'; return; }
  const S = {
    ok:     ['#EAF6EC', '#164A26', '● Todo guardado'],
    saving: ['#FFF6E0', '#7A5A00', '● Guardando…'],
    err:    ['#FDECEA', '#A12622', '⚠ No se está guardando. ' + (msg || 'Revisa la conexión.')]
  }[state];
  el.style.background = S[0]; el.style.color = S[1]; el.textContent = S[2]; el.style.display = 'block';
}

/* ---------- Funciones públicas (RPC) ---------- */
async function sbRpc(name, args) {
  if (!SB) throw new Error('SIN_CONEXION');
  const { data, error } = await SB.rpc(name, args || {});
  if (error) throw error;
  return data;
}
const sbReservar       = (cl, veh, ap) => sbRpc('reservar_cita', { p_cliente: cl, p_vehiculo: veh, p_cita: ap });
const sbRecordatorio   = row => sbRpc('registrar_recordatorio', { p_row: row });
const sbSlotsOcupados  = fecha => sbRpc('slots_ocupados', { p_fecha: fecha });
const sbConfigPublica  = () => sbRpc('config_publica');
/* Portal cliente: usuario = cédula, contraseña = cédula */
const sbPortalIngreso = (usuario, clave) => sbRpc('portal_ingreso', { p_usuario: usuario, p_clave: clave });
const sbPortalCambio = (usuario, clave, tipo, id, cambios) =>
  sbRpc('portal_cambio', { p_usuario: usuario, p_clave: clave, p_tipo: tipo, p_id: id, p_cambios: cambios });

/* ---------- Acceso del administrativo (correo + contraseña) ---------- */
function sbMask(email) {
  const [u, d] = String(email).split('@');
  return (u || '').slice(0, 2) + '***@' + (d || '');
}
/* Error con el motivo exacto (se muestra bajo el mensaje y queda en la consola del navegador). */
function sbFail(code, step, err) {
  const e = new Error(code);
  e.detail = step + (err && err.message ? ' → ' + err.message : '');
  console.warn('[acceso]', step, err || '');
  return e;
}
async function sbAdminLogin(usuario, pass) {
  if (!SB) throw sbFail('SIN_CONEXION', 'el sitio no pudo cargar Supabase');
  usuario = String(usuario || '').trim();
  if (!usuario || !pass) throw new Error('CREDENCIALES');
  // El usuario se traduce al correo en el servidor. Si no existe devuelve uno falso,
  // para que el mensaje de error sea idéntico en ambos casos.
  let email;
  try { email = String(await sbRpc('correo_de_usuario', { p_usuario: usuario })).toLowerCase(); }
  catch (e) { throw sbFail('ERROR_SERVIDOR', 'paso 1 · buscar el usuario', e); }
  const { error } = await SB.auth.signInWithPassword({ email, password: pass });
  if (error) throw sbFail('CREDENCIALES', 'paso 2 · contraseña', error);
  let prof;
  try { prof = await sbRpc('mi_perfil'); }
  catch (e) { await SB.auth.signOut(); throw sbFail('ERROR_SERVIDOR', 'paso 3 · permisos', e); }
  if (!prof) { await SB.auth.signOut(); throw sbFail('SIN_ACCESO', 'paso 3 · el correo ' + sbMask(email) + ' no figura como personal activo'); }
  if (ADMIN_EMAIL_2FA) {
    // La contraseña ya se verificó. Se cierra esa sesión y el ingreso se completa
    // solo con el código, que SIEMPRE llega al buzón de seguridad (no al correo del usuario).
    await SB.auth.signOut();
    const { error: e2 } = await SB.auth.signInWithOtp({ email: ADMIN_2FA_MAILBOX, options: { shouldCreateUser: false } });
    if (e2) throw sbFail('CODIGO_NO_ENVIADO', 'paso 4 · enviar el código al buzón de seguridad', e2);
    // Se recuerda a quién se dejará entrar cuando el código sea correcto.
    return { needCode: true, email: ADMIN_2FA_MAILBOX, pending: email, hint: sbMask(ADMIN_2FA_MAILBOX) };
  }
  return { profile: prof };
}
async function sbAdminVerify(email, code, pending) {
  code = String(code || '').trim();
  const usuario = pending || _adminCodeUser;
  // Verificar el código que generó el sitio (enviado por FormSubmit).
  if (!_adminCode || Date.now() > _adminCodeExp) throw sbFail('CODIGO_INVALIDO', 'el código venció, pide uno nuevo');
  if (code !== _adminCode) throw sbFail('CODIGO_INVALIDO', 'verificar el código');
  _adminCode = null; // un solo uso
  // Abrir la sesión de Supabase (necesaria para leer/escribir datos) con la contraseña del usuario.
  let realEmail;
  try { realEmail = String(await sbRpc('correo_de_usuario', { p_usuario: usuario })).toLowerCase(); }
  catch (e) { throw sbFail('ERROR_SERVIDOR', 'identificar al usuario', e); }
  const { error } = await SB.auth.signInWithPassword({ email: realEmail, password: usuario });
  if (error) throw sbFail('SIN_ACCESO', 'no se pudo abrir la sesión; revisa la contraseña del usuario', error);
  let prof;
  try { prof = await sbRpc('mi_perfil'); }
  catch (e) { await SB.auth.signOut(); throw sbFail('ERROR_SERVIDOR', 'permisos', e); }
  if (!prof) { await SB.auth.signOut(); throw sbFail('SIN_ACCESO', 'el usuario no figura como personal activo'); }
  return { profile: prof };
}

/* Camino B: enviar un enlace de acceso al buzón. El enlace, al abrirse, crea la sesión.
   Recordamos en este navegador a quién se dejará entrar (su usuario), para asignar el rol al volver. */
async function sbAdminSendLink(usuario) {
  if (!SB) throw sbFail('SIN_CONEXION', 'el sitio no pudo cargar Supabase');
  usuario = String(usuario || '').trim();
  if (!usuario) throw new Error('CREDENCIALES');
  let email;
  try { email = String(await sbRpc('correo_de_usuario', { p_usuario: usuario })).toLowerCase(); }
  catch (e) { throw sbFail('ERROR_SERVIDOR', 'paso 1 · buscar el usuario', e); }
  // Si el usuario no existe, email es @no-existe.invalid: Supabase no enviará nada,
  // pero respondemos igual para no revelar qué usuarios existen.
  const esValido = !email.endsWith('@no-existe.invalid');
  try { localStorage.setItem('cda_admin_pending', esValido ? email : ''); } catch(_) {}
  if (esValido) {
    const { error } = await SB.auth.signInWithOtp({
      email: ADMIN_2FA_MAILBOX,
      options: { shouldCreateUser: false, emailRedirectTo: location.origin + '/admin' }
    });
    if (error) throw sbFail('CODIGO_NO_ENVIADO', 'paso 2 · enviar el enlace al buzón', error);
  }
  return { linkSent: true, hint: sbMask(ADMIN_2FA_MAILBOX) };
}

/* Personas que aparecen como tarjetas en el acceso. El usuario coincide con el de staff. */
const ADMIN_ROSTER = [
  { usuario:'G3r3nc14',  nombre:'Gerencia',    detalle:'Ricardo Quiroga',   rol:'superusuario',       color:'#6D28D9', ini:'RQ' },
  { usuario:'D1r3cc10n', nombre:'Dirección',   detalle:'Dirección General', rol:'superadministrador', color:'#0F3319', ini:'DG' },
  { usuario:'C4j4',      nombre:'Caja',        detalle:'Paola Jiménez',     rol:'administrador',      color:'#1D6132', ini:'PJ' },
  { usuario:'4s3s0r1',   nombre:'Asesor 1',    detalle:'Diego Ramírez',     rol:'asesor',             color:'#B7862C', ini:'DR' },
  { usuario:'4s3s0r2',   nombre:'Asesor 2',    detalle:'Carolina Muñoz',    rol:'asesor',             color:'#B7862C', ini:'CM' }
];
/* Toca una tarjeta → se envía el código al buzón; al verificar entra con el rol de esa persona. */
async function sbAdminRequestCode(usuario) {
  usuario = String(usuario || '').trim();
  // Resolver el correo real del usuario (para los permisos después) y validar que exista.
  let email;
  try { email = String(await sbRpc('correo_de_usuario', { p_usuario: usuario })).toLowerCase(); }
  catch (e) { throw sbFail('ERROR_SERVIDOR', 'paso 1 · identificar al usuario', e); }
  if (email.endsWith('@no-existe.invalid')) throw sbFail('SIN_ACCESO', 'ese usuario no está activo');
  // Generar código de 6 dígitos y enviarlo por FormSubmit.
  const code = String(Math.floor(100000 + Math.random() * 900000));
  _adminCode = code; _adminCodeExp = Date.now() + 10 * 60 * 1000; _adminCodeUser = usuario;
  const payload = {
    _subject: 'Código de acceso · CDA Revitolima',
    Usuario: usuario,
    Codigo: code,
    Vence: 'en 10 minutos',
    Fecha: new Date().toLocaleString('es-CO'),
    _template: 'table',
    _captcha: 'false'
  };
  let enviado = false;
  // Intento 1: AJAX (rápido, confirma el envío).
  try {
    const r = await fetch(FS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.success !== 'false') enviado = true;
  } catch (e) { /* cae al intento 2 */ }
  // Intento 2 (respaldo): POST clásico por formulario a un iframe oculto. No sufre CORS,
  // así funciona aunque el dominio aún no esté “activado” para AJAX.
  if (!enviado) {
    try {
      await new Promise((resolve, reject) => {
        const nombre = 'fs_' + Date.now();
        const ifr = document.createElement('iframe');
        ifr.name = nombre; ifr.style.display = 'none';
        const frm = document.createElement('form');
        frm.action = 'https://formsubmit.co/' + ADMIN_2FA_MAILBOX;
        frm.method = 'POST'; frm.target = nombre; frm.style.display = 'none';
        Object.entries(payload).forEach(([k, v]) => {
          const inp = document.createElement('input'); inp.type = 'hidden'; inp.name = k; inp.value = v; frm.appendChild(inp);
        });
        document.body.appendChild(ifr); document.body.appendChild(frm);
        let done = false;
        ifr.onload = () => { if (done) return; done = true; enviado = true; setTimeout(() => { frm.remove(); ifr.remove(); }, 500); resolve(); };
        setTimeout(() => { if (!done) { done = true; try{frm.remove();ifr.remove();}catch(_){} resolve(); } }, 4000); // si no cargó, NO se marca enviado
        frm.submit();
      });
    } catch (e) { /* nada */ }
  }
  // Devolvemos el código al front. 'enviado' dice si el correo salió; si no, el front muestra el número.
  return { needCode: true, pending: usuario, hint: sbMask(ADMIN_2FA_MAILBOX), fallbackCode: code, enviado };
}

async function sbAdminResume() {
  if (!SB) return null;
  try {
    const { data } = await SB.auth.getSession();
    if (!data || !data.session) return null;
    // Si la sesión es la del buzón (entró por enlace), el rol es el del usuario recordado.
    let pending = null;
    try { pending = localStorage.getItem('cda_admin_pending') || null; } catch(_) {}
    const sesionEmail = (data.session.user && data.session.user.email || '').toLowerCase();
    const arg = (sesionEmail === ADMIN_2FA_MAILBOX && pending) ? { p_email: pending } : {};
    const prof = await sbRpc('mi_perfil', arg);
    // Al entrar bien, limpiamos la marca y la sesión del enlace del URL.
    if (prof) { try { localStorage.removeItem('cda_admin_pending'); } catch(_) {}
      if (location.hash) history.replaceState(null, '', location.pathname); }
    return prof;
  } catch (e) { return null; }
}
async function sbAdminLogout() {
  try { await sbFlush(true); } catch (e) {}
  sbReady = false; sbRole = null;
  clearInterval(sbFlushTimer); clearInterval(sbPullTimer);
  sbPill('hide');
  if (SB) { try { await SB.auth.signOut(); } catch (e) {} }
}

/* ---------- Carga y guardado de datos (solo con sesión de personal) ---------- */
const sbGet = c => c === 'config' ? [Object.assign({ id: 'main' }, DB.config)] : (DB[c] || []);
const sbKey = o => String(o.id);

async function sbFetchAll(c) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await SB.from('cda_docs').select('id,data,updated_at')
      .eq('coll', c).order('id').range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

async function sbStaffStart(profile) {
  sbRole = profile.role; sbReady = false; sbSnap = {};
  let maxTs = '1970-01-01T00:00:00Z';
  const seen = r => { if (r.updated_at > maxTs) maxTs = r.updated_at; };

  for (const c of SB_COLLS) {
    if (!sbCan.read(sbRole, c)) { sbSnap[c] = new Map(); continue; }
    sbStage = c;
    const rows = await sbFetchAll(c);
    rows.forEach(seen);
    if (c === 'bankAccounts' && !rows.length) { sbSnap[c] = new Map(); continue; } // se conservan las cuentas por defecto y se suben
    DB[c].length = 0;
    rows.forEach(r => DB[c].push(r.data));
    sbSnap[c] = new Map(DB[c].map(o => [sbKey(o), JSON.stringify(o)]));
  }

  // Configuración (tarifas, horarios, preguntas...). La primera vez se sube la de por defecto.
  if (sbCan.read(sbRole, 'config')) {
    sbStage = 'config';
    const { data, error } = await SB.from('cda_docs').select('data,updated_at')
      .eq('coll', 'config').eq('id', 'main').maybeSingle();
    if (error) throw error;
    if (data) {
      seen(data);
      const d = Object.assign({}, data.data); delete d.id;
      Object.assign(DB.config, d);
      sbSnap.config = new Map([['main', JSON.stringify(sbGet('config')[0])]]);
    } else sbSnap.config = new Map();
  }

  // Historial de actividad (últimas 200 entradas)
  if (sbCan.read(sbRole, 'log')) {
    const { data, error } = await SB.from('cda_docs').select('data')
      .eq('coll', 'log').order('created_at', { ascending: false }).limit(200);
    if (!error && data) { DB.log.length = 0; data.forEach(r => DB.log.push(r.data)); }
  }

  // Equipo (para el módulo de usuarios). Sin contraseñas: no existen en el navegador.
  USERS.length = 0;
  try {
    const eq = await sbRpc('listar_equipo');
    (eq || []).forEach(x => USERS.push({ id: x.email, username: x.username || x.email, name: x.name, role: x.role, advisorId: x.advisorId }));
  } catch (e) {}

  sbLast = maxTs; sbReady = true; sbPill('ok');
  clearInterval(sbFlushTimer); clearInterval(sbPullTimer);
  sbFlushTimer = setInterval(() => sbFlush(false), 1500);
  sbPullTimer  = setInterval(sbPull, 30000);
}

/* Guarda lo que cambió: detecta altas, EDICIONES y bajas comparando con la última copia guardada. */
async function sbFlush(force) {
  if (!SB || !sbReady || (sbBusy && !force)) return;
  const work = [];
  for (const c of [...SB_COLLS, 'config']) {
    if (!sbCan.write(sbRole, c) || !sbSnap[c]) continue;
    const cur = new Map(sbGet(c).filter(o => o && o.id !== undefined).map(o => [sbKey(o), JSON.stringify(o)]));
    const prev = sbSnap[c];
    const up = [], del = [];
    cur.forEach((j, id) => { if (prev.get(id) !== j) up.push({ coll: c, id, data: JSON.parse(j) }); });
    prev.forEach((_, id) => { if (!cur.has(id)) del.push(id); });
    if (up.length || del.length) work.push({ c, cur, up, del });
  }
  if (!work.length) return;
  sbBusy = true; sbPill('saving');
  try {
    for (const w of work) {
      for (let i = 0; i < w.up.length; i += 200) {
        const { error } = await SB.from('cda_docs').upsert(w.up.slice(i, i + 200), { onConflict: 'coll,id' });
        if (error) throw error;
      }
      if (w.del.length) {
        const { error } = await SB.from('cda_docs').delete().eq('coll', w.c).in('id', w.del);
        if (error) throw error;
      }
      sbSnap[w.c] = w.cur;
    }
    sbPill('ok');
  } catch (e) {
    console.warn('Supabase guardar', e);
    sbPill('err', e && e.message ? e.message : '');
  } finally { sbBusy = false; }
}

/* Trae lo que otros usuarios cambiaron (cada 30 s). Si hay un cambio local sin guardar, gana el local. */
async function sbPull() {
  if (!SB || !sbReady || sbBusy) return;
  try {
    let since = sbLast, changed = false;
    for (let guard = 0; guard < 20; guard++) {
      const { data, error } = await SB.from('cda_docs').select('coll,id,data,updated_at')
        .gte('updated_at', since).order('updated_at').limit(1000);
      if (error) throw error;
      for (const r of data) {
        if (r.coll === 'log' || !sbSnap[r.coll]) continue;
        const j = JSON.stringify(r.data), snap = sbSnap[r.coll];
        if (r.coll === 'config') {
          const loc = JSON.stringify(sbGet('config')[0]);
          if (loc === snap.get('main') && loc !== j) {
            const d = Object.assign({}, r.data); delete d.id; Object.assign(DB.config, d);
            snap.set('main', JSON.stringify(sbGet('config')[0])); changed = true;
          }
          continue;
        }
        const arr = DB[r.coll]; if (!arr) continue;
        const idx = arr.findIndex(o => sbKey(o) === r.id);
        const locJ = idx >= 0 ? JSON.stringify(arr[idx]) : null;
        if (locJ !== null && locJ !== snap.get(r.id)) continue;   // cambio local pendiente
        if (locJ === j) { snap.set(r.id, j); continue; }
        if (idx >= 0) arr[idx] = r.data; else arr.push(r.data);
        snap.set(r.id, j); changed = true;
      }
      const next = data.length ? data[data.length - 1].updated_at : since;
      if (data.length < 1000 || next === since) { since = next; break; }
      since = next;
    }
    sbLast = since;
    if (changed) sbRefreshUI();
  } catch (e) { console.warn('Supabase actualizar', e); }
}

function sbRefreshUI() {
  const m = document.getElementById('modal');
  if (m && m.classList.contains('on')) return;               // no interrumpir un formulario abierto
  const a = document.activeElement;
  if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.closest('#appAdm')) return;
  if (typeof renderAdmin === 'function') renderAdmin();
}

/* Historial de actividad (solo personal con sesión). */
async function sbLog(texto, usuario) {
  if (!SB || !sbReady || !sbCan.write(sbRole, 'log')) return;
  try {
    const id = 'l_' + [...crypto.getRandomValues(new Uint8Array(8))].map(b => b.toString(16).padStart(2, '0')).join('');
    await SB.from('cda_docs').insert({ coll: 'log', id, data: { id, t: texto, at: new Date().toLocaleString('es-CO'), user: usuario || '' } });
  } catch (e) {}
}

addEventListener('beforeunload', () => { try { sbFlush(true); } catch (e) {} });
