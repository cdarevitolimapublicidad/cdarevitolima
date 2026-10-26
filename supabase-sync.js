/* ═══════════════════════════════════════════════════════════════
   CDA REVITOLIMA · Conexión con Supabase
   - Público (web y portal cliente): solo llama funciones seguras (RPC).
   - Administrativo: inicia sesión con correo + contraseña (Supabase Auth),
     carga los datos y guarda automáticamente cada cambio.
   ═══════════════════════════════════════════════════════════════ */
const SUPABASE_URL = 'https://lskgxaufwecslzkslxzq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxza2d4YXVmd2Vjc2x6a3NseHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTA4NDcsImV4cCI6MjEwNzY2Njg0N30.94xDTi-3Dqvmrl9lX0gOCjTWC5OeXsmHjSjVWEPrwkE';

/* true  = además de usuario y contraseña pide un código enviado al correo de la persona.
   Requiere SMTP propio en Supabase y la plantilla "Magic Link" con {{ .Token }}.
   NO lo apagues: como usuario y contraseña pueden ser iguales, este código es la protección real. */
const ADMIN_EMAIL_2FA = true;
/* Minutos de inactividad antes de cerrar la sesión del administrativo. */
const ADMIN_IDLE_MIN = 30;

let SB = null;
try {
  SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });
} catch (e) { console.warn('Supabase no disponible', e); }

/* ---------- Colecciones y permisos (espejo del servidor; la autoridad es RLS) ---------- */
const SB_COLLS = ['clients','vehicles','appts','revisions','credits','cartera','reminders','cashLedger','bankAccounts'];
const SB_OPS   = ['clients','vehicles','appts','reminders','revisions'];
const sbCan = {
  read:  (role, c) => role !== 'asesor' || [...SB_OPS, 'config', 'log'].includes(c),
  write: (role, c) =>
    role === 'superusuario' || role === 'superadministrador' ? true :
    role === 'administrador' ? c !== 'config' :
    role === 'asesor' ? [...SB_OPS, 'log'].includes(c) : false
};

let sbRole = null, sbReady = false, sbBusy = false;
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
const sbPortalConsulta = (doc, placa) => sbRpc('portal_consulta', { p_doc: doc, p_placa: placa });
const sbPortalActualizar = (doc, placa, tipo, id, cambios) =>
  sbRpc('portal_actualizar', { p_doc: doc, p_placa: placa, p_tipo: tipo, p_id: id, p_cambios: cambios });

/* ---------- Acceso del administrativo (correo + contraseña) ---------- */
function sbMask(email) {
  const [u, d] = String(email).split('@');
  return (u || '').slice(0, 2) + '***@' + (d || '');
}
async function sbAdminLogin(usuario, pass) {
  if (!SB) throw new Error('SIN_CONEXION');
  usuario = String(usuario || '').trim();
  if (!usuario || !pass) throw new Error('CREDENCIALES');
  // El usuario se traduce al correo en el servidor. Si no existe devuelve uno falso,
  // para que el mensaje de error sea idéntico en ambos casos.
  let email;
  try { email = String(await sbRpc('correo_de_usuario', { p_usuario: usuario })).toLowerCase(); }
  catch (e) { throw new Error('ERROR_SERVIDOR'); }
  const { error } = await SB.auth.signInWithPassword({ email, password: pass });
  if (error) throw new Error('CREDENCIALES');
  const prof = await sbRpc('mi_perfil');
  if (!prof) { await SB.auth.signOut(); throw new Error('SIN_ACCESO'); }
  if (ADMIN_EMAIL_2FA) {
    // La contraseña ya se verificó: se cierra esa sesión y solo se abre con el código del correo.
    await SB.auth.signOut();
    const { error: e2 } = await SB.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (e2) throw new Error('CODIGO_NO_ENVIADO');
    return { needCode: true, email, hint: sbMask(email) };
  }
  return { profile: prof };
}
async function sbAdminVerify(email, code) {
  const { error } = await SB.auth.verifyOtp({ email, token: String(code || '').trim(), type: 'email' });
  if (error) throw new Error('CODIGO_INVALIDO');
  const prof = await sbRpc('mi_perfil');
  if (!prof) { await SB.auth.signOut(); throw new Error('SIN_ACCESO'); }
  return { profile: prof };
}
async function sbAdminResume() {
  if (!SB) return null;
  try {
    const { data } = await SB.auth.getSession();
    if (!data || !data.session) return null;
    return await sbRpc('mi_perfil');
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
    const rows = await sbFetchAll(c);
    rows.forEach(seen);
    if (c === 'bankAccounts' && !rows.length) { sbSnap[c] = new Map(); continue; } // se conservan las cuentas por defecto y se suben
    DB[c].length = 0;
    rows.forEach(r => DB[c].push(r.data));
    sbSnap[c] = new Map(DB[c].map(o => [sbKey(o), JSON.stringify(o)]));
  }

  // Configuración (tarifas, horarios, preguntas...). La primera vez se sube la de por defecto.
  if (sbCan.read(sbRole, 'config')) {
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
