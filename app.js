const FOTOS={
  camila:'img/camila.jpg',
  edson:'img/edson.jpg',
  jhon:'img/jhon.jpg',
  ricardo:'img/ricardo.jpg',
  oscar:'img/oscar.jpg',
  andres:'img/andres.jpg',
  michael:'img/michael.jpg',
  vpub:'img/vpub.jpg',
  vmoto:'img/vmoto.jpg',
  vcar:'img/vcar.jpg',
  hero:'img/hero.jpg',
  fachada:'img/fachada.jpg',
  pista:'img/pista.jpg',
  motos:'img/motos.jpg',
  recepcion:'img/recepcion.jpg',
  via:'img/via.jpg',
  entrada:'img/entrada.jpg'
};
if(!window.CDA_ENTRY||window.CDA_ENTRY==='pub') document.querySelectorAll('[data-foto]').forEach(i=>{const k=i.dataset.foto; if(FOTOS[k]) i.src=FOTOS[k];});
const LOGO_SRC='img/logo.png';
document.querySelectorAll('[data-logo]').forEach(i=>i.src=LOGO_SRC);
/* ═══════════════════════════════════════════
   CDA REVITOLIMA · Prototipo funcional
   Estado en memoria. En producción → Supabase.
   ═══════════════════════════════════════════ */

const WA_GENERAL = '573213566313';      // contacto general y asesoría
const WA_PREVENTIVA = '573115708511';   // citas de revisión preventiva gratis
const WA = WA_GENERAL;                   // compatibilidad
const $  = (s,c=document)=>c.querySelector(s);
const $$ = (s,c=document)=>[...c.querySelectorAll(s)];
const uid = p => p+'_'+[...crypto.getRandomValues(new Uint8Array(8))].map(b=>b.toString(16).padStart(2,'0')).join('');
const COP = n => n==null ? '—' : '$'+Number(n).toLocaleString('es-CO');
const today = new Date();
const iso = d => d.toISOString().slice(0,10);
const addDays = (d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
const fmtDate = s => { if(!s) return '—'; const [y,m,d]=s.split('-'); 
  const M=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${+d} ${M[+m-1]} ${y}`; };
const daysTo = s => Math.ceil((new Date(s+'T00:00:00') - new Date(iso(today)+'T00:00:00'))/86400000);

/* ---------- ÁRBOL DE CATEGORÍAS DE VEHÍCULO ---------- */
const VTREE = {
  moto:{ label:'Motocicleta', icon:'moto', sub:[
    {id:'moto', label:'Moto'},
    {id:'motocarro', label:'Motocarro', soon:true},
    {id:'motoelectrica', label:'Motoeléctrica', soon:true}
  ]},
  publico:{ label:'Servicio público', icon:'bus', sub:[
    {id:'taxi', label:'Taxi'},
    {id:'ambulancia', label:'Ambulancia'},
    {id:'placablanca', label:'Placa blanca'},
    {id:'microbus', label:'Microbús'},
    {id:'escolar', label:'Escolar'}
  ]},
  particular:{ label:'Particular', icon:'car', sub:[
    {id:'automovil', label:'Automóvil'},
    {id:'camioneta', label:'Camioneta'},
    {id:'campero', label:'Campero'},
    {id:'electrico', label:'Carro eléctrico'},
    {id:'hibrido', label:'Carro híbrido'},
    {id:'turbo', label:'Turbo'}
  ]}
};

/* Reconocimiento automático de tipo de vehículo por placa colombiana.
   Carro particular/público: 3 letras + 3 números (ABC123).
   Moto: 3 letras + 2 números + 1 letra (ABC12D)  ó  3 letras + 2 números (ABC12). */
function detectVehicleByPlate(plate){
  const p = String(plate||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(/^[A-Z]{3}\d{2}[A-Z]$/.test(p)) return {group:'moto', sub:'moto'};
  if(/^[A-Z]{3}\d{2}$/.test(p))      return {group:'moto', sub:'moto'};
  if(/^[A-Z]{3}\d{3}$/.test(p))      return {group:'particular', sub:'automovil'};
  return null;
}
function isValidPlate(plate){ return !!detectVehicleByPlate(plate); }

function vLabel(subId){
  for(const g of Object.values(VTREE)){ const s=g.sub.find(x=>x.id===subId); if(s) return s.label; }
  return subId||'—';
}
function vGroupOf(subId){
  for(const [k,g] of Object.entries(VTREE)){ if(g.sub.some(x=>x.id===subId)) return k; }
  return null;
}
const SERVICES = [
  {id:'rtm', name:'Revisión técnico-mecánica y de gases', groups:['moto','publico','particular'],
    desc:'Verificación completa del estado mecánico, de seguridad y emisiones. Resultado reportado al RUNT el mismo día.',
    detalle:{
      moto:'Revisamos frenos, dirección, suspensión, luces, llantas, espejos, sistema eléctrico y emisiones. Entre 15 y 20 minutos en nuestra pista exclusiva para motos.',
      particular:'Frenos, suspensión, dirección, luces, vidrios, cinturones, chasis y emisiones de gases. Entre 25 y 35 minutos.',
      publico:'Todos los puntos de la revisión estándar más los requisitos de seguridad del servicio público: cinturones, salidas de emergencia y señalización. Entre 30 y 45 minutos.'
    },
    tiempo:{moto:'15 – 20 min',particular:'25 – 35 min',publico:'30 – 45 min'},
    incluye:['Revisión de gases incluida','Reporte automático al RUNT','Orientación punto por punto'],
    ico:'rtm'},
  {id:'reinsp', name:'Reinspección', groups:['moto','publico','particular'],
    desc:'Si tu vehículo no aprobó, tienes 15 días calendario para corregir y volver. Solo revisamos lo pendiente.',
    detalle:{
      moto:'Verificamos únicamente los puntos que quedaron pendientes en la primera revisión. Si pasaron más de 15 días, se realiza revisión completa.',
      particular:'Se evalúan solo las observaciones del primer informe. Si pasaron más de 15 días desde la primera revisión, se cobra como revisión completa.',
      publico:'Aplican las mismas condiciones: dentro del plazo de 15 días solo pagas reinspección; fuera del plazo, revisión completa.'
    },
    tiempo:{moto:'10 – 15 min',particular:'15 – 20 min',publico:'20 – 25 min'},
    incluye:['Solo puntos pendientes','Plazo de 15 días calendario','Se cobra aparte de la primera revisión'],
    ico:'reinsp'},
  {id:'peritaje', name:'Peritaje técnico', groups:['moto','publico','particular'],
    desc:'Informe detallado del estado real del vehículo: motor, caja, chasis, latonería y desgaste. Ideal para compraventa.',
    detalle:{
      moto:'Evaluamos motor, transmisión, estado del chasis, suspensión y desgaste general. Te entregamos un informe escrito.',
      particular:'Revisión exhaustiva de motor, caja, suspensión, chasis, latonería, pintura y niveles de desgaste. Informe técnico detallado.',
      publico:'Peritaje completo con especial atención a los sistemas de seguridad del servicio público.'
    },
    tiempo:{moto:'20 – 30 min',particular:'30 – 45 min',publico:'40 – 60 min'},
    incluye:['Informe técnico escrito','Para compraventa o seguro','Sin compromiso con el resultado'],
    ico:'peritaje'},
  {id:'preventiva', name:'Revisión preventiva de viaje', groups:['moto','publico','particular'],
    desc:'Revisión gratuita de los puntos críticos de seguridad antes de salir a carretera. Regalo por inscribirte en recordatorios.',
    detalle:{
      moto:'Revisamos llantas, frenos, luces y cadena antes de tu viaje. Totalmente gratis con tu código de bono.',
      particular:'Llantas, frenos, luces, niveles de líquidos y estado general para que viajes tranquilo. Sin costo.',
      publico:'Los mismos puntos de seguridad, adaptados a las exigencias del servicio público.'
    },
    tiempo:{moto:'10 min',particular:'15 min',publico:'15 – 20 min'},
    incluye:['100% gratis con código','Llantas, frenos, luces y niveles','No reemplaza la RTM obligatoria'],
    ico:'preventiva'},
  {id:'financiacion', name:'Financiación Sistecrédito / Addi', groups:['moto','publico','particular'],
    desc:'Paga tu revisión a cuotas con aprobación en minutos, aquí mismo en el centro.',
    detalle:{
      moto:'Financiamos el valor de la revisión de tu moto. La aprobación se gestiona aquí mismo en pocos minutos.',
      particular:'Financiamos la revisión de tu carro con Sistecrédito o Addi. Sin fiador, con aprobación rápida.',
      publico:'Disponible para servicio público. Te ayudamos con el proceso de solicitud en el momento.'
    },
    incluye:['Aprobación en minutos','Sin fiador','Pago a cuotas mensuales'],
    ico:'financiacion'}
];

/* ---------- USUARIOS Y ASESORES (multi-rol) ---------- */
const ADVISORS = [
  {id:'ad1', name:'Diego Ramírez', phone:'3001112233'},
  {id:'ad2', name:'Carolina Muñoz', phone:'3002223344'}
];

/* ═══════ LOS 4 PERFILES DEL SISTEMA ═══════
   1. superusuario       → gerencia. Ve gráficas, informes y generalidades de TODAS las áreas.
                            Su foco es seguimiento, control y revisión. Puede editar si lo necesita.
   2. superadministrador → gerencia también, pero además gestiona internamente a los otros usuarios
                            (crear, editar, permisos). Acceso total sin restricción.
   3. usuario administrador → las digitadoras de caja. Alimentan el sistema: clientes, citas,
                            procesos, pagos y redención de códigos.
   4. usuario asesor     → agenda citas y preventivas. Su día gira alrededor del calendario,
                            sus prospectos y su arqueo de comisiones.                             */
const ROLES = {
  superusuario:{
    label:'Superusuario',
    desc:'Gerencia · seguimiento, control y revisión',
    color:'#6D28D9',
    home:'gerencia',
    nav:['gerencia','informes','dash','agenda','preventivas','citas','clientes','vehiculos','venc','cartera','fin','finanzas','export','config']
  },
  superadministrador:{
    label:'Superadministrador',
    desc:'Gerencia · control total y gestión de usuarios',
    color:'#0F3319',
    home:'gerencia',
    nav:['gerencia','informes','dash','agenda','preventivas','citas','clientes','vehiculos','venc','cartera','fin','finanzas','caja','export','usuarios','config']
  },
  administrador:{
    label:'Usuario administrador',
    desc:'Caja y digitación · alimenta el sistema',
    color:'#1D6132',
    home:'caja',
    nav:['caja','agenda','preventivas','citas','clientes','vehiculos','venc','informes']
  },
  asesor:{
    label:'Usuario asesor',
    desc:'Agenda, prospectos y comisiones',
    color:'#B7862C',
    home:'miagenda',
    nav:['miagenda','agenda','preventivas','clientes','vehiculos','venc','informes']
  }
};
const ROLE_LABEL = Object.fromEntries(Object.entries(ROLES).map(([k,v])=>[k,v.label]));

const USERS = [];   // se llena con el equipo autorizado al iniciar sesión (sin contraseñas)

/* ---------- ESTADO ---------- */
const DB = {
  config:{
    // Tarifas NO publicadas hasta que la administración las cargue.
    tarifas:{ carro:{rtm:null,reinsp:null}, moto:{rtm:null,reinsp:null} },
    categorias:[{id:'carro',label:'Carro (automóvil, camioneta, campero)'},{id:'moto',label:'Moto (motocicleta, motocarro)'}],
    intervalos:[30,15,7,1],
    direccion:'Calle 111 #20-25 Sur, Barrio San Francisco, Aparco · Ibagué, Tolima',
    mapsUrl:'https://maps.app.goo.gl/qH3Rb1j8QAJUWGJF6',
    horarios:[
      {d:'Lunes a viernes', h:'6:00 a. m. – 7:00 p. m.', destacado:true},
      {d:'Sábados', h:'7:00 a. m. – 6:00 p. m.'},
      {d:'Domingos', h:'8:00 a. m. – 2:00 p. m.'},
      {d:'Festivos', h:'8:00 a. m. – 2:00 p. m.'}
    ],
    horarioDom:'Domingos de 8:00 a. m. a 2:00 p. m.',
    telGeneral:'321 356 6313',
    telPreventiva:'311 570 8511',
    telefono:'321 356 6313',
    nit:'901.841.056-1',
    comisionPorCita: 2500,
    metaMensualVehiculos: 50,
    regaloRecordatorio: 'Revisión preventiva de viaje GRATIS',
    slots:['08:00','08:40','09:20','10:00','10:40','11:20','12:00','12:40','13:20'],
    faqs:[
      {cat:'antes', q:'¿Qué documentos debo llevar?', a:'Solo necesitas tres cosas: ✅ el <b>vehículo o la moto</b>, ✅ tu <b>documento de identidad</b> y ✅ la <b>tarjeta de propiedad</b>. Nada más — no pedimos poder ni autorización notarial si el vehículo no está a tu nombre.'},
      {cat:'antes', q:'¿Necesito tener el SOAT vigente?', a:'Sí. El <b>SOAT debe estar vigente</b> para poder realizar la revisión técnico-mecánica. Son dos trámites distintos y ambos son obligatorios.'},
      {cat:'antes', q:'¿Cada cuánto debo hacer la revisión?', a:'Los <b>carros particulares nuevos</b> la hacen por primera vez a los <b>6 años</b>. Las <b>motos</b> y el <b>servicio público</b>, a los <b>2 años</b>. Después de la primera, la renovación es <b>anual</b>.'},
      {cat:'antes', q:'¿Debo agendar cita o puedo llegar directo?', a:'Puedes llegar sin cita, pero <b>agendando te atendemos más rápido</b>. Con nuestro horario continuo de 6 a.m. a 7 p.m. siempre hay espacio disponible.'},
      {cat:'proceso', q:'¿Cuánto se demora la revisión?', a:'Depende del vehículo: <b>moto</b> entre 15 y 20 minutos, <b>carro particular</b> entre 25 y 35 minutos, y <b>servicio público</b> entre 30 y 45 minutos.'},
      {cat:'proceso', q:'¿Qué le revisan exactamente a mi vehículo?', a:'Cuatro frentes principales: <b>frenos</b>, <b>suspensión y dirección</b>, <b>luces</b> y <b>emisiones de gases</b>. Además llantas, vidrios, espejos, cinturones y estado del chasis.'},
      {cat:'proceso', q:'¿La revisión de gases se cobra aparte?', a:'No. La <b>revisión de gases va incluida</b> dentro del mismo proceso de la técnico-mecánica, sin costo adicional ni cita separada.'},
      {cat:'proceso', q:'¿Me entregan certificado físico?', a:'Ya no se entrega calcomanía. Tu resultado queda <b>reportado al RUNT automáticamente</b> el mismo día, y la autoridad de tránsito lo consulta directamente en el sistema.'},
      {cat:'resultado', q:'¿Qué pasa si mi vehículo no aprueba?', a:'Te entregamos un <b>informe detallado</b> de lo que debes corregir. Tienes <b>15 días calendario</b> para volver y pagar solo la <b>reinspección</b>, que revisa únicamente los puntos pendientes.'},
      {cat:'resultado', q:'Si me paso de los 15 días, ¿debo pagar todo otra vez?', a:'Sí. Pasados los <b>15 días calendario</b> el proceso se reinicia y debes pagar la <b>revisión completa</b> nuevamente. Por eso te recomendamos corregir y volver lo antes posible.'},
      {cat:'resultado', q:'¿Qué pasa si circulo sin la revisión al día?', a:'Es un comparendo por <b>30 SMLDV</b> y el vehículo puede ser <b>inmovilizado</b>. Renovarla siempre sale mucho más económico que la multa.'},
      {cat:'pagos', q:'¿Cuánto cuesta la revisión?', a:'El valor depende del <b>cilindraje, modelo y tipo de servicio</b>. Usa nuestro simulador y te confirmamos el valor exacto por WhatsApp en segundos.'},
      {cat:'pagos', q:'¿Puedo pagar a cuotas?', a:'Sí. Financiamos con <b>Sistecrédito</b> y <b>Addi</b>, con aprobación en minutos aquí mismo en el centro.'},
      {cat:'pagos', q:'¿Qué medios de pago reciben?', a:'Recibimos <b>efectivo y tarjeta</b>, además de las opciones de financiación.'},
      {cat:'otros', q:'¿Qué es la revisión preventiva de viaje gratis?', a:'🎁 Es nuestro regalo por inscribirte en los recordatorios. Revisamos <b>llantas, frenos, luces y niveles</b> antes de que salgas a carretera, <b>sin costo</b>. Recibes un código que presentas al llegar. <i>No reemplaza la revisión técnico-mecánica obligatoria.</i>'},
      {cat:'otros', q:'¿Atienden motos y servicio público?', a:'Sí. Atendemos <b>motos</b>, <b>carros particulares</b> (incluidos eléctricos e híbridos) y <b>servicio público</b>: taxi, ambulancia, placa blanca, microbús y escolar.'},
      {cat:'otros', q:'¿Qué es el peritaje técnico?', a:'Es un <b>informe del estado real</b> del vehículo: motor, caja, chasis, latonería y desgaste. Ideal si vas a <b>comprar o vender</b>, o si tu aseguradora lo solicita.'},
      {cat:'otros', q:'¿Mi vehículo tiene conversión a gas, hay algo especial?', a:'Sí. Si tiene <b>GNV o GLP</b> debes presentar el <b>certificado de conversión vigente</b> además de los documentos habituales.'}
    ]
  },
  clients:[],
  vehicles:[],
  revisions:[],
  appts:[],
  cartera:[],
  // Créditos: solo generalidades (entidad, monto, fecha solicitud/desembolso, dia de pago).
  // Esta sección NO hace seguimiento de cuotas ni mora — eso lo gestiona cada entidad financiera.
  credits:[],
  reminders:[],
  // Bandeja de notificaciones (admin + cliente). type: venc|noshow|inactividad|movimiento|credito|sistema
  notifications:[],
  // Cuentas bancarias para registro de ingresos (Finanzas)
  bankAccounts:[
    {id:'b1', name:'Bancolombia · Cuenta corriente', balance:0},
    {id:'b2', name:'Nequi · CDA Revitolima', balance:0},
    {id:'b3', name:'Efectivo caja', balance:0}
  ],
  cashLedger:[], // {id, date, accountId, concept, amount, type:'ingreso'|'egreso'}
  // Volumen historico mensual (dato agregado de demostracion, no son registros individuales)
  monthly:[0,0,0,0,0,0],
  log:[]
};

/* ---------- CÓDIGOS DE REFERENCIA ----------
   CIT-AAMMDD-XXX  → cita normal agendada desde la web
   PRV-AAMMDD-XXX  → bono de revisión preventiva gratis (se redime en caja)
   Sirven para que las digitadoras ubiquen el registro sin pedir más datos. */
function genCode(prefix){
  const d=new Date();
  const ymd = String(d.getFullYear()).slice(2)+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
  const rnd = Math.random().toString(36).slice(2,5).toUpperCase();
  return `${prefix}-${ymd}-${rnd}`;
}

/* ---------- VALIDACIÓN VISUAL (rojo = error, verde = correcto) ---------- */
function setFieldState(el, ok, msg){
  const err = el.parentElement.querySelector('.ferr');
  el.classList.toggle('bad', !ok);
  el.classList.toggle('good', ok);
  if(err){ err.classList.toggle('on', !ok); if(msg) err.textContent = msg; }
  return ok;
}
function liveValidate(el, testFn, msg){
  const run = ()=>{ if(el.value.trim()==='' ){ el.classList.remove('bad','good');
      const e=el.parentElement.querySelector('.ferr'); if(e) e.classList.remove('on'); return; }
    setFieldState(el, testFn(el.value), msg); };
  el.addEventListener('input', run);
  el.addEventListener('blur', run);
}

const cliOf = id => DB.clients.find(c=>c.id===id) || {name:'—',doc:'—',phone:'—',email:''};
const vehOf = id => DB.vehicles.find(v=>v.id===id) || {plate:'—'};
const vehByPlate = p => DB.vehicles.find(v=>v.plate.toUpperCase()===String(p||'').toUpperCase());
const logAct = t => { DB.log.unshift({t,at:new Date().toLocaleString('es-CO')}); sbLog(t,(typeof currentUser!=='undefined'&&currentUser)?currentUser.name:''); };

/* ---------- NOTIFICACIONES ---------- */
function pushNotification({role='all', clientId=null, type='sistema', sev='ok', text}){
  DB.notifications.unshift({id:uid('n'), role, clientId, type, sev, text, at:new Date().toLocaleString('es-CO'), read:false});
  renderNotifBell();
}
function notifFor(role, clientId=null){
  return DB.notifications.filter(n=>{
    if(n.role==='all') return true;
    if(n.role==='client') return role==='client' && n.clientId===clientId;
    if(n.role==='staff') return ['super','comercial','caja'].includes(role);
    return n.role===role;
  });
}
function renderNotifBell(){
  $$('.notif-bell').forEach(bell=>{
    const role = bell.dataset.role;
    const cid = role==='client' ? (cliUser&&cliUser.id) : null;
    const list = notifFor(role, cid);
    const unread = list.filter(n=>!n.read).length;
    const dot = $('.notif-dot', bell);
    if(dot) dot.style.display = unread? '' : 'none';
    const badge = $('.notif-count', bell);
    if(badge){ badge.textContent = unread; badge.style.display = unread? '' : 'none'; }
  });
}
function openNotifPanel(role){
  const cid = role==='client' ? (cliUser&&cliUser.id) : null;
  const list = notifFor(role, cid);
  const ICO = {venc:'⏰', noshow:'🚫', inactividad:'⚠️', movimiento:'🔎', credito:'💳', sistema:'🔔'};
  modal('Notificaciones', list.length? `<div style="display:flex;flex-direction:column;gap:10px">${list.map(n=>`
    <div class="alertbar ${n.sev==='dan'?'dan':n.sev==='warn'?'warn':'ok'}" style="align-items:flex-start">
      <span style="font-size:1.1rem">${ICO[n.type]||'🔔'}</span>
      <div style="flex:1"><p style="margin:0">${n.text}</p><small style="color:var(--ink-3);font-size:.72rem">${n.at}</small></div>
    </div>`).join('')}</div>` : emptyBox('Sin notificaciones','Todo tranquilo por ahora.'),
    `<button class="btn btn-o" id="notifReadAll">Marcar todas como leídas</button><button class="btn btn-p" data-mclose>Cerrar</button>`);
  $('#notifReadAll')?.addEventListener('click',()=>{
    list.forEach(n=>n.read=true); renderNotifBell(); closeModal(); toast('Notificaciones marcadas como leídas');
  });
  $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
}
function bindNotifBells(){
  $$('.notif-bell').forEach(b=>{
    if(b.dataset.nbBound) return; b.dataset.nbBound='1';
    b.addEventListener('click',()=>openNotifPanel(b.dataset.role));
  });
  renderNotifBell();
}

/* ---------- UI HELPERS ---------- */
let toastT;
function toast(msg){
  $('#toastTxt').textContent = msg;
  $('#toast').classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(()=>$('#toast').classList.remove('on'),3200);
}
function modal(title, body, foot=''){
  $('#mTitle').textContent = title;
  $('#mBody').innerHTML = body;
  $('#mFoot').innerHTML = foot;
  $('#modal').classList.add('on');
}
function closeModal(){ $('#modal').classList.remove('on'); }
$$('[data-mclose]').forEach(b=>b.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });

/* ---------- WHATSAPP ---------- */
const waMsg = {
  general:'*Hola CDA Revitolima* 👋\n\nQuiero información sobre la _revisión técnico-mecánica_.\n\nVengo desde la página web 🌐',
  agenda:'*SOLICITUD DE CITA* 📅\n\n¡Hola! Quiero agendar mi _revisión técnico-mecánica_.\n\nPor favor confírmenme la disponibilidad ✅',
  confirmarCita:'*CONFIRMACIÓN DE CITA* ✅\n\n¡Hola! Escribo para _confirmar_ mi cita ya agendada en el CDA.',
  tarifa:'*CONSULTA DE TARIFA* 💰\n\nHola, quiero conocer el valor de mi revisión.',
  venc:'*MI REVISIÓN ESTÁ POR VENCER* ⏰\n\nHola, quiero agendar antes de que se me venza la revisión técnico-mecánica.',
  fin:'*CONSULTA DE FINANCIACIÓN* 💳\n\nHola, quiero saber sobre el estado de mi crédito con Sistecrédito o Addi.',
  preventiva:'*REVISIÓN PREVENTIVA DE VIAJE — GRATIS* 🎁\n\n¡Hola! Me inscribí en los recordatorios del CDA y quiero _confirmar mi revisión preventiva gratis_.\n\nPor favor ayúdenme a crear la cita 🙌',
  peritaje:'*CONSULTA DE PERITAJE TÉCNICO* 🔎\n\nHola, quiero información sobre el servicio de _peritaje_ para mi vehículo.',
  ubicacion:'*CÓMO LLEGAR AL CDA* 📍\n\nHola, ¿me ayudan con las indicaciones para llegar?',
  soat:'*CONSULTA SOBRE SOAT* 🛡️\n\nHola, tengo una duda sobre el SOAT y la revisión técnico-mecánica.'
};
// Cada acción define a qué número va y con qué mensaje
const WA_ROUTE = { preventiva: WA_PREVENTIVA };
function waLink(kind, extra=''){
  const num = WA_ROUTE[kind] || WA_GENERAL;
  const t = (waMsg[kind]||waMsg.general) + (extra?'\n\n'+extra:'');
  return `https://wa.me/${num}?text=${encodeURIComponent(t)}`;
}
function bindWA(){
  $$('[data-wa]').forEach(el=>{
    if(el.dataset.waBound) return;
    el.dataset.waBound='1';
    el.style.cursor='pointer';
    el.addEventListener('click',ev=>{
      ev.preventDefault();
      window.open(waLink(el.dataset.wa), '_blank', 'noopener');
    });
  });
}
$('#waHdr').href = waLink('general');

/* ---------- ROUTER ---------- */
function go(where){
  const pub=$('#pub'), cli=$('#appCli'), adm=$('#appAdm');
  pub.classList.toggle('off', where!=='pub');
  cli.classList.toggle('on', where==='cliente');
  adm.classList.toggle('on', where==='admin');
  $('#dd').classList.remove('open');
  $('#nav').classList.remove('open');
  $('#navOv').classList.remove('on');
  window.scrollTo(0,0);
  if(where==='admin' && admIn) renderAdmin();
  if(where==='cliente' && cliUser) renderCli();
}
const GO_PAGES={pub:'index.html',admin:'admin.html',cliente:'cliente.html'};
$$('[data-go]').forEach(a=>a.addEventListener('click',e=>{
  e.preventDefault(); const w=a.dataset.go;
  if(w===(window.CDA_ENTRY||'pub')) go(w); else location.href=GO_PAGES[w]||'index.html';
}));

/* ---------- ROUTER DE PÁGINAS (sitio público) ---------- */
const PAGES = {
  inicio:{t:'CDA Revitolima | Revisión técnico-mecánica en Ibagué, Tolima',
    d:'Centro de Diagnóstico Automotor en Ibagué. Revisión técnico-mecánica para carros y motos. Agenda al 321 356 6313.'},
  servicios:{t:'Servicios para carros y motos | CDA Revitolima Ibagué',
    d:'Revisión técnico-mecánica, revisión de gases y financiación Sistecrédito en Ibagué, Tolima.'},
  tarifas:{t:'Tarifas de revisión técnico-mecánica | CDA Revitolima',
    d:'Consulta el valor de la revisión técnico-mecánica para carro o moto en Ibagué.'},
  agendar:{t:'Agenda tu cita de revisión | CDA Revitolima Ibagué',
    d:'Reserva en línea tu turno para la revisión técnico-mecánica en Ibagué, Tolima.'},
  recordatorio:{t:'Recordatorio de vencimiento | CDA Revitolima',
    d:'Registra tu vehículo y recibe aviso antes de que venza tu revisión técnico-mecánica.'},
  preguntas:{t:'Preguntas frecuentes | CDA Revitolima Ibagué',
    d:'Documentos, tiempos y requisitos de la revisión técnico-mecánica en Ibagué.'},
  ubicacion:{t:'Ubicación y contacto | CDA Revitolima Ibagué, Tolima',
    d:'Cómo llegar, horarios de atención y teléfono del CDA en Ibagué: 321 356 6313.'},
  legal:{t:'Información legal | CDA Revitolima',
    d:'Política de privacidad, términos y condiciones, cookies y aviso legal de CDA Revitolima.'}
};
function goPage(id, push=true){
  if(!PAGES[id]) id='inicio';
  $$('.page').forEach(p=>p.classList.toggle('on', p.dataset.pg===id));
  $$('#nav a[data-page]').forEach(a=>a.classList.toggle('on', a.dataset.page===id));
  $$('.qa-item[data-page]').forEach(a=>a.classList.toggle('on', a.dataset.page===id));
  document.title = PAGES[id].t;
  const md=document.querySelector('meta[name="description"]'); if(md) md.content=PAGES[id].d;
  // Reinicia las animaciones de la página que entra.
  // io.observe() no vuelve a disparar sobre un elemento ya desobservado,
  // así que además se fuerza la aparición de lo que queda visible en pantalla
  // y, como red de seguridad, de todo lo demás al poco tiempo.
  $$('.page.on .rv, .page.on .ph-rv').forEach(e=>{ e.classList.remove('in'); io.observe(e); });
  requestAnimationFrame(()=>$$('.page.on .rv, .page.on .ph-rv').forEach(e=>{
    if(e.getBoundingClientRect().top < innerHeight) e.classList.add('in');
  }));
  clearTimeout(window.__revealGuard);
  window.__revealGuard = setTimeout(()=>{
    $$('.page.on .rv:not(.in), .page.on .ph-rv:not(.in)').forEach(e=>e.classList.add('in'));
  }, 900);
  // centrar la pestaña activa en la barra deslizable
  const tab=$(`.qa-item[data-page="${id}"]`);
  if(tab) tab.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  if(push && location.hash!=='#'+id) history.pushState({pg:id},'','#'+id);
  window.scrollTo({top:0,behavior:'instant'});
  $('#nav').classList.remove('open'); $('#navOv').classList.remove('on');
}
function bindPages(){
  $$('[data-page]').forEach(el=>{
    if(el.dataset.pgBound) return; el.dataset.pgBound='1';
    el.style.cursor='pointer';
    el.addEventListener('click',ev=>{ ev.preventDefault(); goPage(el.dataset.page); });
  });
}
addEventListener('popstate',()=>goPage((location.hash||'#inicio').slice(1), false));

/* ---------- HEADER / NAV ---------- */
addEventListener('scroll',()=>$('#hdr').classList.toggle('scr',scrollY>8));
$('#burger').addEventListener('click',()=>{
  const o=$('#nav').classList.toggle('open');
  $('#navOv').classList.toggle('on',o);
  $('#burger').setAttribute('aria-expanded',o);
});
$('#navOv').addEventListener('click',()=>{
  $('#nav').classList.remove('open'); $('#navOv').classList.remove('on');
});
$$('#nav a').forEach(a=>a.addEventListener('click',()=>{
  $('#nav').classList.remove('open'); $('#navOv').classList.remove('on');
}));
const dd=$('#dd');
$('#ddBtn').addEventListener('click',e=>{
  e.stopPropagation();
  const o=dd.classList.toggle('open');
  $('#ddBtn').setAttribute('aria-expanded',o);
});
document.addEventListener('click',e=>{ if(!dd.contains(e.target)) dd.classList.remove('open'); });

/* ---------- QUICK ACTIONS: drag + dots ---------- */
(function(){
  const tr=$('#qaTrack'), dots=$('#qaDots');
  let down=false,sx=0,sl=0,moved=false;
  tr.addEventListener('mousedown',e=>{down=true;moved=false;sx=e.pageX;sl=tr.scrollLeft;tr.classList.add('drag');});
  addEventListener('mouseup',()=>{down=false;tr.classList.remove('drag');});
  addEventListener('mousemove',e=>{
    if(!down) return; e.preventDefault();
    const d=e.pageX-sx; if(Math.abs(d)>4) moved=true;
    tr.scrollLeft=sl-d;
  });
  tr.addEventListener('click',e=>{ if(moved){e.preventDefault();e.stopPropagation();} },true);
  const n=$$('.qa-item',tr).length;
  for(let i=0;i<n;i++){const d=document.createElement('i');if(!i)d.className='on';dots.appendChild(d);}
  function upd(){
    const max=tr.scrollWidth-tr.clientWidth;
    $('#qaL').disabled = tr.scrollLeft<6;
    $('#qaR').disabled = tr.scrollLeft>max-6;
    const idx=max<=0?0:Math.round(tr.scrollLeft/max*(n-1));
    $$('i',dots).forEach((d,i)=>d.classList.toggle('on',i===idx));
  }
  tr.addEventListener('scroll',upd); addEventListener('resize',upd); upd();
  $('#qaL').addEventListener('click',()=>tr.scrollBy({left:-230,behavior:'smooth'}));
  $('#qaR').addEventListener('click',()=>tr.scrollBy({left:230,behavior:'smooth'}));
})();


/* ═══ MENÚ HAMBURGUESA DE PORTALES — delegación global ═══ */
document.addEventListener('click', e=>{
  const btn = e.target.closest('[data-sideopen]');
  if(!btn) return;
  const target = btn.dataset.sideopen;
  const side = target==='cli' ? document.getElementById('cliSide') : document.getElementById('admSide');
  if(!side) return;
  e.stopPropagation();
  const isOpen = side.classList.toggle('open');
  let ov = side.parentElement.querySelector('.side-ov');
  if(!ov){ ov=document.createElement('div'); ov.className='side-ov'; side.parentElement.appendChild(ov); }
  ov.classList.toggle('on', isOpen);
  ov.onclick = ()=>{ side.classList.remove('open'); ov.classList.remove('on'); };
});

/* ---------- REVEAL ---------- */
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}
}),{threshold:0, rootMargin:'0px 0px -60px 0px'});
$$('.rv').forEach(e=>io.observe(e));
$$('.ph-rv').forEach(e=>io.observe(e));
// Red de seguridad: nada debe quedarse invisible por la animación
setTimeout(()=>$$('.rv:not(.in), .ph-rv:not(.in)').forEach(e=>{
  if(e.getBoundingClientRect().top < innerHeight*1.5) e.classList.add('in');
}), 1200);

/* ---------- FAQ ---------- */
const FAQ_CATS = [
  {id:'todas', label:'Todas', ico:'📋'},
  {id:'antes', label:'Antes de venir', ico:'🚗'},
  {id:'proceso', label:'El proceso', ico:'🔧'},
  {id:'resultado', label:'Resultado y plazos', ico:'✅'},
  {id:'pagos', label:'Pagos y tarifas', ico:'💰'},
  {id:'otros', label:'Otros servicios', ico:'🎁'}
];
let faqCat='todas';
function renderFaq(){
  const nav = $('#faqNav');
  if(nav) nav.innerHTML = FAQ_CATS.map(c=>
    `<button class="faq-cat${c.id===faqCat?' on':''}" data-faqcat="${c.id}">${c.ico} ${c.label}</button>`).join('');
  const list = DB.config.faqs.filter(f=>faqCat==='todas'||f.cat===faqCat);
  $('#faqList').innerHTML = list.map((f,i)=>`
    <div class="faq-i">
      <button class="faq-q"><span class="faq-num">${String(i+1).padStart(2,'0')}</span>${f.q}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg></button>
      <div class="faq-a"><p>${f.a}</p></div>
    </div>`).join('');
  $$('.faq-i').forEach(it=>{
    $('.faq-q',it).addEventListener('click',()=>{
      const open=it.classList.contains('open');
      $$('.faq-i').forEach(x=>{x.classList.remove('open');$('.faq-a',x).style.maxHeight=null;});
      if(!open){it.classList.add('open');const a=$('.faq-a',it);a.style.maxHeight=a.scrollHeight+'px';}
    });
  });
  $$('[data-faqcat]').forEach(b=>b.addEventListener('click',()=>{faqCat=b.dataset.faqcat;renderFaq();}));
}


/* ---------- SELECTOR VEHÍCULO EN CASCADA (inicio + servicios) ---------- */
let pubGroup='particular', pubSub=null;

function renderGroupSel(container, activeGroup){
  $$('[data-vgroup],[data-bgroup],[data-simgroup]',container).forEach(b=>{
    const g = b.dataset.vgroup||b.dataset.bgroup||b.dataset.simgroup;
    b.classList.toggle('sel', g===activeGroup);
    b.setAttribute('aria-pressed', g===activeGroup?'true':'false');
  });
}
function subChipsHTML(group, activeSub, attr){
  return VTREE[group].sub.map(s=>
    `<button class="vsub-chip${s.id===activeSub?' sel':''}${s.soon?' soon':''}" ${attr}="${s.id}" ${s.soon?'disabled':''}>${s.label}${s.soon?'<span class="soon-tag">PRÓXIMAMENTE</span>':''}</button>`
  ).join('');
}
function servicesHTML(group){
  return SERVICES.filter(s=>s.groups.includes(group)).map(s=>{
    const det = (s.detalle&&s.detalle[group])||s.desc;
    const tm = s.tiempo&&s.tiempo[group];
    const isGift = s.id==='preventiva';
    return `
    <div class="card card-h svc-card">
      <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${SVC_ICON[s.id]||SVC_ICON.rtm}</svg></div>
      <h3 style="margin:15px 0 7px">${s.name}</h3>
      <p style="font-size:.89rem;color:var(--ink-2)">${det}</p>
      ${tm?`<div class="svc-time"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>${tm}</div>`:''}
      ${isGift?'<span class="svc-tag-free">GRATIS 🎁</span>':''}
    </div>`;
  }).join('');
}

/* Pasos del proceso, personalizados según el tipo de vehículo seleccionado */
const PROCESS_STEPS = {
  moto:[
    {t:'Llega con tu moto',d:'Trae la moto, tu documento de identidad y la tarjeta de propiedad. Nada más.'},
    {t:'Registro rápido',d:'Tomamos los datos de la moto y te asignamos el turno en la línea exclusiva para motos.'},
    {t:'Revisión ágil',d:'Verificamos frenos, dirección, suspensión, luces, llantas y emisiones. Entre 15 y 20 minutos.'},
    {t:'Resultado y reporte',d:'Te explicamos cada punto revisado y reportamos automáticamente al RUNT.'}
  ],
  particular:[
    {t:'Llega con tu vehículo',d:'Trae el carro, tu documento de identidad y la tarjeta de propiedad. Nada más.'},
    {t:'Registro en recepción',d:'Verificamos los datos del vehículo y te asignamos el turno correspondiente.'},
    {t:'Revisión completa',d:'Frenos, dirección, suspensión, luces, vidrios, cinturones, chasis y gases. Entre 25 y 35 minutos.'},
    {t:'Resultado y reporte',d:'Te explicamos con claridad el resultado y queda reportado al RUNT de inmediato.'}
  ],
  publico:[
    {t:'Llega con el vehículo',d:'Trae el vehículo, tu documento de identidad y la tarjeta de propiedad.'},
    {t:'Verificación documental',d:'Validamos los requisitos adicionales que exige el servicio público.'},
    {t:'Revisión reforzada',d:'Además de la revisión estándar, verificamos elementos de seguridad, cinturones y salidas de emergencia. Entre 30 y 45 minutos.'},
    {t:'Resultado y reporte',d:'Entregamos el resultado detallado y lo reportamos al RUNT.'}
  ]
};
function processHTML(group){
  const steps = PROCESS_STEPS[group]||PROCESS_STEPS.particular;
  return steps.map((s,i)=>`
    <div class="step">
      <div class="step-n">0${i+1}</div>
      <h3>${s.t}</h3>
      <p>${s.d}</p>
    </div>`).join('');
}
const SVC_ICON = {
  rtm:'<path d="M9 11l2 2 4-4"/><path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 4v5h-5"/>',
  reinsp:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  peritaje:'<path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/><path d="M21 21l-4.3-4.3"/><path d="M11 8v6M8 11h6"/>',
  financiacion:'<rect x="2" y="5" width="20" height="14" rx="2.4"/><path d="M2 10h20M6 15h4"/>'
};

function updateHomeGroup(group){
  pubGroup=group; pubSub=null;
  renderGroupSel($('#vGroupSel'), group);
  $('#vSubSel').innerHTML = subChipsHTML(group, null, 'data-vsub');
  $('#vSubWrap').style.display='';
  $('#svcGrid').innerHTML = servicesHTML(group);
  const pg = $('#procGrid');
  if(pg){
    pg.innerHTML = processHTML(group);
    const lbl = $('#procLabel');
    if(lbl) lbl.textContent = `Así es el proceso para ${VTREE[group].label.toLowerCase()}`;
  }
  bindSubChips();
  io.observe($('#svcGrid'));
}
function bindSubChips(){
  $$('#vSubSel [data-vsub]').forEach(b=>b.addEventListener('click',()=>{
    if(b.disabled) return;
    pubSub=b.dataset.vsub;
    $$('#vSubSel .vsub-chip').forEach(x=>x.classList.remove('sel'));
    b.classList.add('sel');
  }));
}
$$('#vGroupSel [data-vgroup]').forEach(b=>b.addEventListener('click',()=>updateHomeGroup(b.dataset.vgroup)));

/* ---------- SIMULADOR DE TARIFAS (termina en WhatsApp) ---------- */
const sim = {step:1, group:null, sub:null, srv:null};
function simShow(n){
  sim.step=n;
  $$('[data-simpane]').forEach(p=>p.style.display = +p.dataset.simpane===n?'':'none');
  $$('#simSteps .bk-step').forEach((s,i)=>s.classList.toggle('on', i<n));
  $('#simBack').style.display = n>1?'':'none';
  $('#simNext').textContent = n===3?'Consultar por WhatsApp':'Continuar';
}
function simSync(){
  const g=$('#simCfGroup'), sb=$('#simCfSub'), sv=$('#simCfSrv');
  if(g){ g.textContent = sim.group? VTREE[sim.group].label : '—'; g.parentElement.classList.toggle('done',!!sim.group); }
  if(sb){ sb.textContent = sim.sub? vLabel(sim.sub) : '—'; sb.parentElement.classList.toggle('done',!!sim.sub); }
  if(sv){ const x=SERVICES.find(s=>s.id===sim.srv); sv.textContent = x? x.name : '—'; sv.parentElement.classList.toggle('done',!!sim.srv); }
}
$$('[data-simgroup]').forEach(b=>b.addEventListener('click',()=>{
  sim.group=b.dataset.simgroup; sim.sub=null; sim.srv=null;
  renderGroupSel($('#simGroupSel'), sim.group);
  $('#simSubSel').innerHTML = subChipsHTML(sim.group, null, 'data-simsub');
  $('#simSubWrap').style.display='';
  $$('#simSubSel [data-simsub]').forEach(x=>x.addEventListener('click',()=>{
    if(x.disabled) return;
    sim.sub=x.dataset.simsub;
    $$('#simSubSel .vsub-chip').forEach(y=>y.classList.remove('sel'));
    x.classList.add('sel'); simSync();
  }));
  simSync();
}));
$('#simBack').addEventListener('click',()=>simShow(sim.step-1));
$('#simNext').addEventListener('click',()=>{
  if(sim.step===1){
    if(!sim.group) return toast('Selecciona una categoría');
    if(!sim.sub) return toast('Selecciona el tipo exacto de vehículo');
    $('#simSrvSel').innerHTML = SERVICES.filter(s=>s.groups.includes(sim.group)).map(s=>
      `<button class="vsub-chip" data-simsrv="${s.id}" style="text-align:left;padding:13px 16px">${s.name}</button>`).join('');
    $$('#simSrvSel [data-simsrv]').forEach(x=>x.addEventListener('click',()=>{
      sim.srv=x.dataset.simsrv;
      $$('#simSrvSel .vsub-chip').forEach(y=>y.classList.remove('sel'));
      x.classList.add('sel'); simSync();
    }));
    return simShow(2);
  }
  if(sim.step===2){
    if(!sim.srv) return toast('Selecciona el servicio que necesitas');
    simSync();
    return simShow(3);
  }
  // paso 3 -> whatsapp con mensaje formateado
  const srv = SERVICES.find(s=>s.id===sim.srv);
  const msg = `*CONSULTA DE TARIFA* 💰\n\n`+
    `Categoría: *${VTREE[sim.group].label}*\n`+
    `Vehículo: *${vLabel(sim.sub)}*\n`+
    `Servicio: *${srv.name}*\n\n`+
    `_Por favor confírmenme el valor exacto para mi caso._\n\n`+
    `¡Gracias! 🙏`;
  logAct(`Consulta de tarifa simulada · ${vLabel(sim.sub)} · ${srv.name}`);
  window.open(`https://wa.me/${WA_GENERAL}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
});

/* ---------- CATEGORÍAS EN AGENDAMIENTO (cascada) ---------- */
$$('[data-bgroup]').forEach(b=>b.addEventListener('click',()=>{
  bk.group=b.dataset.bgroup; bk.veh=null;
  renderGroupSel($('#bkGroupSel'), bk.group);
  $('#bkSubSel').innerHTML = subChipsHTML(bk.group, null, 'data-bsub');
  $('#bkSubWrap').style.display='';
  $$('#bkSubSel [data-bsub]').forEach(x=>x.addEventListener('click',()=>{
    if(x.disabled) return;
    bk.veh=x.dataset.bsub;
    $$('#bkSubSel .vsub-chip').forEach(y=>y.classList.remove('sel'));
    x.classList.add('sel');
  }));
}));

/* ---------- AGENDAMIENTO ---------- */
const bk={step:1,group:null,veh:null,date:null,time:null};
function bkShow(n){
  bk.step=n;
  $$('.bk-pane').forEach(p=>p.style.display = +p.dataset.pane===n?'':'none');
  $$('.bk-step').forEach((s,i)=>s.classList.toggle('on',i<n));
  $('#bkBack').style.display = n>1?'':'none';
  $('#bkNext').textContent = n===4?'Confirmar cita':'Continuar';
}
$$('[data-bveh]').forEach(b=>b.addEventListener('click',()=>{
  $$('[data-bveh]').forEach(x=>x.classList.remove('sel'));
  b.classList.add('sel'); bk.veh=b.dataset.bveh;
}));
$('#bkDate').min = iso(today);
const PUB_TAKEN={};
$('#bkDate').addEventListener('change',()=>{
  bk.date=$('#bkDate').value; bk.time=null; renderSlots();
  if(!window.CDA_STAFF && bk.date){ const d=bk.date; sbSlotsOcupados(d).then(a=>{ PUB_TAKEN[d]=a||[]; if(bk.date===d) renderSlots(); }).catch(()=>{}); }
});
function takenSlots(d){ return DB.appts.filter(a=>a.date===d && a.status!=='Cancelada').map(a=>a.time).concat(PUB_TAKEN[d]||[]); }
function renderSlots(){
  const box=$('#bkSlots');
  if(!bk.date){ box.innerHTML='<p style="font-size:.85rem;color:var(--ink-3);grid-column:1/-1">Selecciona primero una fecha.</p>'; return; }
  const taken=takenSlots(bk.date);
  box.innerHTML = DB.config.slots.map(s=>
    `<button class="slot${taken.includes(s)?'':''}" data-slot="${s}" ${taken.includes(s)?'disabled':''}>${s}</button>`).join('');
  $$('[data-slot]',box).forEach(b=>b.addEventListener('click',()=>{
    $$('[data-slot]',box).forEach(x=>x.classList.remove('sel'));
    b.classList.add('sel'); bk.time=b.dataset.slot;
  }));
}
function vErr(el,bad,msg){
  const e=el.parentElement.querySelector('.ferr');
  el.classList.toggle('bad',bad);
  if(e){ e.classList.toggle('on',bad); if(msg) e.textContent=msg; }
  return !bad;
}
$('#bkBack').addEventListener('click',()=>bkShow(bk.step-1));
$('#bkNext').addEventListener('click',async ()=>{
  if(bk.step===1){ if(!bk.group) return toast('Selecciona la categoría'); if(!bk.veh) return toast('Selecciona el tipo exacto de vehículo'); return bkShow(2); }
  if(bk.step===2){
    if(!bk.date) return toast('Selecciona una fecha');
    if(!bk.time) return toast('Selecciona un horario disponible');
    return bkShow(3);
  }
  if(bk.step===3){
    let ok=true;
    ok = vErr($('#bkName'), $('#bkName').value.trim().length<3) && ok;
    ok = vErr($('#bkDoc'), !/^\d{6,12}$/.test($('#bkDoc').value.trim())) && ok;
    ok = vErr($('#bkPlate'), !/^[A-Za-z]{3}\d{2,3}[A-Za-z]?$/.test($('#bkPlate').value.trim())) && ok;
    ok = vErr($('#bkPhone'), !/^\d{10}$/.test($('#bkPhone').value.replace(/\s/g,''))) && ok;
    const t=$('#bkTerms').checked; $('#bkTermsErr').classList.toggle('on',!t); ok = t && ok;
    if(!ok) return;
    $('#cfVeh').textContent = vLabel(bk.veh);
    $('#cfDate').textContent = fmtDate(bk.date);
    $('#cfTime').textContent = bk.time;
    $('#cfPlate').textContent = $('#bkPlate').value.trim().toUpperCase();
    $('#cfName').textContent = $('#bkName').value.trim();
    $('#cfPhone').textContent = $('#bkPhone').value.trim();
    return bkShow(4);
  }
  // confirmar
  const plate=$('#bkPlate').value.trim().toUpperCase();
  const doc=$('#bkDoc').value.trim();
  const clNew={id:uid('c'),doc,name:$('#bkName').value.trim(),phone:$('#bkPhone').value.trim(),email:$('#bkMail').value.trim(),notes:'Registrado desde agendamiento web.'};
  const vhNew={id:uid('v'),plate,type:bk.veh,cat:vLabel(bk.veh),clientId:clNew.id,due:null};
  const code = genCode('CIT');
  const cl = clNew;
  const ap={id:uid('a'),clientId:cl.id,plate,name:cl.name,phone:cl.phone,email:cl.email,
    type:bk.veh,date:bk.date,time:bk.time,status:'Pendiente',source:'Web',code,
    advisorId:null,confirmedArrival:false,notifiedBefore:false,notifiedAfter:false,contacted:false};
  if(!window.CDA_STAFF){
    const btn=$('#bkNext'); btn.disabled=true;
    try{ await sbReservar(clNew,vhNew,ap); }
    catch(err){
      btn.disabled=false;
      if(String(err&&err.message).includes('SLOT_OCUPADO')){
        toast('Ese horario acaba de ser tomado. Elige otro.'); bk.time=null;
        try{ PUB_TAKEN[bk.date]=await sbSlotsOcupados(bk.date); }catch(e){}
        renderSlots(); return bkShow(2);
      }
      toast('No pudimos registrar tu cita. Intenta de nuevo o escríbenos por WhatsApp.'); return;
    }
    btn.disabled=false;
    (PUB_TAKEN[ap.date]=PUB_TAKEN[ap.date]||[]).push(ap.time);
  }
  window.__lastAppt = ap;
  logAct(`Cita creada desde la web · ${plate} · ${fmtDate(bk.date)} ${bk.time}`);
  $('#bkDoneBox').innerHTML = `
    <div class="code-box"><span class="code-lbl">Tu código de cita</span><span class="code-val">${code}</span>
      <span class="code-hint">Preséntalo al llegar al centro</span></div>
    <div><span>Vehículo</span><span>${vLabel(bk.veh)}</span></div>
    <div><span>Placa</span><span>${plate}</span></div>
    <div><span>Fecha</span><span>${fmtDate(bk.date)}</span></div>
    <div><span>Hora</span><span>${bk.time}</span></div>
    <div><span>Estado</span><span>Pendiente de confirmación</span></div>`;
  const btnConf = $('#bkConfirmWA');
  if(btnConf){
    btnConf.href = `https://wa.me/${WA_GENERAL}?text=`+encodeURIComponent(
      `*CONFIRMACIÓN DE CITA* ✅\n\n`+
      `Código: *${code}*\n`+
      `Nombre: *${cl.name}*\n`+
      `Vehículo: *${vLabel(bk.veh)}*\n`+
      `Placa: *${plate}*\n`+
      `Fecha: *${fmtDate(bk.date)}*\n`+
      `Hora: *${bk.time}*\n\n`+
      `_Confirmo que asistiré a mi cita._ 🙌`);
  }
  $('#bkFlow').style.display='none';
  $('#bkDone').style.display='';
  bindWA();
  toast('Cita registrada y enviada a administración');
  refreshBadges();
});
$('#bkReset').addEventListener('click',()=>{
  bk.group=null;bk.veh=null;bk.date=null;bk.time=null;
  $$('#bkGroupSel .vcard').forEach(x=>x.classList.remove('sel'));
  $('#bkSubWrap').style.display='none'; $('#bkSubSel').innerHTML='';
  ['#bkName','#bkDoc','#bkPlate','#bkPhone','#bkMail','#bkDate'].forEach(s=>$(s).value='');
  $('#bkTerms').checked=false; renderSlots();
  $('#bkFlow').style.display=''; $('#bkDone').style.display='none';
  bkShow(1);
});

/* ---------- RECORDATORIO ---------- */
$('#remForm').addEventListener('submit',async e=>{
  e.preventDefault();
  let ok=true;
  ok = vErr($('#rmName'), $('#rmName').value.trim().length<3) && ok;
  ok = vErr($('#rmPlate'), !/^[A-Za-z]{3}\d{2,3}[A-Za-z]?$/.test($('#rmPlate').value.trim())) && ok;
  ok = vErr($('#rmDue'), !$('#rmDue').value) && ok;
  ok = vErr($('#rmPhone'), !/^\d{10}$/.test($('#rmPhone').value.replace(/\s/g,''))) && ok;
  const t=$('#rmTerms').checked; $('#rmTermsErr').classList.toggle('on',!t); ok = t && ok;
  if(!ok) return;
  const prvCode = genCode('PRV');
  const rName = $('#rmName').value.trim(), rPlate = $('#rmPlate').value.trim().toUpperCase();
  const remRow={id:uid('m'),name:rName,plate:rPlate,type:$('#rmVeh').value,due:$('#rmDue').value,phone:$('#rmPhone').value.trim(),
    email:$('#rmMail').value.trim(),channel:$('#rmChan').value,converted:false,origin:'inscripcion',
    giftCode:prvCode, giftClaimed:false};
  if(!window.CDA_STAFF){
    try{ await sbRecordatorio(remRow); }
    catch(err){ toast('No pudimos registrar tu inscripción. Intenta de nuevo o escríbenos por WhatsApp.'); return; }
  }
  DB.reminders.push(remRow);
  const box = $('#remCodeBox');
  if(box) box.innerHTML = `<span class="code-lbl">🎁 Tu bono de revisión preventiva</span>
    <span class="code-val">${prvCode}</span><span class="code-hint">Preséntalo al llegar · válido por 6 meses</span>`;
  const wb = $('#remWaBtn');
  if(wb) wb.href = `https://wa.me/${WA_PREVENTIVA}?text=`+encodeURIComponent(
    `*REVISIÓN PREVENTIVA DE VIAJE — GRATIS* 🎁\n\n`+
    `¡Hola! Me acabo de inscribir en los recordatorios del CDA y quiero _confirmar mi revisión preventiva gratis_.\n\n`+
    `Código del bono: *${prvCode}*\n`+
    `Nombre: *${rName}*\n`+
    `Placa: *${rPlate}*\n\n`+
    `_Por favor ayúdenme a crear la cita._ 🙌`);
  pushNotification({role:'all', type:'sistema', sev:'ok',
    text:`Nueva inscripción con regalo · ${$('#rmName').value.trim()} (${$('#rmPlate').value.trim().toUpperCase()}) tiene pendiente su revisión preventiva de viaje gratis.`});
  logAct(`Recordatorio registrado (regalo activado) · ${$('#rmPlate').value.trim().toUpperCase()}`);
  $('#remForm').style.display='none'; $('#remDone').style.display='';
  toast('Recordatorio registrado y regalo activado');
  refreshBadges();
});

/* ---------- RECORDATORIOS ANUALES AUTOMÁTICOS ----------
   Cada vehículo con una revisión aprobada/reaprobada genera, un año después,
   un recordatorio automático si aún no existe uno vigente para esa placa.
   En producción esto correría en el servidor (cron diario); aquí se genera
   al cargar la app para que el prototipo muestre el comportamiento esperado. */
function genAnnualReminders(){
  DB.vehicles.filter(v=>v.due).forEach(v=>{
    const d = daysTo(v.due);
    if(d<=30 && d>=-30){
      const c = cliOf(v.clientId);
      const exists = DB.reminders.some(m=>m.plate===v.plate && m.origin==='anual' && m.due===v.due);
      if(!exists && c.name!=='—'){
        DB.reminders.push({id:uid('m'),name:c.name,plate:v.plate,type:v.type,due:v.due,
          phone:c.phone,email:c.email,channel:'WhatsApp',converted:false,origin:'anual',giftClaimed:false});
        logAct(`Recordatorio anual generado automáticamente · ${v.plate}`);
      }
    }
  });
}
$('#remReset').addEventListener('click',()=>{
  $('#remForm').reset(); $('#remForm').style.display=''; $('#remDone').style.display='none';
});

function syncPublic(){
  updateHomeGroup(pubGroup); renderFaq(); bindPages();
  goPage((location.hash||'#inicio').slice(1), false);
  $('#remIntervals').textContent = DB.config.intervalos.join(', ')+' días antes';
  $('#addrPub').textContent = DB.config.direccion;
  const bm=$('#btnMaps'); if(bm) bm.href = DB.config.mapsUrl;
  bindWA(); initAssistant(); renderStrip(); renderHorarios(); initValidations(); initLegal();
}

/* ---------- VALIDACIÓN EN VIVO + RECONOCIMIENTO POR PLACA ---------- */
function attachPlateRecognition(inputSel, hintSel, onDetect){
  const el = $(inputSel), hint = $(hintSel);
  if(!el) return;
  el.addEventListener('input',()=>{
    el.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
    const det = detectVehicleByPlate(el.value);
    if(el.value===''){ el.classList.remove('bad','good'); if(hint) hint.classList.remove('on');
      const e=el.parentElement.querySelector('.ferr'); if(e) e.classList.remove('on'); return; }
    setFieldState(el, !!det);
    if(det && hint){
      hint.classList.add('on');
      hint.innerHTML = `<span>🔎</span><span>Detectamos: <b>${VTREE[det.group].label}</b>. Ya seleccionamos esa categoría por ti.</span>`;
      if(onDetect) onDetect(det);
    } else if(hint){ hint.classList.remove('on'); }
  });
}
function initValidations(){
  // Agendamiento
  const nm=$('#bkName'), doc=$('#bkDoc'), ph=$('#bkPhone'), ml=$('#bkMail');
  if(nm) liveValidate(nm, v=>v.trim().length>=3, 'Ingresa nombre y apellido.');
  if(doc) liveValidate(doc, v=>/^\d{6,12}$/.test(v.trim()), 'El documento debe tener entre 6 y 12 dígitos.');
  if(ph) liveValidate(ph, v=>/^\d{10}$/.test(v.replace(/\s/g,'')), 'El celular debe tener 10 dígitos.');
  if(ml) liveValidate(ml, v=>/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v.trim()), 'Correo inválido.');
  attachPlateRecognition('#bkPlate','#bkPlateHint',det=>{
    // Si el usuario ya eligió una categoría del mismo grupo, respetamos su elección exacta
    // (ej: eligió "Carro híbrido" y la placa dice "particular" → no la cambiamos por "Automóvil").
    if(bk.group===det.group && bk.veh) return;
    bk.group=det.group; bk.veh=det.sub;
    renderGroupSel($('#bkGroupSel'), det.group);
    $('#bkSubSel').innerHTML = subChipsHTML(det.group, det.sub, 'data-bsub');
    $('#bkSubWrap').style.display='';
    $$('#bkSubSel [data-bsub]').forEach(x=>x.addEventListener('click',()=>{
      if(x.disabled) return;
      bk.veh=x.dataset.bsub;
      $$('#bkSubSel .vsub-chip').forEach(y=>y.classList.remove('sel'));
      x.classList.add('sel');
    }));
  });
  // Recordatorio
  const rn=$('#rmName'), rp=$('#rmPhone'), rm=$('#rmMail'), rd=$('#rmDue');
  if(rn) liveValidate(rn, v=>v.trim().length>=3, 'Ingresa nombre y apellido.');
  if(rp) liveValidate(rp, v=>/^\d{10}$/.test(v.replace(/\s/g,'')), 'El celular debe tener 10 dígitos.');
  if(rm) liveValidate(rm, v=>/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v.trim()), 'Correo inválido.');
  if(rd) liveValidate(rd, v=>!!v, 'Selecciona la fecha.');
  attachPlateRecognition('#rmPlate','#rmPlateHint',det=>{
    const sel=$('#rmVeh'); if(sel) sel.value = det.group==='moto' ? 'moto':'carro';
  });
}

/* ---------- TEXTOS LEGALES ---------- */
const LEGAL = {
  privacidad:{titulo:'Política de privacidad y tratamiento de datos personales', html:`
    <p>En cumplimiento de la <b>Ley 1581 de 2012</b> y el <b>Decreto 1074 de 2015</b>, CDA Revitolima, identificado con NIT 901.841.056-1, informa su política de tratamiento de datos personales.</p>
    <h3>1. Responsable del tratamiento</h3>
    <p>CDA Revitolima · NIT 901.841.056-1<br>Calle 111 #20-25 Sur, Barrio San Francisco, Aparco · Ibagué, Tolima<br>Teléfono: 321 356 6313</p>
    <h3>2. Datos que recolectamos</h3>
    <p>Nombre completo, número de documento, teléfono celular, correo electrónico, placa y tipo de vehículo, y el historial de revisiones realizadas en nuestro centro.</p>
    <h3>3. Finalidad del tratamiento</h3>
    <ul>
      <li>Gestionar y confirmar las citas de revisión técnico-mecánica.</li>
      <li>Enviar recordatorios sobre el vencimiento de la revisión del vehículo.</li>
      <li>Reportar los resultados de la revisión ante el RUNT, según la normativa vigente.</li>
      <li>Gestionar solicitudes de financiación ante las entidades aliadas.</li>
      <li>Enviar información comercial sobre servicios y promociones, cuando el titular lo autorice.</li>
    </ul>
    <h3>4. Derechos del titular</h3>
    <p>Como titular de sus datos, usted puede conocer, actualizar, rectificar y suprimir su información, revocar la autorización otorgada, y solicitar prueba de la autorización. Para ejercer estos derechos, escriba a nuestros canales de contacto.</p>
    <h3>5. Vigencia</h3>
    <p>Los datos se conservarán mientras exista una relación comercial y durante el tiempo que exija la normativa aplicable al servicio de revisión técnico-mecánica.</p>`},

  terminos:{titulo:'Términos y condiciones de uso', html:`
    <h3>1. Objeto</h3>
    <p>Estos términos regulan el uso del sitio web de CDA Revitolima y de sus herramientas de agendamiento, consulta y portal de cliente.</p>
    <h3>2. Agendamiento de citas</h3>
    <p>El agendamiento en línea reserva un turno sujeto a confirmación por parte del centro. La disponibilidad mostrada es orientativa y puede variar según la operación del día.</p>
    <h3>3. Tarifas</h3>
    <p>Los valores de los servicios dependen del tipo de vehículo, cilindraje y servicio solicitado. Las tarifas se confirman directamente por nuestros canales de atención. <b>La reinspección tiene un costo independiente</b> de la revisión inicial.</p>
    <h3>4. Revisión preventiva de viaje gratuita</h3>
    <p>La revisión preventiva de viaje es un beneficio sin costo para quienes se registren en el sistema de recordatorios. Consiste en una verificación visual de puntos de seguridad y <b>no equivale ni reemplaza la revisión técnico-mecánica obligatoria</b>. El bono debe presentarse al momento de la visita y está sujeto a disponibilidad de agenda.</p>
    <h3>5. Resultados de la revisión</h3>
    <p>El resultado de la revisión técnico-mecánica responde exclusivamente al estado del vehículo al momento de la inspección, conforme a la normativa del Ministerio de Transporte. El centro no garantiza la aprobación de ningún vehículo.</p>
    <h3>6. Portal de cliente</h3>
    <p>El acceso al portal es personal. El titular es responsable del uso de sus credenciales y de la veracidad de la información que registre.</p>`},

  cookies:{titulo:'Política de cookies y tecnologías de seguimiento', html:`
    <h3>1. Qué son las cookies</h3>
    <p>Son pequeños archivos que se almacenan en su dispositivo al navegar, y permiten recordar preferencias y analizar el uso del sitio.</p>
    <h3>2. Cookies que utilizamos</h3>
    <ul>
      <li><b>Técnicas o necesarias:</b> permiten el funcionamiento básico del sitio y del portal de cliente. No requieren consentimiento.</li>
      <li><b>Analíticas:</b> nos permiten entender cómo se usa el sitio para mejorarlo.</li>
      <li><b>Publicitarias:</b> usadas por plataformas de terceros para mostrar anuncios relevantes.</li>
    </ul>
    <h3>3. Tecnologías de terceros</h3>
    <p>Este sitio puede incorporar píxeles y etiquetas de seguimiento de <b>Meta (Facebook e Instagram)</b>, <b>Google Ads / Google Analytics</b> y <b>TikTok Ads</b>, con el fin de medir la efectividad de nuestras campañas y mostrar publicidad segmentada.</p>
    <p>Estas plataformas pueden recopilar información sobre su navegación conforme a sus propias políticas de privacidad. Puede consultar y gestionar sus preferencias directamente en cada plataforma.</p>
    <h3>4. Cómo desactivarlas</h3>
    <p>Puede bloquear o eliminar las cookies desde la configuración de su navegador. Tenga en cuenta que desactivar las cookies técnicas puede afectar el funcionamiento del portal de cliente.</p>`},

  aviso:{titulo:'Aviso legal', html:`
    <h3>1. Identificación</h3>
    <p><b>CDA Revitolima</b><br>NIT: 901.841.056-1<br>Domicilio: Calle 111 #20-25 Sur, Barrio San Francisco, Aparco · Ibagué, Tolima, Colombia<br>Contacto: 321 356 6313</p>
    <h3>2. Actividad</h3>
    <p>Centro de Diagnóstico Automotor dedicado a la revisión técnico-mecánica y de emisiones contaminantes de vehículos automotores, conforme a la normativa expedida por el Ministerio de Transporte de Colombia.</p>
    <h3>3. Propiedad intelectual</h3>
    <p>El contenido de este sitio —textos, imágenes, marca, logotipo y desarrollos— es propiedad de CDA Revitolima o cuenta con licencia de uso. Queda prohibida su reproducción total o parcial sin autorización escrita.</p>
    <h3>4. Limitación de responsabilidad</h3>
    <p>La información publicada tiene carácter orientativo. CDA Revitolima procura mantenerla actualizada, pero no se responsabiliza por decisiones tomadas exclusivamente con base en el contenido del sitio sin verificación previa con nuestros canales de atención.</p>
    <h3>5. Legislación aplicable</h3>
    <p>Estas condiciones se rigen por la legislación colombiana. Cualquier controversia se someterá a los jueces y tribunales competentes de Ibagué, Tolima.</p>`}
};
function renderLegal(key){
  const l = LEGAL[key]; if(!l) return;
  $$('.legal-tab').forEach(t=>t.classList.toggle('on', t.dataset.legal===key));
  $('#legalBody').innerHTML = `<h2 class="dsp">${l.titulo}</h2>${l.html}
    <p class="legal-upd">Última actualización: agosto de 2026</p>`;
}
function initLegal(){
  const body=$('#legalBody'); if(!body) return;
  renderLegal('privacidad');
  $$('.legal-tab').forEach(t=>t.addEventListener('click',()=>renderLegal(t.dataset.legal)));
}

/* ---------- MARQUESINA DE SERVICIOS (loop infinito) ---------- */
function renderStrip(){
  const items = [
    'Revisión técnico-mecánica','Revisión de gases','Carros y motos','Servicio público',
    'Peritaje técnico','Revisión preventiva de viaje','Financiación Sistecrédito y Addi',
    'Horarios extendidos en Ibagué'
  ];
  const chk = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg>';
  const html = items.map(t=>`<span class="strip-item">${chk}${t}</span>`).join('');
  const el = $('#stripTrack'); if(el) el.innerHTML = html + html; // duplicado = loop continuo
}

/* ---------- HORARIOS ---------- */
function renderHorarios(){
  const el = $('#hrsPub'); if(!el) return;
  el.innerHTML = `<div class="hrs-grid">` + DB.config.horarios.map(h=>`
    <div class="hrs-card${h.destacado?' hrs-star':''}">
      ${h.destacado?'<span class="hrs-badge">JORNADA CONTINUA</span>':''}
      <span class="hrs-day">${h.d}</span>
      <span class="hrs-time">${h.h}</span>
    </div>`).join('') + `</div>
    <div class="hrs-note">⭐ <b>Somos el único CDA de Ibagué</b> con jornada continua de lunes a viernes.</div>`;
}

/* ---------- ASISTENTE DE PREGUNTAS (basado en el contenido del sitio) ----------
   Responde por coincidencia de palabras clave con: servicios, categorías de vehículo,
   horarios, ubicación, contacto y las preguntas frecuentes ya publicadas.
   No es un modelo de lenguaje: es una base de conocimiento local del propio sitio.
   Conectar un LLM real con datos en vivo del negocio requiere backend (Supabase + API). */
const AI_KB = () => ([
  {kw:['horario','domingo','sabado','festivo','atienden','abren','cierran','hora'],
   a:`🕕 *Nuestros horarios:*<br><br>• <b>Lunes a viernes:</b> 6:00 a.m. – 7:00 p.m. <i>(jornada continua)</i><br>• <b>Sábados:</b> 7:00 a.m. – 6:00 p.m.<br>• <b>Domingos y festivos:</b> 8:00 a.m. – 2:00 p.m.<br><br>⭐ Somos el <b>único CDA de Ibagué</b> con jornada continua de lunes a viernes.`,
   btn:{t:'Agendar mi cita', page:'agendar'}},
  {kw:['direccion','ubicacion','donde quedan','como llegar','queda','ubicados'],
   a:`📍 <b>Estamos en:</b><br>Calle 111 #20-25 Sur<br>Barrio San Francisco, Aparco<br>Ibagué, Tolima`,
   btn:{t:'Ver en Google Maps', url:'MAPS'}},
  {kw:['telefono','whatsapp','numero','contacto','celular','llamar'],
   a:`📞 <b>Tenemos dos líneas:</b><br><br>• <b>321 356 6313</b> — información general y asesoría<br>• <b>311 570 8511</b> — revisión preventiva gratis 🎁`,
   btn:{t:'Escribir por WhatsApp', wa:'general'}},
  {kw:['precio','tarifa','valor','cuanto cuesta','cuesta','vale'],
   a:`💰 El valor depende del <b>cilindraje, modelo y servicio</b>, por eso no publicamos un precio fijo.<br><br>En <b>3 toques</b> te armo el mensaje con tu consulta lista para enviar. 👇`,
   btn:{t:'Consultar mi tarifa', page:'tarifas'}},
  {kw:['agendar','cita','turno','reservar','separar'],
   a:`📅 ¡Claro! Puedes agendar en línea eligiendo <b>tipo de vehículo, fecha y hora</b>. Recibes un <b>código de cita</b> para presentar al llegar.`,
   btn:{t:'Agendar ahora', page:'agendar'}},
  {kw:['moto','motocicleta','motocarro','moto electrica'],
   a:`🏍️ Sí, atendemos <b>motos</b>. El proceso para moto es el más ágil: entre <b>15 y 20 minutos</b>.<br><br><i>Motocarro y motoeléctrica estarán disponibles próximamente.</i>`,
   btn:{t:'Ver servicios para moto', page:'servicios'}},
  {kw:['taxi','ambulancia','publico','microbus','escolar','placa blanca'],
   a:`🚕 Atendemos <b>servicio público</b>: taxi, ambulancia, placa blanca, microbús y escolar.<br><br>Incluimos los requisitos adicionales que exige este tipo de servicio.`,
   btn:{t:'Ver detalle', page:'servicios'}},
  {kw:['electrico','hibrido'],
   a:`⚡ Sí atendemos <b>carros eléctricos e híbridos</b>. Son dos categorías distintas y cada una tiene su propio procedimiento de revisión.`,
   btn:{t:'Ver servicios', page:'servicios'}},
  {kw:['peritaje','avaluo','comprar carro','vender carro'],
   a:`🔎 El <b>peritaje técnico</b> es un informe del estado real del vehículo: motor, caja, chasis, latonería y desgaste.<br><br>Ideal si vas a <b>comprar o vender</b>, o para tu aseguradora.`,
   btn:{t:'Consultar peritaje', wa:'peritaje'}},
  {kw:['financiacion','credito','sistecredito','addi','financiar','cuotas','pagar a cuotas'],
   a:`💳 Puedes financiar tu revisión con <b>Sistecrédito</b> o <b>Addi</b>, con aprobación en minutos aquí mismo.<br><br>El estado de tu crédito queda visible en tu <b>Portal cliente</b>.`,
   btn:{t:'Consultar financiación', wa:'fin'}},
  {kw:['documentos','que debo llevar','llevar','papeles','requisitos','necesito'],
   a:`📋 <b>Solo necesitas traer:</b><br><br>✅ El vehículo o la moto<br>✅ Tu documento de identidad<br>✅ La tarjeta de propiedad<br><br><i>Nada más. Así de simple.</i>`,
   btn:{t:'Agendar mi cita', page:'agendar'}},
  {kw:['recordatorio','vencimiento','vence','se me vence','avisar'],
   a:`⏰ Regístrate y te avisamos <b>antes de que venza</b> tu revisión.<br><br>🎁 Además te ganas una <b>revisión preventiva de viaje GRATIS</b> solo por inscribirte.`,
   btn:{t:'Activar mi recordatorio', page:'recordatorio'}},
  {kw:['gratis','regalo','preventiva','viaje','bono'],
   a:`🎁 <b>¡Sí, es totalmente gratis!</b><br><br>Al registrarte en nuestro recordatorio te regalamos una <b>revisión preventiva de viaje</b>: revisamos llantas, frenos, luces y niveles antes de que salgas a carretera.<br><br>Recibes un <b>código</b> que presentas al llegar. ✨`,
   btn:{t:'Reclamar mi regalo', page:'recordatorio'}},
  {kw:['reprogramar','cancelar','cambiar cita','mover cita'],
   a:`🔄 Puedes reprogramar o cancelar sin problema desde tu <b>Portal cliente</b>, o escribiéndonos directo.`,
   btn:{t:'Escribir por WhatsApp', wa:'general'}},
  {kw:['cuanto demora','cuanto tarda','tiempo','demora','rapido','dura'],
   a:`⏱️ <b>Tiempos aproximados:</b><br><br>• <b>Moto:</b> 15 a 20 min<br>• <b>Carro particular:</b> 25 a 35 min<br>• <b>Servicio público:</b> 30 a 45 min<br><br>Si agendas cita, tu espera es mucho menor. 😉`,
   btn:{t:'Agendar y ahorrar tiempo', page:'agendar'}},
  {kw:['no paso','no pasa','rechaz','perdi','reprob','reinspeccion'],
   a:`🔧 Si tu vehículo no aprueba, te entregamos un <b>informe detallado</b> de lo que debes corregir.<br><br>Luego vuelves solo para la <b>reinspección</b>, que revisa únicamente los puntos pendientes. <i>La reinspección se cobra aparte.</i>`,
   btn:{t:'Preguntar por mi caso', wa:'general'}},
  {kw:['runt','certificado','reporte','sistema'],
   a:`📡 Tu resultado queda <b>reportado al RUNT automáticamente</b> al terminar la revisión. No tienes que hacer ningún trámite adicional.`},
  {kw:['cita previa','sin cita','llegar directo','hacer fila','fila'],
   a:`🙌 Puedes llegar sin cita, pero <b>agendando te atendemos más rápido</b> y evitas la espera.<br><br>Con horario continuo de 6 a.m. a 7 p.m. entre semana, siempre hay un espacio para ti.`,
   btn:{t:'Reservar mi turno', page:'agendar'}},
  {kw:['gases','emisiones','humo'],
   a:`💨 La <b>revisión de gases</b> va incluida en el mismo proceso de la técnico-mecánica, sin costo adicional ni cita aparte.`,
   btn:{t:'Ver servicios', page:'servicios'}},
  {kw:['hola','buenas','buenos dias','buenas tardes','saludos','que tal'],
   a:`👋 ¡Hola! Bienvenido a <b>CDA Revitolima</b>.<br><br>Puedo ayudarte con horarios, tarifas, servicios, agendamiento o el <b>regalo de revisión preventiva gratis</b> 🎁<br><br>¿Qué necesitas?`},
  {kw:['gracias','muchas gracias','vale','listo','ok'],
   a:`🙌 ¡Con mucho gusto! Aquí estamos para lo que necesites.<br><br>Te esperamos en <b>Calle 111 #20-25 Sur</b>, Barrio San Francisco. 🚗`},
  {kw:['portal','mi cuenta','ingresar','sesion','login'],
   a:`🔐 En el <b>Portal cliente</b> puedes ver tus citas, el historial de tus vehículos, próximos vencimientos y el estado de tu crédito.<br><br>Ingresas con tu <b>documento</b> y la <b>placa</b>.`},
  {kw:['soat','seguro obligatorio'],
   a:`🛡️ El <b>SOAT</b> es el Seguro Obligatorio de Accidentes de Tránsito. Cubre gastos médicos de las víctimas en un accidente.<br><br>⚠️ <b>Importante:</b> el SOAT y la revisión técnico-mecánica son <b>dos cosas distintas</b>. Ambas son obligatorias, pero se tramitan por separado.<br><br>Para hacer tu revisión <b>debes tener el SOAT vigente</b>.`,
   btn:{t:'Preguntar por mi caso', wa:'soat'}},
  {kw:['soat vencido','sin soat','no tengo soat'],
   a:`⚠️ Si tu <b>SOAT está vencido</b> no podemos realizar la revisión técnico-mecánica: la norma exige tenerlo vigente.<br><br>Primero renueva tu SOAT y luego agendas con nosotros. 🙌`,
   btn:{t:'Escribir por WhatsApp', wa:'general'}},
  {kw:['cuando debo hacer','cada cuanto','primera vez','vehiculo nuevo','carro nuevo','moto nueva'],
   a:`📆 <b>¿Cuándo te toca la revisión?</b><br><br>• <b>Vehículos particulares nuevos:</b> a los <b>6 años</b> desde la matrícula.<br>• <b>Motos nuevas:</b> a los <b>2 años</b>.<br>• <b>Servicio público nuevo:</b> a los <b>2 años</b>.<br><br>Después de la primera, la renovación es <b>anual</b>. ✅`,
   btn:{t:'Agendar mi revisión', page:'agendar'}},
  {kw:['multa','comparendo','sancion','me multan','cuanto es la multa'],
   a:`🚨 Circular <b>sin revisión técnico-mecánica vigente</b> genera comparendo y el vehículo puede ser <b>inmovilizado</b>.<br><br>La sanción corresponde a <b>30 SMLDV</b> (salarios mínimos legales diarios vigentes), según el Código Nacional de Tránsito.<br><br>💡 Renovarla siempre sale más barato que la multa.`,
   btn:{t:'Agendar antes de que venza', page:'agendar'}},
  {kw:['regeneracion','regeneración','vuelvo a pagar','pagar otra vez','segunda vez','volver a pagar','cuanto tiempo tengo'],
   a:`🔁 <b>Sobre volver a pagar:</b><br><br>Si tu vehículo <b>no aprueba</b>, tienes un plazo de <b>15 días calendario</b> para corregir lo observado y volver.<br><br>✅ Dentro de ese plazo: solo pagas la <b>reinspección</b> (más económica), y revisamos únicamente lo que quedó pendiente.<br><br>❌ Si te pasas de los 15 días: el proceso se reinicia y debes pagar la <b>revisión completa</b> otra vez.`,
   btn:{t:'Consultar mi caso', wa:'general'}},
  {kw:['que revisan','que miran','en que consiste','como es la revision','puntos'],
   a:`🔧 <b>La revisión cubre 4 grandes frentes:</b><br><br>1️⃣ <b>Frenos</b> — eficacia y desbalance<br>2️⃣ <b>Suspensión y dirección</b> — estabilidad y alineación<br>3️⃣ <b>Luces</b> — intensidad y orientación<br>4️⃣ <b>Emisiones (gases)</b> — según tipo de motor<br><br>Además revisamos llantas, vidrios, espejos, cinturones y estado del chasis.`,
   btn:{t:'Ver el proceso completo', page:'servicios'}},
  {kw:['runt','queda registrado','como se reporta','certificado fisico'],
   a:`📡 Tu resultado queda <b>reportado al RUNT automáticamente</b> el mismo día.<br><br>Ya no se entrega calcomanía física: la autoridad de tránsito consulta tu estado directamente en el sistema. ✅`},
  {kw:['tramite','a nombre de otro','no soy el dueño','autorizacion','tercero'],
   a:`👥 <b>Sí puedes traer un vehículo que no esté a tu nombre.</b><br><br>Solo necesitas:<br>✅ Tu documento de identidad<br>✅ La tarjeta de propiedad del vehículo<br><br>No exigimos poder ni autorización notarial. 🙌`},
  {kw:['gas','glp','conversion','gnv','gas natural'],
   a:`⛽ Si tu vehículo tiene <b>conversión a gas (GNV o GLP)</b>, debes presentar el certificado de conversión vigente además de los documentos habituales.<br><br>La revisión de emisiones se realiza con el combustible que use el vehículo.`,
   btn:{t:'Consultar mi caso', wa:'general'}},
  {kw:['blindado','modificado','repotenciado','cambio de motor'],
   a:`🔩 Los vehículos <b>blindados o con modificaciones estructurales</b> (cambio de motor, repotenciación) requieren tener el registro actualizado en la tarjeta de propiedad antes de la revisión.<br><br>Escríbenos con los detalles de tu caso y te orientamos. 👇`,
   btn:{t:'Consultar mi caso', wa:'general'}},
  {kw:['traspaso','vender','comprar','compraventa','avaluo'],
   a:`🤝 Si vas a <b>comprar o vender</b> un vehículo, te recomendamos un <b>peritaje técnico</b>: te decimos el estado real antes de cerrar el negocio.<br><br>Evita sorpresas costosas después. 🔎`,
   btn:{t:'Consultar peritaje', wa:'peritaje'}},
  {kw:['espera','cuanta gente','esta lleno','hay cola','congestion'],
   a:`⏱️ Con nuestro <b>horario continuo de 6 a.m. a 7 p.m.</b> distribuimos mejor el flujo de vehículos.<br><br>💡 <b>Tip:</b> las primeras horas de la mañana y después de las 4 p.m. suelen ser las más despejadas.`,
   btn:{t:'Reservar mi turno', page:'agendar'}},
  {kw:['pago','efectivo','tarjeta','datafono','como pago','medios de pago'],
   a:`💵 Recibimos <b>efectivo y tarjeta</b>. También puedes <b>financiar</b> tu revisión con Sistecrédito o Addi y pagarla a cuotas.`,
   btn:{t:'Ver financiación', wa:'fin'}},
  {kw:['ubicado','barrio','san francisco','aparco'],
   a:`📍 Estamos en el <b>Barrio San Francisco (Aparco)</b>, Calle 111 #20-25 Sur, Ibagué.`,
   btn:{t:'Cómo llegar', url:'MAPS'}}
]);
function aiMatch(q){
  const norm = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const kb = AI_KB();
  let best=null, bestScore=0;
  kb.forEach(item=>{
    item.kw.forEach(k=>{
      if(norm.includes(k)){ const score=k.length; if(score>bestScore){bestScore=score;best=item;} }
    });
  });
  return best;
}
function aiAddMsg(text, who, btn){
  const div=document.createElement('div');
  div.className='ai-msg '+who;
  let html = text;
  if(btn){
    let href='#', attrs='';
    if(btn.page) attrs = `data-page="${btn.page}"`;
    else if(btn.wa) href = waLink(btn.wa);
    else if(btn.url==='MAPS') href = DB.config.mapsUrl;
    const target = (btn.wa||btn.url) ? ' target="_blank" rel="noopener"' : '';
    html += `<a class="ai-btn" href="${href}" ${attrs}${target}>${btn.t}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>`;
  }
  div.innerHTML = html;
  $('#aiMsgs').appendChild(div);
  $('#aiMsgs').scrollTop = $('#aiMsgs').scrollHeight;
  bindPages();
  $$('.ai-btn[data-page]',div).forEach(b=>b.addEventListener('click',()=>$('#aiPanel').classList.remove('on')));
}
function aiAsk(q){
  aiAddMsg(q,'user');
  const hit = aiMatch(q);
  // indicador de "escribiendo"
  const typing=document.createElement('div');
  typing.className='ai-msg bot ai-typing';
  typing.innerHTML='<span></span><span></span><span></span>';
  $('#aiMsgs').appendChild(typing);
  $('#aiMsgs').scrollTop=$('#aiMsgs').scrollHeight;
  setTimeout(()=>{
    typing.remove();
    if(hit){
      aiAddMsg(hit.a,'bot',hit.btn);
    } else {
      aiAddMsg(`🤔 Esa información aún no la tengo cargada.<br><br>Te dejo directo con nuestro equipo para que te resuelvan al instante.`,'bot',
        {t:'Preguntar por WhatsApp', wa:'general'});
    }
  }, 500);
}
function initAssistant(){
  const chips = ['Horarios','Precios','Agendar cita','Documentos que debo llevar','Regalo por inscribirme'];
  $('#aiChips').innerHTML = chips.map(c=>`<button class="ai-chip" data-aichip="${c}">${c}</button>`).join('');
  $$('[data-aichip]').forEach(b=>b.addEventListener('click',()=>aiAsk(b.dataset.aichip)));
  $('#aiFab').addEventListener('click',()=>{
    $('#aiPanel').classList.add('on');
    if(!$('#aiMsgs').children.length){
      aiAddMsg('Hola 👋 Soy el asistente de CDA Revitolima. Puedo responder sobre horarios, servicios, agendamiento y más. ¿En qué te ayudo?','bot');
    }
  });
  $('#aiClose').addEventListener('click',()=>$('#aiPanel').classList.remove('on'));
  const fq=$('#faqAskAi');
  if(fq) fq.addEventListener('click',()=>{ $('#aiFab').click(); });
  $('#aiForm').addEventListener('submit',e=>{
    e.preventDefault();
    const v=$('#aiText').value.trim(); if(!v) return;
    $('#aiText').value=''; aiAsk(v);
  });
}

/* ═══════════ PORTAL CLIENTE ═══════════ */
let cliUser=null;

function loadPortalData(r,pl){
  const own=(r.vehicles||[]).find(v=>String(v.plate).toUpperCase()===pl);
  const main=(r.clients||[]).find(c=>own&&c.id===own.clientId)||(r.clients||[])[0];
  if(!main) return null;
  const fix=o=>Object.assign({},o,{clientId:main.id});
  const put=(k,a)=>{ DB[k].length=0; a.forEach(x=>DB[k].push(x)); };
  put('clients',[main]);
  put('vehicles',(r.vehicles||[]).map(fix));
  put('appts',(r.appts||[]).map(fix));
  put('credits',(r.credits||[]).map(fix));
  put('revisions',r.revisions||[]);
  put('reminders',r.reminders||[]);
  return main;
}
$('#cliForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const doc=$('#clDoc').value.trim(), pl=$('#clPlate').value.trim().toUpperCase();
  const ce=$('#clErr'); if(!ce.dataset.def) ce.dataset.def=ce.textContent;
  const btn=$('#cliForm button[type=submit]'); if(btn) btn.disabled=true;
  let cl=null;
  try{
    const r=await sbPortalConsulta(doc,pl);
    if(r){ cl=loadPortalData(r,pl); window.__portalKey={doc,pl}; }
  }catch(err){
    console.warn(err); if(btn) btn.disabled=false;
    ce.textContent='No pudimos conectar con el servidor. Intenta de nuevo.'; ce.classList.add('on'); return;
  }
  if(btn) btn.disabled=false;
  if(!cl){ ce.textContent=ce.dataset.def; ce.classList.add('on'); return; }
  ce.classList.remove('on');
  cliUser=cl;
  $('#cliLogin').style.display='none';
  $('#cliShell').style.display='';
  $('#cliAv').textContent = cl.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
  $('#cliNm').textContent = cl.name;
  $('#cliDc').textContent = 'C.C. '+cl.doc;
  renderCli();
  bindNotifBells();
});
$('#cliOut').addEventListener('click',()=>{
  cliUser=null; $('#cliShell').style.display='none'; $('#cliLogin').style.display='';
  $('#cliForm').reset();
});
$$('[data-cv]').forEach(a=>a.addEventListener('click',()=>{
  $$('[data-cv]').forEach(x=>x.classList.remove('on'));
  a.classList.add('on');
  const v=a.dataset.cv;
  $$('[data-cvw]').forEach(p=>p.classList.toggle('on',p.dataset.cvw===v));
  $('#cliTitle').textContent = a.textContent.trim();
  $('#cliSide').classList.remove('open'); $$('.side-ov').forEach(o=>o.classList.remove('on'));
  window.scrollTo(0,0);
}));

function dueBadge(due){
  if(!due) return '<span class="pill pill-neu">Sin registrar</span>';
  const d=daysTo(due);
  if(d<0) return `<span class="pill pill-dan">Vencida hace ${Math.abs(d)} d</span>`;
  if(d<=15) return `<span class="pill pill-dan">Vence en ${d} d</span>`;
  if(d<=45) return `<span class="pill pill-warn">Vence en ${d} d</span>`;
  return `<span class="pill pill-ok">Vigente</span>`;
}
function dueColor(due){
  if(!due) return 'var(--line)';
  const d=daysTo(due);
  return d<0?'var(--danger)':d<=15?'var(--danger)':d<=45?'var(--warn)':'var(--green-500)';
}

function renderCli(){
  if(!cliUser) return;
  const myVeh = DB.vehicles.filter(v=>v.clientId===cliUser.id);
  const myAp  = DB.appts.filter(a=>a.clientId===cliUser.id).sort((a,b)=>a.date<b.date?1:-1);
  const next  = myAp.filter(a=>a.date>=iso(today)&&a.status!=='Cancelada').sort((a,b)=>a.date>b.date?1:-1)[0];
  const myFin = DB.credits.filter(f=>f.clientId===cliUser.id);
  const myCar = DB.cartera.filter(k=>k.clientId===cliUser.id && k.status!=='Pagada');
  const urgent= myVeh.filter(v=>v.due && daysTo(v.due)<=30).sort((a,b)=>daysTo(a.due)-daysTo(b.due));

  /* INICIO */
  let alerts='';
  urgent.forEach(v=>{
    const d=daysTo(v.due);
    alerts += `<div class="alertbar ${d<0?'dan':'warn'}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
      <div><b>${v.plate} · ${d<0?`revisión vencida hace ${Math.abs(d)} días`:`vence en ${d} días`}</b>
      <p>Fecha de vencimiento: ${fmtDate(v.due)}. Agenda tu revisión para mantenerte al día.</p></div>
      <a class="btn btn-p btn-sm" data-wa="venc">Agendar</a></div>`;
  });
  myCar.filter(k=>k.status==='Vencida').forEach(k=>{
    alerts += `<div class="alertbar dan">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
      <div><b>Obligación pendiente por ${COP(k.amount)}</b><p>${k.concept} · venció el ${fmtDate(k.due)}.</p></div>
      <a class="btn btn-o btn-sm" data-wa="general">Consultar</a></div>`;
  });
  if(!alerts) alerts=`<div class="alertbar ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6 9 17l-5-5"/></svg><div><b>Todo al día</b><p>No tienes vencimientos próximos ni obligaciones pendientes.</p></div></div>`;

  $('#cvInicio').innerHTML = `
    <div class="cp-hero"><h2 class="dsp">Hola, ${cliUser.name.split(' ')[0]}</h2>
      <p>Este es el resumen de tus vehículos y trámites en CDA Revitolima.</p></div>
    ${alerts}
    <div class="g2" style="margin-top:20px">
      <div class="panel" style="margin:0">
        <div class="panel-h"><div><h3>Próxima cita</h3></div></div>
        <div class="panel-b">
          ${next?`
            <div style="display:flex;gap:14px;align-items:flex-start">
              <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 11h18"/></svg></div>
              <div style="flex:1">
                <b style="font-size:1.05rem;font-family:'Plus Jakarta Sans',sans-serif">${fmtDate(next.date)} · ${next.time}</b>
                <p style="font-size:.86rem;color:var(--ink-2);margin-top:3px">Placa ${next.plate} · ${next.type==='moto'?'Moto':'Carro'}</p>
                <div style="margin-top:9px">${next.status==='Confirmada'?'<span class="pill pill-ok">Confirmada</span>':'<span class="pill pill-warn">Pendiente de confirmación</span>'}</div>
                ${next.code?`<div class="cli-code">🎫 Código: <b>${next.code}</b></div>`:''}
                ${next.status!=='Confirmada'?`
                <a class="btn btn-cta-green" style="margin-top:14px;width:100%" target="_blank" rel="noopener"
                   href="https://wa.me/${WA_GENERAL}?text=${encodeURIComponent(
                     `*CONFIRMACIÓN DE CITA* ✅\n\n`+
                     (next.code?`Código: *${next.code}*\n`:'')+
                     `Nombre: *${next.name}*\n`+
                     `Placa: *${next.plate}*\n`+
                     `Fecha: *${fmtDate(next.date)}*\n`+
                     `Hora: *${next.time}*\n\n`+
                     `_Confirmo que asistiré a mi cita._ 🙌`)}">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/></svg>
                  Confirmar mi cita por WhatsApp</a>`:''}
                <div style="display:flex;gap:9px;margin-top:11px;flex-wrap:wrap">
                  <button class="btn btn-soft-green" data-repro="${next.id}">🔄 Reprogramar</button>
                  <button class="btn btn-soft-red" data-cancel="${next.id}">Cancelar cita</button>
                </div>
              </div>
            </div>`:`
            <div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 11h18"/></svg>
              <b>No tienes citas programadas</b><p>Agenda tu próxima revisión desde el sitio o por WhatsApp.</p>
              <a class="btn btn-p btn-sm" style="margin-top:14px" data-wa="agenda">Agendar cita</a></div>`}
        </div>
      </div>
      <div class="panel" style="margin:0">
        <div class="panel-h"><h3>Estado de financiación</h3></div>
        <div class="panel-b">
          ${myFin.length?myFin.map(f=>`
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line-2)">
              <div><b style="font-size:.9rem">${f.entidad}</b><small style="display:block;color:var(--ink-3);font-size:.78rem">${COP(f.amount)}${f.diaPago?' · '+f.diaPago:''}</small></div>
              <span class="pill ${f.status==='Desembolsado'?'pill-ok':f.status==='Rechazado'?'pill-dan':'pill-warn'}">${f.status}</span>
            </div>`).join(''):`
            <div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2.4"/><path d="M2 10h20"/></svg>
              <b>Sin solicitudes de financiación</b><p>Consulta las condiciones de Sistecrédito o Addi en el centro.</p></div>`}
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-h"><h3>Mis vehículos</h3><span style="font-size:.8rem;color:var(--ink-3)">${myVeh.length} registrado${myVeh.length===1?'':'s'}</span></div>
      <div class="panel-b"><div class="g2">${myVeh.map(vehCard).join('')||'<p style="color:var(--ink-3);font-size:.88rem">Sin vehículos registrados.</p>'}</div></div>
    </div>`;

  /* VEHÍCULOS */
  $('#cvVeh').innerHTML = `
    <div class="panel"><div class="panel-h"><div><h3>Mis vehículos</h3><p>Estado y próximo vencimiento de cada vehículo registrado a tu nombre.</p></div></div>
      <div class="panel-b"><div class="g2">${myVeh.map(vehCard).join('')||emptyBox('Sin vehículos','Cuando registres un vehículo aparecerá aquí.')}</div></div></div>`;

  /* CITAS */
  $('#cvCitas').innerHTML = `
    <div class="panel"><div class="panel-h"><div><h3>Mis citas</h3><p>Historial y próximas citas agendadas.</p></div>
      <a class="btn btn-p btn-sm" data-wa="agenda">Agendar nueva</a></div>
      <div class="panel-b flush"><div class="tw"><table>
        <thead><tr><th>Fecha</th><th>Hora</th><th>Vehículo</th><th>Estado</th><th>Origen</th><th></th></tr></thead>
        <tbody>${myAp.length?myAp.map(a=>`<tr>
          <td><b>${fmtDate(a.date)}</b></td><td class="num">${a.time}</td>
          <td><span class="plate">${a.plate}</span></td>
          <td>${apStatus(a.status)}</td><td><small style="margin:0">${a.source}</small></td>
          <td class="tact">${a.date>=iso(today)&&a.status!=='Cancelada'&&a.status!=='Completada'
            ?`<button class="btn btn-soft-green btn-xs" data-repro="${a.id}">Reprogramar</button>
              <button class="btn btn-soft-red btn-xs" data-cancel="${a.id}">Cancelar</button>`:''}</td>
        </tr>`).join(''):`<tr><td colspan="6">${emptyBox('Sin citas registradas','Agenda tu revisión desde el sitio o por WhatsApp.')}</td></tr>`}</tbody>
      </table></div></div></div>`;

  /* HISTORIAL */
  const myRev = DB.revisions.filter(r=>myVeh.some(v=>v.id===r.vehicleId)).sort((a,b)=>a.date<b.date?1:-1);
  $('#cvHist').innerHTML = `
    <div class="panel"><div class="panel-h"><div><h3>Historial de revisiones</h3><p>Todas las revisiones realizadas a tus vehículos.</p></div></div>
      <div class="panel-b">${myRev.length?`<div class="tl">${myRev.map(r=>{
        const v=vehOf(r.vehicleId);
        const pill = r.result==='Rechazada'?'pill-dan':r.result==='Reaprobada'?'pill-warn':'pill-ok';
        return `<div class="tl-i ${r.result==='Rechazada'?'dan':''}">
          <div class="tl-d">${fmtDate(r.date)}</div>
          <b>${v.plate} <span class="pill ${pill}" style="margin-left:6px">${r.result}</span></b>
          <p>${r.notes||'Sin observaciones registradas.'}</p></div>`;}).join('')}</div>`
        :emptyBox('Aún no hay revisiones','Cuando realices tu primera revisión con nosotros aparecerá aquí.')}
      </div></div>`;

  /* CRÉDITOS — vigencia, valor total, cuotas y valor de cuota */
  $('#cvFin').innerHTML = `
    <div class="panel"><div class="panel-h"><div><h3>Mis créditos</h3><p>Información general de tu financiación. El seguimiento de cuotas lo gestiona directamente la entidad.</p></div></div>
      <div class="panel-b">${myFin.length? myFin.map(f=>`
        <div class="credit-card">
          <div class="credit-hd">
            <div><b>${f.entidad}</b><small>Solicitud del ${fmtDate(f.dateSolicitud)}</small></div>
            <span class="pill ${f.status==='Desembolsado'?'pill-ok':f.status==='Rechazado'?'pill-dan':'pill-warn'}">${f.status}</span>
          </div>
          ${f.status==='Desembolsado'? `
          <div class="credit-grid">
            <div class="credit-item"><span>Valor total</span><b>${COP(f.amount)}</b></div>
            <div class="credit-item"><span>Cuotas</span><b>${f.cuotas||'—'}</b></div>
            <div class="credit-item"><span>Valor por cuota</span><b>${f.valorCuota?COP(f.valorCuota):'—'}</b></div>
            <div class="credit-item"><span>Día de pago</span><b>${f.diaPago||'—'}</b></div>
            <div class="credit-item credit-full"><span>Vigencia del crédito</span><b>Hasta el ${f.vigenciaHasta?fmtDate(f.vigenciaHasta):'—'}</b></div>
          </div>`
          : `<div class="credit-pending">${f.status==='Pendiente'?'⏳ Tu solicitud está en estudio por la entidad. Te avisaremos apenas tengamos respuesta.':'❌ La entidad no aprobó esta solicitud. Puedes consultar otras opciones de financiación con nosotros.'}</div>`}
        </div>`).join('')
        : emptyBox('Sin créditos','No tienes créditos registrados con Sistecrédito o Addi.')}
      </div></div>
    ${myCar.length?`<div class="panel"><div class="panel-h"><h3>Obligaciones pendientes</h3></div>
      <div class="panel-b flush"><div class="tw"><table><thead><tr><th>Concepto</th><th>Valor</th><th>Vence</th><th>Estado</th></tr></thead>
      <tbody>${myCar.map(k=>`<tr><td>${k.concept}</td><td class="num">${COP(k.amount)}</td><td>${fmtDate(k.due)}</td>
        <td><span class="pill ${k.status==='Vencida'?'pill-dan':'pill-warn'}">${k.status}</span></td></tr>`).join('')}</tbody></table></div></div></div>`:''}`;

  /* PERFIL */
  $('#cvPerfil').innerHTML = `
    <div class="panel" style="max-width:620px"><div class="panel-h"><div><h3>Mi perfil</h3><p>Datos de contacto registrados en el centro.</p></div></div>
      <div class="panel-b">
        <div class="fgrid">
          <div><label class="flabel">Nombre completo</label><input class="finput" id="pfName" value="${cliUser.name}"></div>
          <div><label class="flabel">Documento</label><input class="finput" value="${cliUser.doc}" disabled style="background:var(--ivory-2);color:var(--ink-3)"></div>
          <div><label class="flabel">Celular</label><input class="finput" id="pfPhone" value="${cliUser.phone}"></div>
          <div><label class="flabel">Correo</label><input class="finput" id="pfMail" value="${cliUser.email||''}" placeholder="correo@ejemplo.com"></div>
        </div>
        <button class="btn btn-p" style="margin-top:18px" id="pfSave">Guardar cambios</button>
      </div></div>`;

  /* AVISOS */
  const myRem = DB.reminders.filter(m=>myVeh.some(v=>v.plate===m.plate));
  $('#cvAvisos').innerHTML = `
    <div class="panel"><div class="panel-h"><div><h3>Mis recordatorios</h3><p>Avisos configurados antes del vencimiento de tu revisión.</p></div></div>
      <div class="panel-b">
        <div class="note-box" style="margin-bottom:16px"><b>¿Cuándo te avisamos?</b>El centro envía avisos ${DB.config.intervalos.join(', ')} días antes del vencimiento, por el canal que elijas.</div>
        ${myRem.length?`<div class="tw"><table><thead><tr><th>Placa</th><th>Vence</th><th>Canal</th><th>Estado</th></tr></thead>
          <tbody>${myRem.map(m=>`<tr><td><span class="plate">${m.plate}</span></td><td>${fmtDate(m.due)}</td>
            <td>${m.channel}</td><td>${dueBadge(m.due)}</td></tr>`).join('')}</tbody></table></div>`
          :emptyBox('Sin recordatorios activos','Registra tu vehículo desde el sitio para recibir avisos.')}
      </div></div>`;

  bindCliActions();
  bindWA();
}

function vehCard(v){
  const d = v.due?daysTo(v.due):null;
  const pct = d==null?0:Math.max(0,Math.min(100,Math.round((1-(d/365))*100)));
  const lastRev = DB.revisions.filter(r=>r.vehicleId===v.id).sort((a,b)=>a.date<b.date?1:-1)[0];
  return `<div class="vehcard">
    <div class="vehcard-t"><div><h4>${v.cat}</h4><small>${v.type==='moto'?'Motocicleta':'Vehículo particular'}</small></div>
      <span class="plate">${v.plate}</span></div>
    <div class="vrow"><span>Última revisión</span><span>${lastRev?fmtDate(lastRev.date):'Sin registro'}</span></div>
    <div class="vrow"><span>Próximo vencimiento</span><span>${v.due?fmtDate(v.due):'Por registrar'}</span></div>
    <div class="vrow"><span>Estado</span><span>${dueBadge(v.due)}</span></div>
    <div class="bar"><i style="width:${pct}%;background:${dueColor(v.due)}"></i></div>
  </div>`;
}
function apStatus(s){
  const m={'Confirmada':'pill-ok','Completada':'pill-ok','Pendiente':'pill-warn','Cancelada':'pill-dan'};
  return `<span class="pill ${m[s]||'pill-neu'}">${s}</span>`;
}
function emptyBox(t,p){
  return `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="17" rx="2.4"/><path d="M8 2v4M16 2v4M3 10h18"/></svg><b>${t}</b><p>${p}</p></div>`;
}

function bindCliActions(){
  $$('[data-repro]').forEach(b=>b.addEventListener('click',()=>{
    const ap=DB.appts.find(a=>a.id===b.dataset.repro); if(!ap) return;
    modal('Reprogramar cita',`
      <p style="font-size:.88rem;color:var(--ink-2);margin-bottom:16px">Cita actual: <b>${fmtDate(ap.date)} · ${ap.time}</b> · placa ${ap.plate}</p>
      <label class="flabel">Nueva fecha</label><input type="date" id="rpDate" class="finput" min="${iso(today)}" value="${ap.date}">
      <label class="flabel" style="margin-top:14px">Nueva hora</label>
      <select id="rpTime" class="finput">${DB.config.slots.map(s=>`<option ${s===ap.time?'selected':''}>${s}</option>`).join('')}</select>`,
      `<button class="btn btn-o" data-mclose>Cancelar</button><button class="btn btn-p" id="rpSave">Guardar cambios</button>`);
    $('#rpSave').addEventListener('click',async()=>{
      const nd=$('#rpDate').value, nt=$('#rpTime').value;
      try{ await sbPortalActualizar(window.__portalKey.doc,window.__portalKey.pl,'cita',ap.id,{date:nd,time:nt}); }
      catch(err){ toast(String(err&&err.message).includes('SLOT_OCUPADO')?'Ese horario ya está ocupado. Elige otro.':'No se pudo guardar el cambio. Intenta de nuevo.'); return; }
      ap.date=nd; ap.time=nt; ap.status='Pendiente';
      logAct(`Cita reprogramada por el cliente · ${ap.plate} → ${fmtDate(ap.date)} ${ap.time}`);
      closeModal(); renderCli(); refreshBadges(); toast('Cita reprogramada');
    });
  }));
  $$('[data-cancel]').forEach(b=>b.addEventListener('click',()=>{
    const ap=DB.appts.find(a=>a.id===b.dataset.cancel); if(!ap) return;
    modal('Cancelar cita',`<p style="font-size:.9rem;color:var(--ink-2)">¿Confirmas que deseas cancelar la cita del <b>${fmtDate(ap.date)} a las ${ap.time}</b> para la placa ${ap.plate}?</p>`,
      `<button class="btn btn-o" data-mclose>Volver</button><button class="btn btn-p" id="cnYes" style="background:var(--danger)">Sí, cancelar</button>`);
    $('#cnYes').addEventListener('click',async()=>{
      try{ await sbPortalActualizar(window.__portalKey.doc,window.__portalKey.pl,'cita',ap.id,{status:'Cancelada'}); }
      catch(err){ toast('No se pudo cancelar la cita. Intenta de nuevo.'); return; }
      ap.status='Cancelada'; logAct(`Cita cancelada por el cliente · ${ap.plate}`);
      closeModal(); renderCli(); refreshBadges(); toast('Cita cancelada');
    });
  }));
  const sv=$('#pfSave');
  if(sv) sv.addEventListener('click',async()=>{
    try{ await sbPortalActualizar(window.__portalKey.doc,window.__portalKey.pl,'perfil',cliUser.id,
      {name:$('#pfName').value.trim(),phone:$('#pfPhone').value.trim(),email:$('#pfMail').value.trim()}); }
    catch(err){ toast('No se pudo guardar tu perfil. Intenta de nuevo.'); return; }
    cliUser.name=$('#pfName').value.trim()||cliUser.name;
    cliUser.phone=$('#pfPhone').value.trim();
    cliUser.email=$('#pfMail').value.trim();
    $('#cliNm').textContent=cliUser.name;
    logAct(`Cliente actualizó su perfil · ${cliUser.name}`);
    toast('Perfil actualizado'); renderCli();
  });
  $$('[data-mclose]').forEach(b=>{ if(!b.dataset.bd){b.dataset.bd='1';b.addEventListener('click',closeModal);} });
}

/* ═══════════ PORTAL ADMINISTRATIVO ═══════════ */
let admIn=false, admRange='mes';
let currentUser=null; // {id,username,role,name,advisorId}
const SESSION_LOG=[]; // simula actividad de todos los usuarios en esta sesión, para detectar "movimientos extraños"
let lastActivityAt = Date.now();
addEventListener('click',()=>{ lastActivityAt=Date.now(); });

function trackAction(action){
  if(!currentUser) return;
  SESSION_LOG.push({user:currentUser.username, role:currentUser.role, action, at:Date.now()});
  // Regla simple de demostración: más de 12 acciones de escritura en menos de 60s = "movimiento extraño"
  const recent = SESSION_LOG.filter(l=>l.user===currentUser.username && Date.now()-l.at<60000);
  if(recent.length===12){
    pushNotification({role:'super', type:'movimiento', sev:'dan',
      text:`Actividad inusual: el usuario "${currentUser.username}" (${ROLE_LABEL[currentUser.role]}) realizó ${recent.length} acciones en menos de un minuto.`});
  }
}
// Simulación de verificación de inactividad (en producción esto lo evalúa el servidor por sesión real)
setInterval(()=>{
  if(currentUser && Date.now()-lastActivityAt > 24*3600*1000){
    pushNotification({role:'super', type:'inactividad', sev:'warn',
      text:`El usuario "${currentUser.username}" no registra actividad hace más de 24 horas.`});
    lastActivityAt = Date.now();
  }
}, 60000);

$$('.cred-pick').forEach(b=>b.addEventListener('click',()=>{
  $('#adUser').value=b.dataset.u; $('#adPass').value=b.dataset.p;
  $('#adErr').classList.remove('on');
  $$('.cred-pick').forEach(x=>x.style.borderColor='#E8DCB8');
  b.style.borderColor='var(--gold)';
}));
let adPending=null;
function adErr(msg){ const e=$('#adErr'); e.textContent=msg; e.classList.add('on'); }
function resetAdminForm(){
  adPending=null; $('#admForm').reset();
  $('#adStep1').style.display=''; $('#adStep2').style.display='none';
  $('#adErr').classList.remove('on');
  const b=$('#admForm button[type=submit]'); b.disabled=false; b.textContent='Ingresar al portal';
}
function enterAdmin(p){
  const u={id:p.email,username:p.username||p.email,name:p.name,role:p.role,advisorId:p.advisorId||undefined};
  window.CDA_STAFF=true;
  admIn=true; currentUser=u; lastActivityAt=Date.now();
  $('#adErr').classList.remove('on');
  $('#admLogin').style.display='none';
  $('#admShell').style.display='';
  $('#admAv').textContent = u.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
  $('#admNm').textContent = u.name;
  $('#admRoleLbl').textContent = ROLE_LABEL[u.role];
  $('#admNotifBell').dataset.role = u.role;
  applyRoleVisibility(u.role);
  logAct(`Inicio de sesión · ${u.name} (${ROLE_LABEL[u.role]})`);
  trackAction('login');
  goDefaultView(u.role);
  renderAdmin();
}
async function startAdminSession(p){
  try{ await sbStaffStart(p); }
  catch(e){ console.warn(e); await sbAdminLogout(); throw new Error('CARGA_FALLIDA'); }
  enterAdmin(p);
}
$('#admForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=$('#admForm button[type=submit]');
  btn.disabled=true; btn.textContent='Verificando…';
  try{
    if(adPending){
      const r=await sbAdminVerify(adPending,$('#adCode').value);
      btn.textContent='Cargando datos…';
      await startAdminSession(r.profile); resetAdminForm();
    }else{
      const r=await sbAdminLogin($('#adUser').value,$('#adPass').value);
      if(r.needCode){
        adPending=r.email; $('#adStep1').style.display='none'; $('#adStep2').style.display='';
        $('#adCodeMail').textContent=r.hint; $('#adErr').classList.remove('on'); $('#adCode').focus();
      }else{
        btn.textContent='Cargando datos…';
        await startAdminSession(r.profile); resetAdminForm();
      }
    }
  }catch(err){
    const m=String(err&&err.message||'');
    adErr(m==='CREDENCIALES'?'Usuario o contraseña incorrectos.'
      :m==='SIN_ACCESO'?'Tu correo no tiene acceso al portal. Pídele a gerencia que lo habilite.'
      :m==='CODIGO_INVALIDO'?'El código no es correcto o ya venció.'
      :m==='CODIGO_NO_ENVIADO'?'No pudimos enviar el código al correo. Intenta de nuevo en unos minutos.'
      :m==='SIN_CONEXION'?'Sin conexión con el servidor. Revisa tu internet.'
      :m==='CARGA_FALLIDA'?'No pudimos cargar los datos. Intenta de nuevo.'
      :'No pudimos iniciar sesión. Intenta de nuevo.');
  }finally{
    btn.disabled=false; btn.textContent = adPending ? 'Verificar código' : 'Ingresar al portal';
  }
});
async function adminLogout(motivo){
  if(currentUser){
    const t=`Cierre de sesión · ${currentUser.name}`;
    DB.log.unshift({t,at:new Date().toLocaleString('es-CO')});
    try{ await sbLog(t,currentUser.name); }catch(e){}
  }
  await sbAdminLogout();
  window.CDA_STAFF=false; admIn=false; currentUser=null;
  $('#admShell').style.display='none'; $('#admLogin').style.display='';
  resetAdminForm();
  if(motivo) adErr(motivo);
}
$('#admOut').addEventListener('click',()=>adminLogout());
['click','keydown','touchstart','scroll'].forEach(ev=>addEventListener(ev,()=>{ lastActivityAt=Date.now(); },{passive:true}));
setInterval(()=>{
  if(admIn && Date.now()-lastActivityAt > ADMIN_IDLE_MIN*60000) adminLogout('Cerramos tu sesión por inactividad. Ingresa de nuevo.');
},30000);

/* ---------- MENÚ DINÁMICO SEGÚN PERFIL ---------- */
const NAV_META = {
  gerencia:{label:'Panel gerencial', ico:'<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>', grupo:'Mi vista'},
  miagenda:{label:'Mi día', ico:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>', grupo:'Mi vista'},
  caja:{label:'Caja y clientes', ico:'<rect x="2" y="6" width="20" height="13" rx="2.2"/><path d="M2 10h20M7 15h4"/>', grupo:'Mi vista'},
  dash:{label:'Tablero', ico:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>', grupo:'Operación'},
  agenda:{label:'Agenda general', ico:'<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 11h18"/>', grupo:'Operación'},
  preventivas:{label:'Preventivas', ico:'<path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7"/><rect x="2" y="7" width="20" height="5" rx="1.5"/><path d="M12 21V7"/>', grupo:'Operación'},
  citas:{label:'Listado de citas', ico:'<path d="M9 11l3 3L22 4"/><rect x="3" y="4" width="18" height="17" rx="2.4"/>', grupo:'Operación', badge:'bgCitas'},
  clientes:{label:'Clientes', ico:'<circle cx="9" cy="8" r="3.5"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1"/>', grupo:'Operación'},
  vehiculos:{label:'Vehículos', ico:'<path d="M3 13l1.6-4.8A2 2 0 0 1 6.5 7h11a2 2 0 0 1 1.9 1.2L21 13"/><rect x="2" y="13" width="20" height="6" rx="1.6"/>', grupo:'Operación'},
  venc:{label:'Vencimientos', ico:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>', grupo:'Operación', badge:'bgVenc'},
  cartera:{label:'Cartera', ico:'<path d="M3 7h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7V5a2 2 0 0 1 2-2h11l5 4"/>', grupo:'Financiero'},
  fin:{label:'Créditos', ico:'<rect x="2" y="5" width="20" height="14" rx="2.4"/><path d="M2 10h20M6 15h4"/>', grupo:'Financiero'},
  finanzas:{label:'Finanzas', ico:'<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>', grupo:'Financiero'},
  informes:{label:'Informes', ico:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>', grupo:'Sistema'},
  export:{label:'Exportaciones', ico:'<path d="M12 3v12M8 11l4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>', grupo:'Sistema'},
  usuarios:{label:'Usuarios y permisos', ico:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1"/>', grupo:'Sistema'},
  config:{label:'Configuración', ico:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.8 1.1 2 2 0 1 1-4 0 1.6 1.6 0 0 0-2.8-1.1 2 2 0 1 1-2.8-2.8A1.6 1.6 0 0 0 3.4 14a2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.1-2.8 2 2 0 1 1 2.8-2.8A1.6 1.6 0 0 0 10 3.4a2 2 0 1 1 4 0 1.6 1.6 0 0 0 2.8 1.1 2 2 0 1 1 2.8 2.8A1.6 1.6 0 0 0 20.6 10a2 2 0 1 1 0 4z"/>', grupo:'Sistema'}
};
function buildNav(role){
  const nav = ROLES[role].nav;
  const grupos = ['Mi vista','Operación','Financiero','Sistema'];
  let html='';
  grupos.forEach(g=>{
    const items = nav.filter(k=>NAV_META[k] && NAV_META[k].grupo===g);
    if(!items.length) return;
    if(g!=='Mi vista') html += `<div class="snav-lbl">${g}</div>`;
    items.forEach((k,i)=>{
      const m = NAV_META[k];
      html += `<a data-av="${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">${m.ico}</svg>${m.label}`
           + (m.badge?`<span class="bdg" id="${m.badge}">0</span>`:'') + `</a>`;
    });
  });
  $('#admNav').innerHTML = html;
  bindNavClicks();
}
function bindNavClicks(){
  $$('#admNav [data-av]').forEach(a=>a.addEventListener('click',()=>{
    $$('#admNav [data-av]').forEach(x=>x.classList.remove('on'));
    a.classList.add('on');
    const v=a.dataset.av;
    $$('[data-avw]').forEach(p=>p.classList.toggle('on',p.dataset.avw===v));
    $('#admTitle').textContent = NAV_META[v]? NAV_META[v].label : v;
    $('#admSide').classList.remove('open'); $$('.side-ov').forEach(o=>o.classList.remove('on'));
    window.scrollTo(0,0);
  }));
}
function applyRoleVisibility(role){ buildNav(role); }
function goDefaultView(role){
  const first = ROLES[role].home;
  $$('#admNav [data-av]').forEach(x=>x.classList.toggle('on', x.dataset.av===first));
  $$('[data-avw]').forEach(p=>p.classList.toggle('on', p.dataset.avw===first));
  $('#admTitle').textContent = NAV_META[first]? NAV_META[first].label : first;
}
function can(view){ return currentUser && ROLES[currentUser.role].nav.includes(view); }

function rangeDays(){ return admRange==='dia'?1:admRange==='semana'?7:admRange==='mes'?30:365; }
function inRange(d){ const n=daysTo(d); return n<=0 && n>-rangeDays(); }

function refreshBadges(){
  const pend = DB.appts.filter(a=>a.status==='Pendiente').length;
  const venc = DB.vehicles.filter(v=>v.due&&daysTo(v.due)<=30).length;
  const mora = DB.cartera.filter(k=>k.status==='Vencida').length;
  const set=(id,n)=>{const e=$(id); if(e){e.textContent=n; e.style.display=n?'':'none';}};
  set('#bgCitas',pend); set('#bgVenc',venc); set('#bgMora',mora);
}

// Función para crear un cliente con acceso al portal
function crearClientePortal(doc, name, phone, email, plate, type){
  if(!doc || !name || !plate) return toast('Completa documento, nombre y placa');
  let cl = DB.clients.find(c=>c.doc===doc);
  if(!cl){
    cl = {id:uid('c'), doc, name, phone:phone||'', email:email||'', notes:'Creado desde admin.'};
    DB.clients.push(cl);
  }
  const det = detectVehicleByPlate(plate);
  if(!vehByPlate(plate)){
    DB.vehicles.push({id:uid('v'), plate:plate.toUpperCase(), type:type||(det?det.sub:'automovil'),
      cat:vLabel(type||(det?det.sub:'automovil')), clientId:cl.id, due:null});
  }
  logAct('Cliente creado · ' + name + ' · ' + plate);
  trackAction('crear-cliente');
  renderAdmin();
  toast('✅ Cliente registrado — ya puede ingresar al portal con su documento y placa');
  return cl;
}

function renderAdmin(){
  refreshBadges();
  const R=rangeDays();
  const apR = DB.appts.filter(a=>inRange(a.date));
  const done= apR.filter(a=>a.status==='Completada').length;
  const canc= apR.filter(a=>a.status==='Cancelada').length;
  const revR= DB.revisions.filter(r=>inRange(r.date)).length;
  const pagos= DB.cartera.filter(k=>k.status==='Pagada').reduce((s,k)=>s+k.amount,0);
  const finAp= DB.credits.filter(f=>f.status==='Desembolsado').reduce((s,f)=>s+f.amount,0);
  const pend = DB.cartera.filter(k=>k.status==='Pendiente').reduce((s,k)=>s+k.amount,0);
  const mora = DB.cartera.filter(k=>k.status==='Vencida').reduce((s,k)=>s+k.amount,0);
  const totalC = pend+mora+pagos;
  const tasaMora = totalC? Math.round(mora/totalC*100):0;
  const proxV = DB.vehicles.filter(v=>v.due&&daysTo(v.due)<=30).length;
  const conv = DB.reminders.length? Math.round(DB.reminders.filter(m=>m.converted).length/DB.reminders.length*100):0;

  /* TABLERO */
  const meses=[];
  for(let i=5;i>=0;i--){ const d=new Date(today.getFullYear(),today.getMonth()-i,1);
    meses.push({l:['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][d.getMonth()],
      v: DB.monthly[5-i] });
  }
  const maxM=Math.max(...meses.map(m=>m.v),1);

  $('#avDash').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px">
      <div><h2 class="dsp" style="font-size:1.3rem">Resumen operativo</h2>
        <p style="font-size:.84rem;color:var(--ink-3)">Últimos ${R} días · actualizado hoy</p></div>
      <div class="seg" id="segRange">
        <button data-r="dia" class="${admRange==='dia'?'on':''}">Día</button>
        <button data-r="semana" class="${admRange==='semana'?'on':''}">Semana</button>
        <button data-r="mes" class="${admRange==='mes'?'on':''}">Mes</button>
        <button data-r="anio" class="${admRange==='anio'?'on':''}">Año</button>
      </div>
    </div>
    <div class="kpis">
      ${kpi('Vehículos atendidos', done+revR, 'car', `<b>${done}</b> citas completadas en el periodo`)}
      ${kpi('Citas agendadas', apR.length, 'cal', `${canc} cancelada${canc===1?'':'s'}`)}
      ${kpi('Ingresos por pago directo', COP(pagos), 'money', 'Obligaciones ya pagadas')}
      ${kpi('Ingresos por financiación', COP(finAp), 'card', 'Solicitudes aprobadas')}
      ${kpi('Cartera pendiente', COP(pend), 'clock', 'Aún dentro del plazo','warn')}
      ${kpi('Cartera vencida', COP(mora), 'alert', `${DB.cartera.filter(k=>k.status==='Vencida').length} obligación(es)`,'alert')}
      ${kpi('Tasa de mora', tasaMora+'%', 'chart', 'Sobre el total de cartera', tasaMora>25?'alert':'')}
      ${kpi('Revisiones por vencer', proxV, 'bell', 'En los próximos 30 días', proxV?'warn':'')}
    </div>

    <div class="g2" style="align-items:start">
      <div class="panel" style="margin:0"><div class="panel-h"><div><h3>Revisiones por mes</h3><p>Últimos 6 meses</p></div></div>
        <div class="panel-b"><div class="chart">${meses.map(m=>`
          <div class="chart-b"><b>${m.v}</b><div class="chart-bw"><i style="height:${Math.round(m.v/maxM*100)}%"></i></div><span>${m.l}</span></div>`).join('')}</div></div></div>

      <div class="panel" style="margin:0"><div class="panel-h"><div><h3>Conversión de recordatorios</h3><p>Recordatorios que terminaron en cita</p></div></div>
        <div class="panel-b">
          <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:6px">
            <span class="dsp" style="font-size:2.1rem;color:var(--green-700)">${conv}%</span>
            <span style="font-size:.84rem;color:var(--ink-3)">${DB.reminders.filter(m=>m.converted).length} de ${DB.reminders.length}</span>
          </div>
          <div class="bar" style="height:9px"><i style="width:${conv}%;background:var(--green-500)"></i></div>
          <div class="note-box" style="margin-top:16px"><b>Cómo se calcula</b>Recordatorios registrados que se convirtieron en una cita agendada antes del vencimiento.</div>
        </div></div>
    </div>

    <div class="panel"><div class="panel-h"><div><h3>Alertas que requieren acción</h3></div></div>
      <div class="panel-b">${alertsAdmin()}</div></div>

    <div class="panel"><div class="panel-h"><h3>Actividad reciente</h3></div>
      <div class="panel-b">${DB.log.length?`<div class="tl">${DB.log.slice(0,8).map(l=>
        `<div class="tl-i"><div class="tl-d">${l.at}</div><b>${l.t}</b></div>`).join('')}</div>`
        :'<p style="font-size:.86rem;color:var(--ink-3)">Sin actividad registrada en esta sesión.</p>'}</div></div>`;

  $$('#segRange button').forEach(b=>b.addEventListener('click',()=>{admRange=b.dataset.r;renderAdmin();}));

  /* AGENDA (calendario) */
  renderAgenda();

  /* INTEGRACIONES */
  $('#avIntg').innerHTML = `
    <div class="panel"><div class="panel-h"><div><h3>Integraciones</h3><p>Conecta CDA Revitolima con las herramientas que ya usas.</p></div></div>
      <div class="panel-b" style="display:flex;flex-direction:column;gap:14px">

        <div class="intg">
          <div class="intg-logo"><svg viewBox="0 0 24 24" fill="#25D366"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/></svg></div>
          <div style="flex:1"><b>WhatsApp Business</b>
            <p>Envío automático de confirmaciones de cita, recordatorios de vencimiento y gestión de cartera por plantillas aprobadas.</p>
            <div style="display:flex;gap:8px;margin-top:11px;flex-wrap:wrap">
              <span class="pill pill-warn">Requiere API de WhatsApp Business</span>
            </div>
          </div>
          <button class="btn btn-o btn-sm" data-intg="WhatsApp Business">Configurar</button>
        </div>

        <div class="intg">
          <div class="intg-logo"><svg viewBox="0 0 24 24" fill="none" stroke="#1D6132" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2.4"/><path d="M2 10h20M6 15h4"/></svg></div>
          <div style="flex:1"><b>Sistecrédito</b>
            <p>Consulta automática del estado de las solicitudes de financiación. Hoy el seguimiento es manual desde el módulo de Financiación.</p>
            <div style="display:flex;gap:8px;margin-top:11px;flex-wrap:wrap">
              <span class="pill pill-neu">Pendiente de API de la entidad</span>
            </div>
          </div>
          <button class="btn btn-o btn-sm" disabled>No disponible</button>
        </div>

        <div class="intg">
          <div class="intg-logo"><svg viewBox="0 0 24 24" fill="none" stroke="#3ECF8E" stroke-width="1.8"><path d="M12 2 4 13h7l1 9 8-11h-7z"/></svg></div>
          <div style="flex:1"><b>Base de datos (Supabase)</b>
            <p>Almacenamiento permanente de clientes, vehículos, citas, caja y cartera. Cada cambio se guarda solo y se comparte entre los equipos.</p>
            <div style="display:flex;gap:8px;margin-top:11px;flex-wrap:wrap">
              <span class="pill pill-ok">Conectado · los datos se guardan automáticamente</span>
            </div>
          </div>
          <button class="btn btn-o btn-sm" disabled>Activo</button>
        </div>
      </div></div>`;
  bindIntg();

  /* CITAS */
  $('#avCitas').innerHTML = panelTable('Citas','Todas las citas agendadas, en cualquier estado.',
    `<div class="tbar">
      <input class="finput" id="fCitas" placeholder="Buscar placa o cliente...">
      <select class="finput" id="fCitasSt"><option value="">Todos los estados</option><option>Pendiente</option><option>Confirmada</option><option>Completada</option><option>Cancelada</option></select>
      <button class="btn btn-o btn-sm" data-exp="citas">Exportar</button></div>`,
    `<thead><tr><th>Fecha</th><th>Hora</th><th>Cliente</th><th>Placa</th><th>Tipo</th><th>Origen</th><th>Estado</th><th>Acciones</th></tr></thead>
     <tbody id="tbCitas"></tbody>`);
  drawCitas();
  $('#fCitas').addEventListener('input',drawCitas);
  $('#fCitasSt').addEventListener('change',drawCitas);

  /* CLIENTES */
  $('#avCli').innerHTML = panelTable('Clientes','Información de contacto, vehículos, cartera y financiación por cliente.',
    `<div class="tbar"><input class="finput" id="fCli" placeholder="Buscar nombre o documento...">
      <button class="btn btn-p btn-sm" id="btnNuevoCli">+ Nuevo cliente</button>
      <button class="btn btn-o btn-sm" data-exp="clientes">Exportar</button></div>`,
    `<thead><tr><th>Cliente</th><th>Documento</th><th>Contacto</th><th>Vehículos</th><th>Cartera</th><th>Financiación</th><th></th></tr></thead>
     <tbody id="tbCli"></tbody>`);
  drawCli(); $('#fCli').addEventListener('input',drawCli);
  $('#btnNuevoCli')?.addEventListener('click',()=>{
    modal('Registrar nuevo cliente','<p style="font-size:.86rem;color:var(--ink-2);margin-bottom:16px">El cliente podrá ingresar al <b>portal cliente</b> con su número de documento y la placa de su vehículo.</p>'+
      '<div class="fgrid">'+
      '<div><label class="flabel">Nombre completo *</label><input id="ncName" class="finput" placeholder="Nombre y apellido"></div>'+
      '<div><label class="flabel">Documento de identidad *</label><input id="ncDoc" class="finput" inputmode="numeric" placeholder="Cédula o NIT"></div>'+
      '<div><label class="flabel">Celular</label><input id="ncPhone" class="finput" inputmode="tel" placeholder="3XX XXX XXXX"></div>'+
      '<div><label class="flabel">Correo (opcional)</label><input id="ncEmail" class="finput" type="email" placeholder="correo@ejemplo.com"></div>'+
      '<div><label class="flabel">Placa del vehículo *</label><input id="ncPlate" class="finput mono" style="text-transform:uppercase" placeholder="ABC123 o ABC12D"></div>'+
      '<div><label class="flabel">Tipo de vehículo</label><select id="ncType" class="finput"><option value="">Detectar por placa</option><option value="automovil">Automóvil</option><option value="camioneta">Camioneta</option><option value="campero">Campero</option><option value="moto">Motocicleta</option><option value="taxi">Taxi</option><option value="electrico">Eléctrico</option><option value="hibrido">Híbrido</option></select></div>'+
      '<div style="grid-column:1/-1"><label class="flabel">Fecha de vencimiento de la revisión (si la conoce)</label><input id="ncDue" class="finput" type="date"></div>'+
      '</div>',
      '<button class="btn btn-o" data-mclose>Cancelar</button><button class="btn btn-p" id="ncSave">Registrar cliente</button>');
    $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
    $('#ncSave').addEventListener('click',()=>{
      const nm=$('#ncName').value.trim(), doc=$('#ncDoc').value.trim(), ph=$('#ncPhone').value.trim();
      const em=$('#ncEmail').value.trim(), pl=$('#ncPlate').value.trim().toUpperCase(), tp=$('#ncType').value;
      const due=$('#ncDue').value||null;
      if(!nm||!doc||!pl) return toast('Completa nombre, documento y placa');
      const cl = crearClientePortal(doc, nm, ph, em, pl, tp||null);
      if(cl && due){
        const v = DB.vehicles.find(x=>x.plate===pl);
        if(v) v.due = due;
      }
      closeModal();
    });
  });

  /* VEHÍCULOS */
  $('#avVeh').innerHTML = panelTable('Vehículos','Placa, propietario, historial y próximo vencimiento.',
    `<div class="tbar"><input class="finput" id="fVeh" placeholder="Buscar placa...">
      <select class="finput" id="fVehT"><option value="">Todos los tipos</option><option value="carro">Carro</option><option value="moto">Moto</option></select>
      <button class="btn btn-o btn-sm" data-exp="vehiculos">Exportar</button></div>`,
    `<thead><tr><th>Placa</th><th>Categoría</th><th>Propietario</th><th>Última revisión</th><th>Vence</th><th>Estado</th><th></th></tr></thead>
     <tbody id="tbVeh"></tbody>`);
  drawVeh(); $('#fVeh').addEventListener('input',drawVeh); $('#fVehT').addEventListener('change',drawVeh);

  /* VENCIMIENTOS */
  const soon=[...DB.vehicles].filter(v=>v.due).sort((a,b)=>daysTo(a.due)-daysTo(b.due));
  $('#avVenc').innerHTML = `
    <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
      ${kpi('Vencidas',DB.vehicles.filter(v=>v.due&&daysTo(v.due)<0).length,'alert','Requieren contacto inmediato','alert')}
      ${kpi('Vencen en 30 días',DB.vehicles.filter(v=>v.due&&daysTo(v.due)>=0&&daysTo(v.due)<=30).length,'bell','Enviar recordatorio','warn')}
      ${kpi('Recordatorios activos',DB.reminders.length,'chart',`${conv}% de conversión a cita`)}
    </div>
    ${panelTable('Control de vencimientos','Vehículos ordenados por proximidad de vencimiento.',
      `<div class="tbar"><button class="btn btn-o btn-sm" data-exp="vencimientos">Exportar</button></div>`,
      `<thead><tr><th>Placa</th><th>Propietario</th><th>Contacto</th><th>Vence</th><th>Estado</th><th>Acción</th></tr></thead>
       <tbody>${soon.map(v=>{const c=cliOf(v.clientId);return `<tr>
         <td><span class="plate">${v.plate}</span></td><td><b>${c.name}</b></td>
         <td class="num">${c.phone}</td><td>${fmtDate(v.due)}</td><td>${dueBadge(v.due)}</td>
         <td><a class="btn btn-o btn-xs" href="https://wa.me/57${c.phone}?text=${encodeURIComponent(`Hola ${c.name.split(' ')[0]}, te recordamos que la revisión técnico-mecánica de tu vehículo de placa ${v.plate} vence el ${fmtDate(v.due)}. Puedes agendar con nosotros al 321 356 6313.`)}" target="_blank" rel="noopener">Enviar aviso</a></td>
       </tr>`;}).join('')}</tbody>`)}
    ${panelTable('Recordatorios registrados','Solicitudes recibidas desde el sitio público.',
      `<div class="tbar"><button class="btn btn-o btn-sm" data-exp="recordatorios">Exportar</button></div>`,
      `<thead><tr><th>Nombre</th><th>Placa</th><th>Vence</th><th>Canal</th><th>Contacto</th><th>Convertido</th></tr></thead>
       <tbody>${DB.reminders.map(m=>`<tr><td><b>${m.name}</b></td><td><span class="plate">${m.plate}</span></td>
         <td>${fmtDate(m.due)}</td><td>${m.channel}</td><td class="num">${m.phone}</td>
         <td>${m.converted?'<span class="pill pill-ok">Sí</span>':'<span class="pill pill-neu">No</span>'}</td></tr>`).join('')}</tbody>`)}`;

  /* CARTERA */
  const carSorted=[...DB.cartera].sort((a,b)=>daysTo(a.due)-daysTo(b.due));
  $('#avCart').innerHTML = `
    <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
      ${kpi('Cartera total',COP(pend+mora),'money','Pendiente + vencida')}
      ${kpi('Vencida',COP(mora),'alert','Requiere gestión','alert')}
      ${kpi('Por vencer',COP(pend),'clock','Dentro del plazo','warn')}
      ${kpi('Tasa de mora',tasaMora+'%','chart','Sobre total facturado',tasaMora>25?'alert':'')}
    </div>
    ${panelTable('Cartera','Obligaciones por cliente, con antigüedad y estado.',
      `<div class="tbar"><select class="finput" id="fCart"><option value="">Todos los estados</option><option>Vencida</option><option>Pendiente</option><option>Pagada</option></select>
        <button class="btn btn-o btn-sm" data-exp="cartera">Exportar</button></div>`,
      `<thead><tr><th>Cliente</th><th>Concepto</th><th>Valor</th><th>Vence</th><th>Antigüedad</th><th>Estado</th><th>Acciones</th></tr></thead>
       <tbody id="tbCart"></tbody>`)}`;
  drawCart(); $('#fCart').addEventListener('change',drawCart);

  /* CRÉDITOS — solo generalidades, no seguimiento de cuotas ni mora (eso lo gestiona cada entidad) */
  $('#avFin').innerHTML = `
    <div class="note-box" style="margin-bottom:18px"><b>Qué hace esta sección</b>
      Aquí se sigue el crédito de principio a fin — cuánto se solicita, con qué entidad, cuánto tarda en desembolsarse y qué proyección de cartera de créditos se espera para los próximos meses. El seguimiento de cuotas y mora del crédito lo gestiona directamente la entidad financiera.</div>
    <div class="kpis" id="finKpis"></div>
    ${panelTable('Créditos por cliente','Sistecrédito y Addi — generalidades de cada solicitud.',
      `<div class="tbar"><select class="finput" id="fFin"><option value="">Todos los estados</option><option>Pendiente</option><option>Desembolsado</option><option>Rechazado</option></select>
        <button class="btn btn-o btn-sm" data-exp="financiacion">Exportar</button></div>`,
      `<thead><tr><th>Cliente</th><th>Entidad</th><th>Valor</th><th>Solicitud</th><th>Desembolso</th><th>Días</th><th>Día de pago</th><th>Estado</th><th></th></tr></thead>
       <tbody id="tbFin"></tbody>`)}`;
  drawFin(); $('#fFin').addEventListener('change',drawFin);

  /* EXPORTACIONES */
  $('#avExp').innerHTML = `
    <div class="panel"><div class="panel-h"><div><h3>Exportar a Excel</h3><p>Descarga los datos en formato CSV, compatible con Excel y LibreOffice.</p></div></div>
      <div class="panel-b"><div class="g3">
        ${['clientes','vehiculos','citas','revisiones','vencimientos','cartera','financiacion','recordatorios','indicadores'].map(k=>
          `<button class="card card-h" data-exp="${k}" style="text-align:left;cursor:pointer">
            <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v12M8 11l4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg></div>
            <h3 style="margin:13px 0 4px;text-transform:capitalize">${k}</h3>
            <p style="font-size:.83rem;color:var(--ink-3)">Descargar archivo .csv</p></button>`).join('')}
      </div></div></div>
    <div class="panel"><div class="panel-h"><div><h3>Exportaciones programadas</h3><p>Envío automático a destinatarios autorizados.</p></div></div>
      <div class="panel-b">
        <div class="cfg-row"><div><b>Frecuencia</b><small>Cada cuánto se genera el reporte</small></div>
          <select class="finput"><option>Diaria</option><option selected>Semanal</option><option>Mensual</option></select></div>
        <div class="cfg-row"><div><b>Destinatarios</b><small>Correos autorizados, separados por coma</small></div>
          <input class="finput" placeholder="correo@ejemplo.com" style="min-width:230px"></div>
        <div class="cfg-row"><div><b>Contenido</b><small>Qué se incluye en el envío</small></div>
          <select class="finput"><option>Indicadores + cartera</option><option>Todos los módulos</option><option>Solo citas</option></select></div>
        <div class="note-box" style="margin-top:14px"><b>Requiere backend</b>La programación automática se activa al conectar el servidor de correo. La descarga manual ya funciona.</div>
      </div></div>`;

  /* CONFIGURACIÓN */
  const t=DB.config.tarifas;
  $('#avCfg').innerHTML = `
    <div class="panel"><div class="panel-h"><div><h3>Tarifas de referencia interna</h3><p>El sitio público ya no muestra valores — el cliente siempre termina en WhatsApp. Estos campos son solo para que el equipo tenga la referencia a la mano al responder.</p></div></div>
      <div class="panel-b">
        <div class="note-box" style="margin-bottom:16px"><b>Por qué cambiamos esto</b>Publicar precios generaba confusión cuando variaban por modelo o cilindraje. Ahora el simulador de tarifas recopila el vehículo y el servicio, y entrega esa información lista dentro del mensaje de WhatsApp — la confirmación del valor la da siempre una persona.</div>
        <div class="cfg-row"><div><b>Carro · Revisión técnico-mecánica</b><small>Valor de referencia interna, no se publica</small></div>
          <input class="finput" id="tCarRtm" inputmode="numeric" value="${t.carro.rtm??''}" placeholder="Sin registrar"></div>
        <div class="cfg-row"><div><b>Carro · Reinspección</b><small>Valor de referencia interna, no se publica</small></div>
          <input class="finput" id="tCarRe" inputmode="numeric" value="${t.carro.reinsp??''}" placeholder="Sin registrar"></div>
        <div class="cfg-row"><div><b>Moto · Revisión técnico-mecánica</b><small>Valor de referencia interna, no se publica</small></div>
          <input class="finput" id="tMotRtm" inputmode="numeric" value="${t.moto.rtm??''}" placeholder="Sin registrar"></div>
        <div class="cfg-row"><div><b>Moto · Reinspección</b><small>Valor de referencia interna, no se publica</small></div>
          <input class="finput" id="tMotRe" inputmode="numeric" value="${t.moto.reinsp??''}" placeholder="Sin registrar"></div>
        <button class="btn btn-p" style="margin-top:16px" id="saveTar">Guardar referencia interna</button>
      </div></div>

    <div class="panel"><div class="panel-h"><div><h3>Datos de contacto y horarios</h3><p>Se reflejan en el sitio público y en el pie de página.</p></div></div>
      <div class="panel-b">
        <div class="cfg-row"><div><b>Dirección</b><small>Aparece en la sección Ubicación</small></div>
          <input class="finput" id="cfgAddr" value="${DB.config.direccion}" style="min-width:240px"></div>
        <div class="cfg-row"><div><b>Teléfono / WhatsApp</b><small>Número de contacto principal</small></div>
          <input class="finput" id="cfgTel" value="${DB.config.telefono}"></div>
        <div class="cfg-row"><div><b>Horario dominical</b><small>Texto mostrado en el sitio</small></div>
          <input class="finput" id="cfgHrs" value="${DB.config.horarioDom}" style="min-width:240px"></div>
        <button class="btn btn-p" style="margin-top:16px" id="saveCfg">Guardar cambios</button>
      </div></div>

    <div class="panel"><div class="panel-h"><div><h3>Recordatorios</h3><p>Días de anticipación con que se avisa al cliente.</p></div></div>
      <div class="panel-b">
        <div class="cfg-row"><div><b>Intervalos de aviso</b><small>Días antes del vencimiento, separados por coma</small></div>
          <input class="finput" id="cfgInt" value="${DB.config.intervalos.join(', ')}" style="min-width:200px"></div>
        <button class="btn btn-p" style="margin-top:16px" id="saveInt">Guardar intervalos</button>
      </div></div>

    <div class="panel"><div class="panel-h"><div><h3>Horarios de atención disponibles</h3><p>Turnos que se ofrecen en el agendamiento en línea.</p></div></div>
      <div class="panel-b">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
          ${DB.config.slots.map(s=>`<span class="pill pill-neu mono">${s}</span>`).join('')}</div>
        <input class="finput" id="cfgSlots" value="${DB.config.slots.join(', ')}" style="max-width:520px">
        <button class="btn btn-p" style="margin-top:14px;display:block" id="saveSlots">Actualizar turnos</button>
      </div></div>

    <div class="panel"><div class="panel-h"><div><h3>Usuarios y permisos</h3><p>Control de acceso al portal administrativo.</p></div></div>
      <div class="panel-b flush"><div class="tw"><table>
        <thead><tr><th>Usuario</th><th>Rol</th><th>Permisos</th><th>Estado</th></tr></thead>
        <tbody>
          <tr><td><b>admin</b><small>Administrador principal</small></td><td>Administrador</td><td>Acceso total</td><td><span class="pill pill-ok">Activo</span></td></tr>
          <tr><td><b>recepcion</b><small>Personal de recepción</small></td><td>Operativo</td><td>Citas y clientes</td><td><span class="pill pill-ok">Activo</span></td></tr>
          <tr><td><b>cartera</b><small>Gestión financiera</small></td><td>Financiero</td><td>Cartera y financiación</td><td><span class="pill pill-neu">Inactivo</span></td></tr>
        </tbody></table></div>
        <div style="padding:16px"><div class="note-box"><b>Requiere backend</b>La gestión real de usuarios, contraseñas y registro de acciones se habilita al conectar la base de datos.</div></div>
      </div></div>`;

  bindCfg(); bindExports(); bindWA(); bindNotifBells();
  renderFinanzas(); renderCaja(); renderUsuarios();
  renderGerencia(); renderMiAgenda(); renderPreventivas(); renderInformes();
}

/* ---------- CONTROL DE INASISTENCIAS ----------
   Reglas: si faltan ~60 min para la cita y no ha llegado, se avisa para contactar al cliente.
   Si ya pasó 60 min de la hora de la cita y nadie confirmó su llegada, se marca "Inasistente"
   automáticamente y se notifica a asesor, caja y cliente, cada uno en su propia vista. */
function apptDateTime(a){ return new Date(`${a.date}T${a.time}:00`); }
function checkNoShows(){
  const now = new Date();
  DB.appts.forEach(a=>{
    if(['Completada','Cancelada','Inasistente'].includes(a.status)) return;
    const t = apptDateTime(a);
    const diffMin = (now-t)/60000; // positivo = ya pasó la hora
    if(diffMin>=-70 && diffMin<=-50 && !a.notifiedBefore && !a.confirmedArrival){
      a.notifiedBefore = true;
      pushNotification({role:'staff', type:'noshow', sev:'warn',
        text:`Falta ~1 hora para la cita de ${a.name} (${a.plate}) a las ${a.time}. Confírmale para asegurar su asistencia.`});
    }
    if(diffMin>=60 && !a.confirmedArrival && a.status!=='Inasistente'){
      a.status='Inasistente'; a.notifiedAfter=true;
      pushNotification({role:'staff', type:'noshow', sev:'dan',
        text:`${a.name} (${a.plate}) no llegó a su cita de las ${a.time}. Reagenda o comunícate con el cliente.`});
      pushNotification({role:'client', clientId:a.clientId, type:'noshow', sev:'dan',
        text:`No pudimos confirmar tu llegada a la cita de las ${a.time}. Reagenda cuando quieras o escríbenos.`});
      logAct(`Inasistencia detectada · ${a.plate} · ${a.time}`);
    }
  });
  refreshBadges(); renderNotifBell();
}
setInterval(checkNoShows, 30000);

/* ---------- AGENDA / CALENDARIO ---------- */
let calRef = new Date(iso(today)+'T00:00:00');
let calView = 'semana';
let gcalOn = false;
const DIAS=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function weekStart(d){ const x=new Date(d); x.setDate(x.getDate()-x.getDay()); return x; }
function renderAgenda(){
  checkNoShows();
  const days = calView==='dia' ? [new Date(calRef)]
    : Array.from({length:7},(_,i)=>addDays(weekStart(calRef),i));
  const slots = DB.config.slots;
  const label = calView==='dia'
    ? `${DIAS[days[0].getDay()]} ${days[0].getDate()} de ${MESES[days[0].getMonth()]}`
    : `${days[0].getDate()} – ${days[6].getDate()} de ${MESES[days[6].getMonth()]} ${days[6].getFullYear()}`;

  const inView = DB.appts.filter(a=>days.some(d=>iso(d)===a.date));
  const conf = inView.filter(a=>a.status==='Confirmada').length;
  const pnd  = inView.filter(a=>a.status==='Pendiente').length;
  const noShow = inView.filter(a=>a.status==='Inasistente').length;
  const ocup = slots.length*days.length;

  let grid = `<div class="cal-grid" style="${calView==='dia'?'grid-template-columns:64px 1fr;min-width:auto':''}">
    <div class="cal-hcell"></div>`;
  days.forEach(d=>{
    const isT = iso(d)===iso(today);
    grid += `<div class="cal-hcell ${isT?'today':''}"><b>${DIAS[d.getDay()]}</b><span>${d.getDate()}/${d.getMonth()+1}</span></div>`;
  });
  slots.forEach(t=>{
    grid += `<div class="cal-tcell">${t}</div>`;
    days.forEach(d=>{
      const ds=iso(d);
      const evs=DB.appts.filter(a=>a.date===ds && a.time===t);
      grid += `<div class="cal-cell cal-cell-multi">`;
      evs.forEach(ev=>{
        const cls = ev.status==='Confirmada'?'ok':ev.status==='Pendiente'?'pend':ev.status==='Completada'?'done':ev.status==='Inasistente'?'noshow':'canc';
        const adv = ADVISORS.find(a=>a.id===ev.advisorId);
        grid += `<button class="cal-ev ${cls}" data-apst="${ev.id}">${ev.plate}${ev.confirmedArrival?' ✓':''}<small>${ev.name.split(' ')[0]}${adv?' · '+adv.name.split(' ')[0]:''}</small></button>`;
      });
      grid += `<button class="cal-free" data-new="${ds}|${t}">+ Agregar</button>`;
      grid += `</div>`;
    });
  });
  grid += `</div>`;

  $('#avAgenda').innerHTML = `
    <div class="kpis" style="grid-template-columns:repeat(5,1fr)">
      ${kpi('Citas en el periodo',inView.length,'cal',`${conf} confirmadas · ${pnd} sin confirmar`)}
      ${kpi('Sin confirmar',pnd,'alert','Requieren contacto',pnd?'warn':'')}
      ${kpi('Inasistencias',noShow,'alert','Sin llegada confirmada',noShow?'alert':'')}
      ${kpi('Ocupación',ocup?Math.round(inView.filter(a=>a.status!=='Cancelada').length/ocup*100)+'%':'0%','chart',`Sobre ${ocup} turnos disponibles`)}
      
    </div>
    <div class="panel">
      <div class="panel-h">
        <div><h3>Agenda comercial</h3><p>Turnos y citas del día. Puede haber varias personas en el mismo horario. Haz clic en una cita para gestionarla.</p></div>
        <div class="cal-nav">
          <div class="seg">
            <button data-calv="dia" class="${calView==='dia'?'on':''}">Día</button>
            <button data-calv="semana" class="${calView==='semana'?'on':''}">Semana</button>
          </div>
          <button class="iconbtn" data-calmv="-1" aria-label="Anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg></button>
          <button class="btn btn-o btn-xs" data-calmv="0">Hoy</button>
          <button class="iconbtn" data-calmv="1" aria-label="Siguiente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 18 6-6-6-6"/></svg></button>
        </div>
      </div>
      <div class="panel-b">
        <div class="cal-hd"><b class="dsp" style="font-size:1.02rem">${label.charAt(0).toUpperCase()+label.slice(1)}</b>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-o btn-sm" data-exp="citas">Exportar agenda</button>
            <button class="btn btn-p btn-sm" id="btnArqueo">📋 Arqueo diario</button>
          </div></div>
        <div class="cal-wrap">${grid}</div>
        <div class="legend">
          <span><i style="background:var(--green-700)"></i>Confirmada</span>
          <span><i style="background:var(--warn)"></i>Sin confirmar</span>
          <span><i style="background:var(--ink-3)"></i>Completada</span>
          <span><i style="background:var(--danger)"></i>Inasistente / Cancelada</span>
        </div>
        
      </div>
    </div>`;

  $$('[data-calv]').forEach(b=>b.addEventListener('click',()=>{calView=b.dataset.calv;renderAgenda();}));
  $$('[data-calmv]').forEach(b=>b.addEventListener('click',()=>{
    const n=+b.dataset.calmv;
    if(n===0) calRef=new Date(iso(today)+'T00:00:00');
    else calRef=addDays(calRef, n*(calView==='dia'?1:7));
    renderAgenda();
  }));
  $('#btnArqueo').addEventListener('click', openArqueoDiario);
  $$('[data-new]').forEach(b=>b.addEventListener('click',()=>{
    const [d,t]=b.dataset.new.split('|');
    modal('Registrar cita manual',`
      <p style="font-size:.88rem;color:var(--ink-2);margin-bottom:15px">Turno: <b>${fmtDate(d)} · ${t}</b></p>
      <div class="fgrid">
        <div><label class="flabel">Nombre del cliente</label><input id="nwName" class="finput" placeholder="Nombre y apellido"></div>
        <div><label class="flabel">Celular</label><input id="nwPhone" class="finput" inputmode="tel" placeholder="300 000 00 00"></div>
        <div><label class="flabel">Placa</label><input id="nwPlate" class="finput mono" maxlength="7" placeholder="ABC123" style="text-transform:uppercase"></div>
        <div><label class="flabel">Tipo</label><select id="nwType" class="finput">${Object.entries(VTREE).flatMap(([g,grp])=>grp.sub.map(s=>`<option value="${s.id}">${grp.label} · ${s.label}</option>`)).join('')}</select></div>
      </div>
      <div class="fgrid" style="margin-top:14px">
        <div><label class="flabel">Origen</label><select id="nwSrc" class="finput"><option>Llamada</option><option>WhatsApp</option><option>Presencial</option></select></div>
        <div><label class="flabel">Asesor (para comisión)</label><select id="nwAdv" class="finput"><option value="">Sin asignar</option>${ADVISORS.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select></div>
      </div>`,
      `<button class="btn btn-o" data-mclose>Cancelar</button><button class="btn btn-p" id="nwSave">Registrar cita</button>`);
    $('#nwSave').addEventListener('click',()=>{
      const nm=$('#nwName').value.trim(), ph=$('#nwPhone').value.trim(), pl=$('#nwPlate').value.trim().toUpperCase();
      if(nm.length<3||!/^\d{10}$/.test(ph)||!pl) return toast('Completa nombre, celular de 10 dígitos y placa');
      let cl=DB.clients.find(c=>c.phone===ph);
      if(!cl){ cl={id:uid('c'),doc:'',name:nm,phone:ph,email:'',notes:'Registrado desde la agenda.'}; DB.clients.push(cl); }
      if(!vehByPlate(pl)) DB.vehicles.push({id:uid('v'),plate:pl,type:$('#nwType').value,cat:vLabel($('#nwType').value),clientId:cl.id,due:null});
      DB.appts.push({id:uid('a'),clientId:cl.id,plate:pl,name:nm,phone:ph,email:'',
        type:$('#nwType').value,date:d,time:t,status:'Confirmada',source:$('#nwSrc').value,
        advisorId:$('#nwAdv').value||null,confirmedArrival:false,notifiedBefore:false,notifiedAfter:false,contacted:false});
      logAct(`Cita registrada desde la agenda · ${pl} · ${fmtDate(d)} ${t}`);
      trackAction('crear-cita');
      closeModal(); renderAdmin(); toast('Cita creada');
    });
    $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
  }));
  $$('#avAgenda [data-apst]').forEach(b=>b.addEventListener('click',()=>openApt(b.dataset.apst)));
  bindExports();
}

function openApt(id){
  const a=DB.appts.find(x=>x.id===id); if(!a) return;
  const adv = ADVISORS.find(x=>x.id===a.advisorId);
  modal('Gestionar cita',
    `<p style="font-size:.88rem;color:var(--ink-2);margin-bottom:10px"><b>${a.name}</b> · ${a.phone}<br>Placa ${a.plate} · ${fmtDate(a.date)} a las ${a.time}</p>
     ${a.status==='Inasistente'?'<div class="alertbar dan" style="margin-bottom:14px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg><div><b>Cita inasistida</b><p>Puedes reprogramarla con una nueva fecha y hora sin perder los datos del cliente.</p></div></div>':''}
     <div class="fgrid">
       <div><label class="flabel">Estado</label><select id="stSel" class="finput">${['Pendiente','Confirmada','Completada','Inasistente','Cancelada'].map(x=>`<option ${x===a.status?'selected':''}>${x}</option>`).join('')}</select></div>
       <div><label class="flabel">Asesor asignado</label><select id="stAdv" class="finput"><option value="">Sin asignar</option>${ADVISORS.map(x=>`<option value="${x.id}" ${x.id===a.advisorId?'selected':''}>${x.name}</option>`).join('')}</select></div>
       <div><label class="flabel">Fecha</label><input type="date" id="stDate" class="finput" value="${a.date}"></div>
       <div><label class="flabel">Hora</label><select id="stTime" class="finput">${DB.config.slots.map(x=>`<option ${x===a.time?'selected':''}>${x}</option>`).join('')}</select></div>
     </div>
     <label class="fchk" style="margin-top:14px"><input type="checkbox" id="stArr" ${a.confirmedArrival?'checked':''}><span>El cliente ya llegó al centro (confirmar llegada)</span></label>
     <label class="fchk" style="margin-top:8px"><input type="checkbox" id="stContact" ${a.contacted?'checked':''}><span>Ya se hizo contacto de seguimiento con el cliente</span></label>`,
    `<a class="btn btn-wa" href="https://wa.me/57${a.phone}?text=${encodeURIComponent(`Hola ${a.name.split(' ')[0]}, le escribimos de CDA Revitolima sobre su cita del ${fmtDate(a.date)} a las ${a.time}, placa ${a.plate}.`)}" target="_blank" rel="noopener">WhatsApp</a>
     <a class="btn btn-o" href="tel:${a.phone}">Llamar</a>
     <button class="btn btn-o" id="stDel" style="color:var(--danger);border-color:var(--danger)">Eliminar</button>
     <button class="btn btn-p" id="stSave">Guardar</button>`);
  $('#stSave').addEventListener('click',()=>{
    a.status=$('#stSel').value; a.date=$('#stDate').value; a.time=$('#stTime').value;
    a.advisorId=$('#stAdv').value||null; a.confirmedArrival=$('#stArr').checked; a.contacted=$('#stContact').checked;
    if(a.status==='Inasistente'){ a.notifiedAfter=true; }
    else { a.notifiedBefore=false; a.notifiedAfter=false; }
    if(a.status==='Completada'){
      const v=vehByPlate(a.plate);
      if(v && !DB.revisions.some(r=>r.vehicleId===v.id && r.date===a.date)){
        DB.revisions.push({id:uid('r'),vehicleId:v.id,date:a.date,result:'Aprobada',notes:'Registrada desde la agenda.'});
        v.due=iso(addDays(new Date(a.date+'T00:00:00'),365));
      }
      a.confirmedArrival=true;
    }
    logAct(`Cita actualizada · ${a.plate} → ${a.status}`);
    trackAction('editar-cita');
    closeModal(); renderAdmin();
    toast('Cita actualizada');
  });
  $('#stDel').addEventListener('click',()=>{
    modal('¿Eliminar esta cita?',`<p style="font-size:.9rem;color:var(--ink-2)">Se eliminará la cita de <b>${a.name}</b> del ${fmtDate(a.date)} a las ${a.time}. Esta acción no se puede deshacer.</p>`,
      `<button class="btn btn-o" data-mclose>Cancelar</button><button class="btn btn-p" id="delYes" style="background:var(--danger)">Sí, eliminar</button>`);
    $('#delYes').addEventListener('click',()=>{
      DB.appts = DB.appts.filter(x=>x.id!==a.id);
      logAct(`Cita eliminada · ${a.plate} · ${fmtDate(a.date)} ${a.time}`);
      trackAction('eliminar-cita');
      closeModal(); renderAdmin(); toast('Cita eliminada');
    });
    $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
  });
  $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
}

/* ---------- ARQUEO DIARIO (comisiones + asistencia) ---------- */
function computeArqueo(dateStr){
  const dayAppts = DB.appts.filter(a=>a.date===dateStr && a.status!=='Cancelada');
  const rows = ADVISORS.map(adv=>{
    const mine = dayAppts.filter(a=>a.advisorId===adv.id);
    const asistio = mine.filter(a=>a.confirmedArrival || a.status==='Completada');
    const noAsistio = mine.filter(a=>!a.confirmedArrival && a.status!=='Completada');
    return {adv, total:mine.length, asistio:asistio.length, noAsistio:noAsistio.length,
      comision: asistio.length*DB.config.comisionPorCita};
  });
  const sinAsesor = dayAppts.filter(a=>!a.advisorId);
  return {rows, sinAsesor, totalComision: rows.reduce((s,r)=>s+r.comision,0), dayAppts};
}
function openArqueoDiario(){
  const d = iso(today);
  const {rows, sinAsesor, totalComision} = computeArqueo(d);
  modal(`Arqueo diario · ${fmtDate(d)}`,`
    <div class="tw"><table>
      <thead><tr><th>Asesor</th><th>Citas</th><th>Asistieron</th><th>No asistieron</th><th>Comisión</th></tr></thead>
      <tbody>${rows.map(r=>`<tr><td><b>${r.adv.name}</b></td><td class="num">${r.total}</td>
        <td class="num" style="color:var(--green-700)">${r.asistio}</td>
        <td class="num" style="color:var(--danger)">${r.noAsistio}</td>
        <td class="num"><b>${COP(r.comision)}</b></td></tr>`).join('')}
      </tbody></table></div>
    ${sinAsesor.length?`<p style="font-size:.82rem;color:var(--ink-3);margin-top:10px">${sinAsesor.length} cita(s) sin asesor asignado, no generan comisión.</p>`:''}
    <div class="note-box" style="margin-top:16px"><b>Comisión por cita asistida:</b> ${COP(DB.config.comisionPorCita)} · Total del día: <b>${COP(totalComision)}</b></div>`,
    `<button class="btn btn-o" data-mclose>Cerrar</button><button class="btn btn-p" id="arqPdf">Descargar PDF</button>`);
  $('#arqPdf').addEventListener('click',()=>{ closeModal(); printArqueoPDF(d); });
  $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
}
function printArqueoPDF(dateStr){
  const {rows, totalComision, dayAppts} = computeArqueo(dateStr);
  const asistieron = dayAppts.filter(a=>a.confirmedArrival||a.status==='Completada').length;
  const noAsistieron = dayAppts.length - asistieron;
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Arqueo diario ${dateStr}</title>
  <style>
    @page{ size:letter; margin:26mm 20mm; }
    body{font-family:'Segoe UI',Arial,sans-serif;color:#15201A;margin:0}
    .hd{display:flex;align-items:center;gap:16px;border-bottom:3px solid #164A26;padding-bottom:18px;margin-bottom:26px}
    .hd img{height:52px}
    .hd h1{font-size:20px;color:#164A26;margin:0}
    .hd p{margin:2px 0 0;color:#6E786C;font-size:12px}
    .meta{display:flex;justify-content:space-between;margin-bottom:22px;font-size:13px;color:#3D473C}
    .kpis{display:flex;gap:14px;margin-bottom:26px}
    .kpi{flex:1;border:1px solid #E4E2D7;border-radius:10px;padding:14px;text-align:center}
    .kpi b{display:block;font-size:22px;color:#164A26}
    .kpi span{font-size:11px;color:#6E786C;text-transform:uppercase;letter-spacing:.04em}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{background:#EAF6EC;color:#164A26;text-align:left;padding:9px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.03em}
    td{padding:10px 12px;border-bottom:1px solid #EFEDE4;font-size:13px}
    tr:last-child td{border-bottom:none}
    .total-row td{font-weight:700;border-top:2px solid #164A26}
    .foot{margin-top:40px;padding-top:16px;border-top:1px solid #E4E2D7;font-size:11px;color:#8A8578;display:flex;justify-content:space-between}
    @media print{ .noprint{display:none} }
  </style></head><body>
    <div class="hd">
      <img data-logo src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="">
      <div><h1>Arqueo diario de agenda y comisiones</h1><p>CDA Revitolima · Ibagué, Tolima</p></div>
    </div>
    <div class="meta"><span><b>Fecha:</b> ${fmtDate(dateStr)}</span><span><b>Generado:</b> ${new Date().toLocaleString('es-CO')}</span></div>
    <div class="kpis">
      <div class="kpi"><b>${dayAppts.length}</b><span>Citas del día</span></div>
      <div class="kpi"><b>${asistieron}</b><span>Asistieron</span></div>
      <div class="kpi"><b>${noAsistieron}</b><span>No asistieron</span></div>
      <div class="kpi"><b>${COP(totalComision)}</b><span>Comisión total</span></div>
    </div>
    <table><thead><tr><th>Asesor</th><th>Citas asignadas</th><th>Asistieron</th><th>No asistieron</th><th>Comisión</th></tr></thead>
      <tbody>
        ${rows.map(r=>`<tr><td>${r.adv.name}</td><td>${r.total}</td><td>${r.asistio}</td><td>${r.noAsistio}</td><td>${COP(r.comision)}</td></tr>`).join('')}
        <tr class="total-row"><td colspan="4">Total comisión del día</td><td>${COP(totalComision)}</td></tr>
      </tbody></table>
    <div class="foot"><span>CDA Revitolima — Documento de uso interno</span><span>PubliSell NeuroMarketing Studio</span></div>
    <script>window.onload=()=>window.print();<\/script>
  </body></html>`);
  win.document.close();
}

/* ---------- AGENDA / CALENDARIO ---------- */

function bindIntg(){
  $$('[data-intg]').forEach(b=>b.addEventListener('click',()=>{
    const n=b.dataset.intg;
    const info={
      'WhatsApp Business':'Requiere una cuenta de WhatsApp Business API (a través de Meta o un proveedor como Twilio o 360dialog) y plantillas de mensaje aprobadas por Meta. Con eso, el sistema envía confirmaciones y recordatorios sin intervención manual.'
    }[n]||'';
    modal(n,`<p style="font-size:.9rem;color:var(--ink-2)">${info}</p>`,`<button class="btn btn-p" data-mclose>Entendido</button>`);
    $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
  }));
}

/* ---------- GENERADOR DE DOCUMENTOS PDF CON MARCA CDA ---------- */
const DOC_PREFIX = {general:'IG', finanzas:'IF', creditos:'IC', equipo:'IE',
  comisiones:'AC', agenda:'IA', preventivas:'IP', vencimientos:'IV', clientes:'IB', arqueo:'AQ'};
let docSeq = 1;
function docRef(tipo){
  const d=new Date();
  const ymd=String(d.getFullYear()).slice(2)+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
  return `${DOC_PREFIX[tipo]||'DC'}-${ymd}-${String(docSeq++).padStart(4,'0')}`;
}
function docShell({titulo, subtitulo, ref, kpis=[], secciones=[]}){
  const logo = (typeof LOGO_SRC!=='undefined') ? LOGO_SRC : 'assets/logo.png';
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${titulo}</title>
  <style>
    @page{size:letter;margin:22mm 18mm}
    *{box-sizing:border-box}
    body{font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#15201A;margin:0;font-size:12px}
    .hd{display:flex;align-items:flex-start;gap:18px;border-bottom:3px solid #164A26;padding-bottom:16px;margin-bottom:8px}
    .hd img{height:56px;object-fit:contain}
    .hd-txt{flex:1}
    .hd-txt h1{font-size:19px;color:#0F3319;margin:0 0 3px}
    .hd-txt .sub{font-size:12px;color:#4B564F;margin:0}
    .hd-org{text-align:right;font-size:10px;color:#6E786C;line-height:1.6}
    .hd-org b{display:block;color:#0F3319;font-size:12px}
    .refbar{display:flex;justify-content:space-between;background:#EAF6EC;border-radius:6px;
      padding:8px 12px;font-size:10.5px;color:#164A26;margin-bottom:20px}
    .refbar b{font-family:'Courier New',monospace}
    .kpis{display:flex;gap:10px;margin-bottom:22px}
    .kpi{flex:1;border:1px solid #E4E2D7;border-radius:8px;padding:12px;text-align:center;background:#FAFAF8}
    .kpi b{display:block;font-size:19px;color:#164A26;margin-bottom:2px}
    .kpi span{font-size:9px;color:#6E786C;text-transform:uppercase;letter-spacing:.04em}
    .kpi.win{background:#EAF6EC;border-color:#46B446}
    .kpi.win b{color:#1D6132;font-size:22px}
    h2{font-size:13px;color:#0F3319;margin:22px 0 8px;padding-bottom:5px;border-bottom:1.5px solid #EAF6EC}
    table{width:100%;border-collapse:collapse;margin-bottom:14px}
    th{background:#164A26;color:#fff;text-align:left;padding:8px 10px;font-size:9.5px;
      text-transform:uppercase;letter-spacing:.04em;font-weight:600}
    td{padding:8px 10px;border-bottom:1px solid #EFEDE4;font-size:11px}
    tr:nth-child(even) td{background:#FAFAF8}
    .num{text-align:right;font-family:'Courier New',monospace}
    .tot td{background:#EAF6EC!important;font-weight:700;border-top:2px solid #164A26;font-size:12px}
    .win-val{color:#1D6132;font-weight:800;font-size:14px}
    .note{background:#FFF6E0;border-left:3px solid #FAC800;padding:10px 13px;font-size:10.5px;
      color:#7A5A00;border-radius:0 6px 6px 0;margin-bottom:14px}
    .bars{margin:10px 0 18px}
    .bar-row{display:flex;align-items:center;gap:10px;margin-bottom:7px;font-size:10.5px}
    .bar-lbl{width:95px;flex-shrink:0}
    .bar-track{flex:1;height:16px;background:#EFEDE4;border-radius:4px;overflow:hidden}
    .bar-fill{height:100%;background:#46B446}
    .bar-val{width:80px;text-align:right;font-family:'Courier New',monospace;font-weight:700}
    .ft{margin-top:30px;padding-top:12px;border-top:1px solid #E4E2D7;font-size:9px;color:#8A8578;
      display:flex;justify-content:space-between}
  </style></head><body>
    <div class="hd">
      <img src="${logo}" alt="">
      <div class="hd-txt"><h1>${titulo}</h1><p class="sub">${subtitulo||''}</p></div>
      <div class="hd-org"><b>CDA REVITOLIMA</b>NIT 901.841.056-1<br>Calle 111 #20-25 Sur<br>Ibagué, Tolima<br>Tel. 321 356 6313</div>
    </div>
    <div class="refbar">
      <span>Documento N° <b>${ref}</b></span>
      <span>Generado: <b>${new Date().toLocaleString('es-CO')}</b></span>
      <span>Por: <b>${currentUser?currentUser.name:'—'}</b></span>
    </div>
    ${kpis.length?`<div class="kpis">${kpis.map(k=>`<div class="kpi ${k.win?'win':''}"><b>${k.v}</b><span>${k.l}</span></div>`).join('')}</div>`:''}
    ${secciones.join('')}
    <div class="ft"><span>CDA REVITOLIMA · NIT 901.841.056-1 · Documento de uso interno</span><span>${ref}</span></div>
    <script>window.onload=()=>window.print();<\/script>
  </body></html>`;
}
function openDoc(html){
  const w=window.open('','_blank');
  if(!w) return toast('Permite las ventanas emergentes para generar el PDF');
  w.document.write(html); w.document.close();
}
function barChart(rows,max){
  return `<div class="bars">${rows.map(r=>`<div class="bar-row">
    <span class="bar-lbl">${r.l}</span>
    <span class="bar-track"><span class="bar-fill" style="width:${max?Math.round(r.v/max*100):0}%;${r.color?'background:'+r.color:''}"></span></span>
    <span class="bar-val">${r.txt||r.v}</span></div>`).join('')}</div>`;
}

function generarInformePDF(tipo){
  const ref=docRef(tipo);
  const hoy=iso(today);
  const maxM=Math.max(...DB.monthly,1);
  let cfg={};

  if(tipo==='comisiones'){
    const {rows,totalComision,dayAppts}=computeArqueo(hoy);
    const asist=dayAppts.filter(a=>a.confirmedArrival||a.status==='Completada');
    cfg={titulo:'Arqueo de comisiones', subtitulo:`Corte del ${fmtDate(hoy)}`, ref,
      kpis:[{l:'Citas del día',v:dayAppts.length},{l:'Asistieron',v:asist.length},
            {l:'No asistieron',v:dayAppts.length-asist.length},{l:'Comisión total',v:COP(totalComision),win:totalComision>0}],
      secciones:[
        `<div class="note"><b>Regla de comisión vigente:</b> ${COP(DB.config.comisionPorCita)} por vehículo, aplicable únicamente a partir del vehículo N° ${DB.config.metaMensualVehiculos} del mes. Los contadores se reinician el día 1 de cada mes.</div>`,
        `<h2>Detalle por asesor</h2><table><thead><tr><th>Asesor</th><th class="num">Mes acumulado</th><th class="num">Meta</th><th>Estado</th><th class="num">Comisión</th></tr></thead><tbody>
          ${ADVISORS.map(a=>{const st=advisorMonthStats(a.id);
            return `<tr><td>${a.name}</td><td class="num">${st.total}</td><td class="num">${st.meta}</td>
              <td>${st.metaAlcanzada?'<span style="color:#1D6132;font-weight:700">✔ Meta cumplida — ya comisiona</span>':'En progreso — aún no comisiona'}</td>
              <td class="num ${st.metaAlcanzada?'win-val':''}">${COP(st.comision)}</td></tr>`;}).join('')}
          <tr class="tot"><td colspan="4">Total comisión del día</td><td class="num">${COP(totalComision)}</td></tr>
        </tbody></table>`,
        `<h2>Citas del día</h2><table><thead><tr><th>Hora</th><th>Cliente</th><th>Documento</th><th>Placa</th><th>Asesor</th><th>Asistencia</th></tr></thead><tbody>
          ${dayAppts.length?dayAppts.sort((a,b)=>a.time<b.time?-1:1).map(a=>{const c=cliOf(a.clientId);const adv=ADVISORS.find(x=>x.id===a.advisorId);
            const ok=a.confirmedArrival||a.status==='Completada';
            return `<tr><td>${a.time}</td><td>${a.name}</td><td>${c.doc||'—'}</td><td>${a.plate}</td>
              <td>${adv?adv.name:'—'}</td><td>${ok?'<span style="color:#1D6132;font-weight:700">✔ Asistió</span>':'✕ No asistió'}</td></tr>`;}).join('')
            :'<tr><td colspan="6">Sin citas registradas para esta fecha.</td></tr>'}
        </tbody></table>`]};
  }
  else if(tipo==='general'){
    const desemb=DB.credits.filter(f=>f.status==='Desembolsado').reduce((s,f)=>s+f.amount,0);
    const tramite=DB.credits.filter(f=>f.status==='Pendiente').reduce((s,f)=>s+f.amount,0);
    const ing=DB.cashLedger.filter(l=>l.type==='ingreso').reduce((s,l)=>s+l.amount,0);
    cfg={titulo:'Informe general consolidado', subtitulo:'Visión integral de todas las áreas', ref,
      kpis:[{l:'Clientes',v:DB.clients.length},{l:'Vehículos',v:DB.vehicles.length},
            {l:'Citas totales',v:DB.appts.length},{l:'Desembolsado',v:COP(desemb),win:true}],
      secciones:[
        `<h2>Volumen de revisiones · últimos 6 meses</h2>`+
        barChart(DB.monthly.map((v,i)=>({l:['Marzo','Abril','Mayo','Junio','Julio','Agosto'][i],v,txt:v+' rev.'})),maxM),
        `<h2>Resumen financiero</h2><table><tbody>
          <tr><td>Ingresos registrados en caja</td><td class="num">${COP(ing)}</td></tr>
          <tr><td>Créditos desembolsados (histórico)</td><td class="num">${COP(desemb)}</td></tr>
          <tr><td>Dinero en trámite con entidades</td><td class="num">${COP(tramite)}</td></tr>
          <tr class="tot"><td>Total movilizado</td><td class="num">${COP(ing+desemb)}</td></tr>
        </tbody></table>`,
        `<h2>Operación</h2><table><thead><tr><th>Indicador</th><th class="num">Valor</th></tr></thead><tbody>
          <tr><td>Citas completadas</td><td class="num">${DB.appts.filter(a=>a.status==='Completada').length}</td></tr>
          <tr><td>Inasistencias</td><td class="num">${DB.appts.filter(a=>a.status==='Inasistente').length}</td></tr>
          <tr><td>Vehículos por vencer (30 días)</td><td class="num">${DB.vehicles.filter(v=>v.due&&daysTo(v.due)>=0&&daysTo(v.due)<=30).length}</td></tr>
          <tr><td>Bonos preventivos emitidos</td><td class="num">${DB.reminders.filter(m=>m.giftCode).length}</td></tr>
        </tbody></table>`]};
  }
  else if(tipo==='creditos'){
    const trSis=DB.credits.filter(f=>f.status==='Pendiente'&&f.entidad==='Sistecrédito').reduce((s,f)=>s+f.amount,0);
    const trAddi=DB.credits.filter(f=>f.status==='Pendiente'&&f.entidad==='Addi').reduce((s,f)=>s+f.amount,0);
    cfg={titulo:'Cartera de créditos', subtitulo:'Dinero en trámite y desembolsos por entidad', ref,
      kpis:[{l:'En trámite Sistecrédito',v:COP(trSis)},{l:'En trámite Addi',v:COP(trAddi)},
            {l:'Total retenido',v:COP(trSis+trAddi)},{l:'Desembolsado',v:COP(DB.credits.filter(f=>f.status==='Desembolsado').reduce((s,f)=>s+f.amount,0)),win:true}],
      secciones:[
        `<div class="note">El CDA no realiza seguimiento de cuotas ni mora: eso corresponde a cada entidad financiera. Este informe controla únicamente el <b>tiempo de desembolso</b> y el dinero retenido en canje.</div>`,
        `<h2>Detalle por cliente</h2><table><thead><tr><th>Cliente</th><th>Entidad</th><th class="num">Valor</th><th>Solicitud</th><th>Desembolso</th><th>Estado</th></tr></thead><tbody>
          ${DB.credits.map(f=>{const c=cliOf(f.clientId);
            return `<tr><td>${c.name}</td><td>${f.entidad}</td><td class="num">${COP(f.amount)}</td>
              <td>${fmtDate(f.dateSolicitud)}</td><td>${f.dateDesembolso?fmtDate(f.dateDesembolso):'Pendiente'}</td><td>${f.status}</td></tr>`;}).join('')}
        </tbody></table>`]};
  }
  else if(tipo==='equipo'){
    cfg={titulo:'Desempeño del equipo', subtitulo:'Productividad y cumplimiento de meta mensual', ref,
      kpis:ADVISORS.map(a=>{const st=advisorMonthStats(a.id);
        return {l:a.name.split(' ')[0],v:`${st.total}/${st.meta}`,win:st.metaAlcanzada};}),
      secciones:[
        `<div class="note"><b>Meta mensual:</b> ${DB.config.metaMensualVehiculos} vehículos por asesor. La comisión de ${COP(DB.config.comisionPorCita)} por vehículo empieza a sumar únicamente al superar la meta. Reinicio automático el día 1 de cada mes.</div>`,
        `<h2>Avance por asesor</h2>`+
        barChart(ADVISORS.map(a=>{const st=advisorMonthStats(a.id);
          return {l:a.name.split(' ')[0],v:st.total,txt:`${st.total}/${st.meta}`,color:st.metaAlcanzada?'#1D6132':'#FAC800'};}),DB.config.metaMensualVehiculos),
        `<table><thead><tr><th>Asesor</th><th class="num">Atendidos</th><th class="num">Meta</th><th>Estado</th><th class="num">Comisión</th></tr></thead><tbody>
          ${ADVISORS.map(a=>{const st=advisorMonthStats(a.id);
            return `<tr><td>${a.name}</td><td class="num">${st.total}</td><td class="num">${st.meta}</td>
              <td>${st.metaAlcanzada?'<span style="color:#1D6132;font-weight:700">✔ Comisionando</span>':'Sin comisión aún'}</td>
              <td class="num ${st.metaAlcanzada?'win-val':''}">${COP(st.comision)}</td></tr>`;}).join('')}
        </tbody></table>`]};
  }
  else if(tipo==='preventivas'){
    const bonos=DB.reminders.filter(m=>m.giftCode);
    cfg={titulo:'Bonos de revisión preventiva', subtitulo:'Emitidos, redimidos y pendientes', ref,
      kpis:[{l:'Emitidos',v:bonos.length},{l:'Redimidos',v:bonos.filter(m=>m.giftClaimed).length,win:true},
            {l:'Pendientes',v:bonos.filter(m=>!m.giftClaimed).length},
            {l:'Conversión',v:(bonos.length?Math.round(bonos.filter(m=>m.giftClaimed).length/bonos.length*100):0)+'%'}],
      secciones:[`<h2>Detalle de bonos</h2><table><thead><tr><th>Código</th><th>Cliente</th><th>Placa</th><th>Contacto</th><th>Estado</th></tr></thead><tbody>
        ${bonos.length?bonos.map(m=>`<tr><td>${m.giftCode}</td><td>${m.name}</td><td>${m.plate}</td><td>${m.phone}</td>
          <td>${m.giftClaimed?'<span style="color:#1D6132;font-weight:700">✔ Redimido</span>':'Pendiente'}</td></tr>`).join('')
          :'<tr><td colspan="5">Sin bonos emitidos.</td></tr>'}</tbody></table>`]};
  }
  else if(tipo==='agenda'){
    const comp=DB.appts.filter(a=>a.status==='Completada').length;
    const ina=DB.appts.filter(a=>a.status==='Inasistente').length;
    cfg={titulo:'Informe de agenda', subtitulo:'Citas, asistencias e inasistencias', ref,
      kpis:[{l:'Total citas',v:DB.appts.length},{l:'Completadas',v:comp,win:true},
            {l:'Inasistencias',v:ina},{l:'Efectividad',v:(DB.appts.length?Math.round(comp/DB.appts.length*100):0)+'%'}],
      secciones:[`<h2>Listado de citas</h2><table><thead><tr><th>Fecha</th><th>Hora</th><th>Cliente</th><th>Placa</th><th>Estado</th></tr></thead><tbody>
        ${[...DB.appts].sort((a,b)=>a.date<b.date?1:-1).slice(0,40).map(a=>
          `<tr><td>${fmtDate(a.date)}</td><td>${a.time}</td><td>${a.name}</td><td>${a.plate}</td><td>${a.status}</td></tr>`).join('')}
      </tbody></table>`]};
  }
  else if(tipo==='vencimientos'){
    const prox=DB.vehicles.filter(v=>v.due).sort((a,b)=>daysTo(a.due)-daysTo(b.due));
    cfg={titulo:'Próximos vencimientos', subtitulo:'Oportunidades de gestión comercial', ref,
      kpis:[{l:'Vencidos',v:prox.filter(v=>daysTo(v.due)<0).length},
            {l:'Vencen en 30 días',v:prox.filter(v=>daysTo(v.due)>=0&&daysTo(v.due)<=30).length},
            {l:'Vigentes',v:prox.filter(v=>daysTo(v.due)>30).length,win:true},
            {l:'Total',v:prox.length}],
      secciones:[`<h2>Detalle</h2><table><thead><tr><th>Placa</th><th>Propietario</th><th>Contacto</th><th>Vence</th><th class="num">Días</th></tr></thead><tbody>
        ${prox.map(v=>{const c=cliOf(v.clientId);const d=daysTo(v.due);
          return `<tr><td>${v.plate}</td><td>${c.name}</td><td>${c.phone}</td><td>${fmtDate(v.due)}</td>
            <td class="num" style="${d<0?'color:#C0392B;font-weight:700':''}">${d}</td></tr>`;}).join('')}
      </tbody></table>`]};
  }
  else if(tipo==='clientes'){
    cfg={titulo:'Base de clientes', subtitulo:'Clientes y vehículos registrados', ref,
      kpis:[{l:'Clientes',v:DB.clients.length},{l:'Vehículos',v:DB.vehicles.length}],
      secciones:[`<h2>Listado</h2><table><thead><tr><th>Cliente</th><th>Documento</th><th>Contacto</th><th>Vehículos</th></tr></thead><tbody>
        ${DB.clients.map(c=>`<tr><td>${c.name}</td><td>${c.doc||'—'}</td><td>${c.phone}</td>
          <td>${DB.vehicles.filter(v=>v.clientId===c.id).map(v=>v.plate).join(', ')||'—'}</td></tr>`).join('')}
      </tbody></table>`]};
  }
  else { // finanzas
    const ing=DB.cashLedger.filter(l=>l.type==='ingreso').reduce((s,l)=>s+l.amount,0);
    const egr=DB.cashLedger.filter(l=>l.type==='egreso').reduce((s,l)=>s+l.amount,0);
    cfg={titulo:'Informe financiero', subtitulo:'Flujo de caja y movimientos', ref,
      kpis:[{l:'Ingresos',v:COP(ing),win:true},{l:'Egresos',v:COP(egr)},
            {l:'Balance',v:COP(ing-egr)},{l:'Movimientos',v:DB.cashLedger.length}],
      secciones:[
        `<h2>Saldo por cuenta</h2><table><thead><tr><th>Cuenta</th><th class="num">Saldo</th></tr></thead><tbody>
          ${DB.bankAccounts.map(a=>`<tr><td>${a.name}</td><td class="num">${COP(a.balance)}</td></tr>`).join('')}
          <tr class="tot"><td>Total</td><td class="num">${COP(DB.bankAccounts.reduce((s,a)=>s+a.balance,0))}</td></tr>
        </tbody></table>`,
        `<h2>Últimos movimientos</h2><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Tipo</th><th class="num">Valor</th></tr></thead><tbody>
          ${DB.cashLedger.length?DB.cashLedger.slice(0,25).map(l=>
            `<tr><td>${fmtDate(l.date)}</td><td>${l.concept}</td><td>${l.type}</td><td class="num">${COP(l.amount)}</td></tr>`).join('')
            :'<tr><td colspan="4">Sin movimientos registrados.</td></tr>'}
        </tbody></table>`]};
  }
  logAct(`Informe generado · ${cfg.titulo} · ${ref}`);
  trackAction('generar-informe');
  openDoc(docShell(cfg));
  toast(`Generando ${cfg.titulo}...`);
}

/* ═══════ INFORMES CON PERMISOS POR PERFIL ═══════ */
const REPORTS = [
  {id:'general',   t:'Informe general consolidado', d:'Todas las áreas: operación, finanzas, cartera y comisiones.', roles:['superusuario','superadministrador'], nivel:'Gerencial'},
  {id:'finanzas',  t:'Informe financiero',          d:'Flujo de caja, ingresos por cuenta y proyección.',            roles:['superusuario','superadministrador'], nivel:'Gerencial'},
  {id:'creditos',  t:'Cartera de créditos',         d:'Dinero en trámite por entidad y desembolsos.',                roles:['superusuario','superadministrador'], nivel:'Gerencial'},
  {id:'equipo',    t:'Desempeño del equipo',        d:'Productividad por asesor y cumplimiento de meta.',            roles:['superusuario','superadministrador'], nivel:'Gerencial'},
  {id:'comisiones',t:'Arqueo de comisiones',        d:'Citas asistidas y comisión del periodo.',                     roles:['superusuario','superadministrador','administrador','asesor'], nivel:'Operativo'},
  {id:'agenda',    t:'Informe de agenda',           d:'Citas agendadas, asistencias e inasistencias.',               roles:['superusuario','superadministrador','administrador','asesor'], nivel:'Operativo'},
  {id:'preventivas',t:'Bonos preventivos',          d:'Bonos emitidos, redimidos y pendientes.',                     roles:['superusuario','superadministrador','administrador','asesor'], nivel:'Operativo'},
  {id:'vencimientos',t:'Próximos vencimientos',     d:'Vehículos por vencer, para gestión comercial.',               roles:['superusuario','superadministrador','administrador','asesor'], nivel:'Operativo'},
  {id:'clientes',  t:'Base de clientes',            d:'Clientes y vehículos registrados.',                           roles:['superusuario','superadministrador','administrador'], nivel:'Operativo'}
];
function renderInformes(){
  const el=$('#avInformes'); if(!el||!currentUser) return;
  const rol=currentUser.role;
  const mios=REPORTS.filter(r=>r.roles.includes(rol));
  const ger=mios.filter(r=>r.nivel==='Gerencial');
  const ope=mios.filter(r=>r.nivel==='Operativo');
  const bloqueados=REPORTS.filter(r=>!r.roles.includes(rol));
  const card=r=>`<div class="rep-card">
      <div class="rep-ico">${r.nivel==='Gerencial'?'📊':'📋'}</div>
      <div style="flex:1"><b>${r.t}</b><p>${r.d}</p></div>
      <button class="btn btn-soft-green btn-xs" data-rep="${r.id}">Generar PDF</button>
    </div>`;
  el.innerHTML=`
    <div class="note-box" style="margin-bottom:18px"><b>Informes disponibles para tu perfil</b>
      Estás viendo los informes habilitados para <b>${ROLES[rol].label}</b>. La información sensible de otras áreas queda protegida.</div>
    ${ger.length?`<div class="panel"><div class="panel-h"><div><h3>📊 Informes gerenciales</h3><p>Visión consolidada del negocio</p></div></div>
      <div class="panel-b">${ger.map(card).join('')}</div></div>`:''}
    ${ope.length?`<div class="panel"><div class="panel-h"><div><h3>📋 Informes operativos</h3><p>Del día a día de tu gestión</p></div></div>
      <div class="panel-b">${ope.map(card).join('')}</div></div>`:''}
    ${bloqueados.length?`<div class="panel"><div class="panel-h"><div><h3>🔒 No disponibles para tu perfil</h3><p>Requieren permisos de gerencia</p></div></div>
      <div class="panel-b">${bloqueados.map(r=>`<div class="rep-card rep-lock"><div class="rep-ico">🔒</div>
        <div style="flex:1"><b>${r.t}</b><p>Solo para superusuario y superadministrador.</p></div></div>`).join('')}</div></div>`:''}`;
  $$('[data-rep]').forEach(b=>b.addEventListener('click',()=>generarInformePDF(b.dataset.rep)));
}

/* ═══════ VISTA 1: PANEL GERENCIAL (superusuario / superadministrador) ═══════ */
function renderGerencia(){
  const el=$('#avGerencia'); if(!el) return;
  const hoy=iso(today);
  const citasHoy=DB.appts.filter(a=>a.date===hoy&&a.status!=='Cancelada');
  const asist=citasHoy.filter(a=>a.confirmedArrival||a.status==='Completada').length;
  const mesRev=DB.revisions.filter(r=>new Date(r.date).getMonth()===today.getMonth()).length;
  const {totalComision}=computeArqueo(hoy);
  const desemb=DB.credits.filter(f=>f.status==='Desembolsado').reduce((s,f)=>s+f.amount,0);
  const tramite=DB.credits.filter(f=>f.status==='Pendiente').reduce((s,f)=>s+f.amount,0);
  const trSis=DB.credits.filter(f=>f.status==='Pendiente'&&f.entidad==='Sistecrédito').reduce((s,f)=>s+f.amount,0);
  const trAddi=DB.credits.filter(f=>f.status==='Pendiente'&&f.entidad==='Addi').reduce((s,f)=>s+f.amount,0);
  const conv=DB.reminders.length?Math.round(DB.reminders.filter(m=>m.converted).length/DB.reminders.length*100):0;
  const maxM=Math.max(...DB.monthly,1);

  el.innerHTML=`
    <div class="ger-hero">
      <div><span class="ger-eyebrow">${ROLES[currentUser.role].label}</span>
        <h2 class="dsp">Buen día, ${currentUser.name.split(' ')[0]}</h2>
        <p>Vista consolidada de todas las áreas · ${fmtDate(hoy)}</p></div>
      <div class="ger-hero-kpi"><span>Citas hoy</span><b>${citasHoy.length}</b></div>
      <div class="ger-hero-kpi"><span>Asistieron</span><b>${asist}</b></div>
      <div class="ger-hero-kpi"><span>Revisiones del mes</span><b>${mesRev}</b></div>
    </div>

    <div class="g2" style="align-items:start">
      <div class="panel" style="margin:0"><div class="panel-h"><div><h3>Volumen de revisiones</h3><p>Últimos 6 meses</p></div></div>
        <div class="panel-b"><div class="chart">${DB.monthly.map((v,i)=>`
          <div class="chart-b"><b>${v}</b><div class="chart-bw"><i style="height:${Math.round(v/maxM*100)}%"></i></div>
          <span>${['Mar','Abr','May','Jun','Jul','Ago'][i]}</span></div>`).join('')}</div></div></div>

      <div class="panel" style="margin:0"><div class="panel-h"><div><h3>Dinero en trámite con entidades</h3><p>Aún no desembolsado</p></div></div>
        <div class="panel-b">
          <div class="ger-bar-row"><span>Sistecrédito</span><b>${COP(trSis)}</b></div>
          <div class="bar"><i style="width:${tramite?Math.round(trSis/tramite*100):0}%;background:var(--green-500)"></i></div>
          <div class="ger-bar-row" style="margin-top:14px"><span>Addi</span><b>${COP(trAddi)}</b></div>
          <div class="bar"><i style="width:${tramite?Math.round(trAddi/tramite*100):0}%;background:var(--gold)"></i></div>
          <div class="ger-total"><span>Total retenido en canje</span><b>${COP(tramite)}</b></div>
        </div></div>
    </div>

    <div class="kpis" style="margin-top:20px">
      ${kpi('Desembolsado histórico',COP(desemb),'money','Créditos ya girados')}
      ${kpi('Comisiones de hoy',COP(totalComision),'chart','Por citas asistidas')}
      ${kpi('Conversión de recordatorios',conv+'%','bell','Agendaron y vinieron')}
      ${kpi('Vencen en 30 días',DB.vehicles.filter(v=>v.due&&daysTo(v.due)>=0&&daysTo(v.due)<=30).length,'clock','Oportunidad comercial','warn')}
    </div>

    <div class="panel"><div class="panel-h"><div><h3>Desempeño por asesor</h3><p>Mes en curso · meta ${DB.config.metaMensualVehiculos} vehículos</p></div></div>
      <div class="panel-b">${ADVISORS.map(a=>{
        const c=advisorMonthStats(a.id);
        const pct=Math.min(100,Math.round(c.total/DB.config.metaMensualVehiculos*100));
        return `<div class="ger-adv">
          <div class="ger-adv-hd"><b>${a.name}</b>
            <span class="${c.metaAlcanzada?'pill pill-ok':'pill pill-warn'}">${c.total} / ${DB.config.metaMensualVehiculos}</span></div>
          <div class="bar"><i style="width:${pct}%;background:${c.metaAlcanzada?'var(--green-500)':'var(--gold)'}"></i></div>
          <div class="ger-adv-ft">${c.metaAlcanzada
            ? `<span style="color:var(--green-700);font-weight:700">✅ Meta alcanzada · comisión ${COP(c.comision)}</span>`
            : `<span style="color:var(--ink-3)">Faltan ${DB.config.metaMensualVehiculos-c.total} para empezar a comisionar</span>`}</div>
        </div>`;}).join('')}</div></div>

    <div class="panel"><div class="panel-h"><div><h3>Qué está haciendo el equipo</h3><p>Actividad reciente en el sistema</p></div></div>
      <div class="panel-b">${DB.log.length?`<div class="tl">${DB.log.slice(0,8).map(l=>
        `<div class="tl-i"><div class="tl-d">${l.at}</div><b>${l.t}</b></div>`).join('')}</div>`
        :'<p style="font-size:.86rem;color:var(--ink-3)">Sin actividad registrada en esta sesión.</p>'}</div></div>`;
}

/* Estadística mensual del asesor: comisión solo tras alcanzar la meta de 50 vehículos */
function advisorMonthStats(advId){
  const m=today.getMonth(), y=today.getFullYear();
  const mine=DB.appts.filter(a=>a.advisorId===advId
    && (a.confirmedArrival||a.status==='Completada')
    && new Date(a.date+'T00:00:00').getMonth()===m
    && new Date(a.date+'T00:00:00').getFullYear()===y);
  const total=mine.length;
  const meta=DB.config.metaMensualVehiculos;
  const metaAlcanzada = total>=meta;
  // Solo los vehículos por ENCIMA de la meta generan comisión
  const comisionables = metaAlcanzada ? total-meta+1 : 0;
  return {total, metaAlcanzada, comisionables, comision: comisionables*DB.config.comisionPorCita, meta};
}

/* ═══════ VISTA 2: MI DÍA (usuario asesor) ═══════ */
function renderMiAgenda(){
  const el=$('#avMiAgenda'); if(!el) return;
  const advId = currentUser && currentUser.advisorId;
  const hoy=iso(today);
  const mine=DB.appts.filter(a=>a.advisorId===advId && a.date===hoy && a.status!=='Cancelada');
  const asist=mine.filter(a=>a.confirmedArrival||a.status==='Completada');
  const pend=mine.filter(a=>!a.confirmedArrival&&a.status!=='Completada'&&a.status!=='Inasistente');
  const noshow=mine.filter(a=>a.status==='Inasistente');
  const st=advId?advisorMonthStats(advId):{total:0,metaAlcanzada:false,comision:0,meta:DB.config.metaMensualVehiculos};
  const pct=Math.min(100,Math.round(st.total/st.meta*100));

  el.innerHTML=`
    <div class="ase-hero">
      <div><span class="ger-eyebrow">Usuario asesor</span>
        <h2 class="dsp">Hola, ${currentUser.name.split(' ')[0]}</h2>
        <p>Tu jornada de hoy · ${fmtDate(hoy)}</p></div>
      <div class="ase-meta">
        <span class="ase-meta-lbl">Tu meta del mes</span>
        <div class="ase-meta-num">${st.total} <small>/ ${st.meta}</small></div>
        <div class="bar" style="background:rgba(255,255,255,.2)"><i style="width:${pct}%;background:${st.metaAlcanzada?'var(--lime)':'var(--gold)'}"></i></div>
        <span class="ase-meta-ft">${st.metaAlcanzada
          ? `🎉 ¡Meta alcanzada! Ya estás comisionando`
          : `Faltan ${st.meta-st.total} vehículos para comisionar`}</span>
      </div>
    </div>

    <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
      ${kpi('Mis citas hoy',mine.length,'cal','Asignadas a tu nombre')}
      ${kpi('Ya asistieron',asist.length,'car','Confirmadas en el centro')}
      ${kpi('Por llegar',pend.length,'clock','Pendientes de confirmar',pend.length?'warn':'')}
      ${st.metaAlcanzada
        ? kpiBig('Comisión acumulada',COP(st.comision),`${st.comisionables} vehículo(s) sobre la meta`)
        : kpi('Comisión acumulada','$0','money','Se activa al llegar a '+st.meta,'warn')}
    </div>

    ${noshow.length?`<div class="alertbar dan" style="margin-bottom:16px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
      <div><b>${noshow.length} cliente(s) no llegaron</b><p>Contáctalos para reagendar y no perder la comisión.</p></div></div>`:''}

    <div class="panel"><div class="panel-h"><div><h3>Mis citas de hoy</h3><p>Marca la llegada de cada cliente</p></div>
      <button class="btn btn-p btn-sm" id="aseArqueo">📋 Mi arqueo del día</button></div>
      <div class="panel-b">${mine.length? mine.sort((a,b)=>a.time<b.time?-1:1).map(a=>`
        <div class="ase-cita ${a.confirmedArrival||a.status==='Completada'?'llego':a.status==='Inasistente'?'nollego':''}">
          <div class="ase-cita-time">${a.time}</div>
          <div class="ase-cita-body">
            <b>${a.name}</b>
            <span>${a.plate} · ${vLabel(a.type)}${a.code?' · '+a.code:''}</span>
          </div>
          <div class="ase-cita-act">
            ${a.confirmedArrival||a.status==='Completada'
              ? '<span class="pill pill-ok">✅ Asistió</span>'
              : `<button class="btn btn-cta-green btn-sm" data-llego="${a.id}">Marcar llegada</button>`}
            <a class="iconbtn" href="https://wa.me/57${a.phone}" target="_blank" rel="noopener" title="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/></svg></a>
            <a class="iconbtn" href="tel:${a.phone}" title="Llamar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></svg></a>
          </div>
        </div>`).join('') : emptyBox('Sin citas hoy','Agenda prospectos desde la Agenda general.')}
      </div></div>`;

  $('#aseArqueo')?.addEventListener('click',openArqueoDiario);
  $$('[data-llego]').forEach(b=>b.addEventListener('click',()=>{
    const a=DB.appts.find(x=>x.id===b.dataset.llego);
    a.confirmedArrival=true; a.status='Completada';
    logAct(`Llegada confirmada · ${a.plate} · ${currentUser.name}`);
    trackAction('confirmar-llegada'); renderAdmin(); toast('✅ Llegada confirmada');
  }));
}
function kpiBig(label,val,desc){
  return `<div class="kpi kpi-win"><div class="kpi-t">${label}</div><div class="kpi-v">${val}</div><div class="kpi-d">${desc}</div></div>`;
}

/* ═══════ VISTA 3: PREVENTIVAS (calendario aparte) ═══════ */
let prevRef = new Date(iso(today)+'T00:00:00');
function renderPreventivas(){
  const el=$('#avPrev'); if(!el) return;
  const bonos=DB.reminders.filter(m=>m.giftCode);
  const redimidos=bonos.filter(m=>m.giftClaimed).length;
  const prevAppts=DB.appts.filter(a=>a.tipoServicio==='preventiva');
  const days=Array.from({length:7},(_,i)=>addDays(weekStart(prevRef),i));
  const slots=DB.config.slots;

  let grid=`<div class="cal-grid"><div class="cal-hcell"></div>`;
  days.forEach(d=>{const t=iso(d)===iso(today);
    grid+=`<div class="cal-hcell ${t?'today':''}"><b>${DIAS[d.getDay()]}</b><span>${d.getDate()}/${d.getMonth()+1}</span></div>`;});
  slots.forEach(tm=>{
    grid+=`<div class="cal-tcell">${tm}</div>`;
    days.forEach(d=>{
      const ds=iso(d);
      const evs=prevAppts.filter(a=>a.date===ds&&a.time===tm);
      grid+=`<div class="cal-cell cal-cell-multi">`;
      evs.forEach(ev=>{grid+=`<button class="cal-ev prev-ev" data-apst="${ev.id}">🎁 ${ev.plate}<small>${ev.name.split(' ')[0]}</small></button>`;});
      grid+=`<button class="cal-free" data-newprev="${ds}|${tm}">+ Preventiva</button></div>`;
    });
  });
  grid+=`</div>`;

  el.innerHTML=`
    <div class="prev-banner">
      <span class="prev-ico">🎁</span>
      <div><b>Agenda exclusiva de revisiones preventivas</b>
        <p>Separada de la agenda general para que no se mezclen los turnos. Aquí se agendan los bonos gratuitos.</p></div>
    </div>
    <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
      ${kpi('Bonos generados',bonos.length,'bell','Desde el sitio web')}
      ${kpi('Bonos redimidos',redimidos,'car','Ya usados en el centro')}
      ${kpi('Pendientes por redimir',bonos.length-redimidos,'clock','Aún no vienen',bonos.length-redimidos?'warn':'')}
      ${kpi('Preventivas agendadas',prevAppts.length,'cal','En este calendario')}
    </div>
    <div class="panel">
      <div class="panel-h"><div><h3>Calendario de preventivas</h3><p>Solo revisiones preventivas gratuitas</p></div>
        <div class="cal-nav">
          <button class="iconbtn" data-prevmv="-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg></button>
          <button class="btn btn-o btn-xs" data-prevmv="0">Hoy</button>
          <button class="iconbtn" data-prevmv="1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 18 6-6-6-6"/></svg></button>
        </div></div>
      <div class="panel-b"><div class="cal-wrap">${grid}</div></div></div>

    <div class="panel"><div class="panel-h"><div><h3>Bonos emitidos</h3><p>Códigos generados desde el sitio</p></div></div>
      <div class="panel-b flush"><div class="tw"><table>
        <thead><tr><th>Código</th><th>Cliente</th><th>Placa</th><th>Contacto</th><th>Estado</th><th>Acción</th></tr></thead>
        <tbody>${bonos.length?bonos.map(m=>`<tr>
          <td><span class="code-chip">${m.giftCode}</span></td>
          <td><b>${m.name}</b></td><td><span class="plate">${m.plate}</span></td>
          <td class="num">${m.phone}</td>
          <td>${m.giftClaimed?'<span class="pill pill-ok">Redimido</span>':'<span class="pill pill-warn">Pendiente</span>'}</td>
          <td>${m.giftClaimed?'—':`<button class="btn btn-soft-green btn-xs" data-redimir="${m.id}">Redimir</button>`}</td>
        </tr>`).join(''):`<tr><td colspan="6">${emptyBox('Sin bonos','Aún no se han generado bonos preventivos.')}</td></tr>`}</tbody>
      </table></div></div></div>`;

  $$('[data-prevmv]').forEach(b=>b.addEventListener('click',()=>{
    const n=+b.dataset.prevmv;
    prevRef = n===0? new Date(iso(today)+'T00:00:00') : addDays(prevRef,n*7);
    renderPreventivas();
  }));
  $$('[data-redimir]').forEach(b=>b.addEventListener('click',()=>redimirBono(b.dataset.redimir)));
  $$('[data-newprev]').forEach(b=>b.addEventListener('click',()=>{
    const [d,t]=b.dataset.newprev.split('|');
    nuevaPreventiva(d,t);
  }));
  $$('#avPrev [data-apst]').forEach(b=>b.addEventListener('click',()=>openApt(b.dataset.apst)));
}
function redimirBono(id){
  const m=DB.reminders.find(x=>x.id===id); if(!m) return;
  m.giftClaimed=true;
  logAct(`Bono preventivo redimido · ${m.giftCode} · ${m.plate}`);
  trackAction('redimir-bono'); renderAdmin(); toast('🎁 Bono redimido correctamente');
}
function nuevaPreventiva(d,t){
  modal('Agendar revisión preventiva 🎁',`
    <p style="font-size:.88rem;color:var(--ink-2);margin-bottom:15px">Turno: <b>${fmtDate(d)} · ${t}</b></p>
    <label class="flabel">Código del bono (opcional)</label>
    <input id="pvCode" class="finput mono" placeholder="PRV-XXXXXX-XXX" style="text-transform:uppercase">
    <div class="fgrid" style="margin-top:14px">
      <div><label class="flabel">Nombre</label><input id="pvName" class="finput"></div>
      <div><label class="flabel">Celular</label><input id="pvPhone" class="finput" inputmode="tel"></div>
      <div><label class="flabel">Placa</label><input id="pvPlate" class="finput mono" style="text-transform:uppercase"></div>
      <div><label class="flabel">Asesor</label><select id="pvAdv" class="finput"><option value="">Sin asignar</option>${ADVISORS.map(a=>`<option value="${a.id}" ${currentUser&&currentUser.advisorId===a.id?'selected':''}>${a.name}</option>`).join('')}</select></div>
    </div>`,
    `<button class="btn btn-o" data-mclose>Cancelar</button><button class="btn btn-p" id="pvSave">Agendar preventiva</button>`);
  // Autocompletar si el código existe
  $('#pvCode').addEventListener('input',e=>{
    const code=e.target.value.trim().toUpperCase();
    const m=DB.reminders.find(x=>x.giftCode===code);
    if(m){ $('#pvName').value=m.name; $('#pvPhone').value=m.phone; $('#pvPlate').value=m.plate;
      setFieldState(e.target,true); toast('🎁 Bono encontrado · datos cargados'); }
    else if(code.length>=8) setFieldState(e.target,false,'No encontramos ese bono.');
  });
  $('#pvSave').addEventListener('click',()=>{
    const nm=$('#pvName').value.trim(), ph=$('#pvPhone').value.trim(), pl=$('#pvPlate').value.trim().toUpperCase();
    if(nm.length<3||!ph||!pl) return toast('Completa nombre, celular y placa');
    let cl=DB.clients.find(c=>c.phone===ph);
    if(!cl){cl={id:uid('c'),doc:'',name:nm,phone:ph,email:'',notes:'Registrado desde preventivas.'};DB.clients.push(cl);}
    const det=detectVehicleByPlate(pl);
    if(!vehByPlate(pl)) DB.vehicles.push({id:uid('v'),plate:pl,type:det?det.sub:'automovil',cat:vLabel(det?det.sub:'automovil'),clientId:cl.id,due:null});
    DB.appts.push({id:uid('a'),clientId:cl.id,plate:pl,name:nm,phone:ph,email:'',
      type:det?det.sub:'automovil',date:d,time:t,status:'Confirmada',source:'Preventiva',
      tipoServicio:'preventiva', code:genCode('CIT'),
      advisorId:$('#pvAdv').value||null,confirmedArrival:false,notifiedBefore:false,notifiedAfter:false,contacted:false});
    const bono=DB.reminders.find(x=>x.giftCode===$('#pvCode').value.trim().toUpperCase());
    if(bono){ bono.converted=true; }
    logAct(`Preventiva agendada · ${pl} · ${fmtDate(d)} ${t}`);
    trackAction('agendar-preventiva');
    closeModal(); renderAdmin(); toast('🎁 Preventiva agendada');
  });
  $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
}

/* ---------- FINANZAS ---------- */
function renderFinanzas(){
  const el = $('#avFinanzas'); if(!el) return;
  const {rows, totalComision} = computeArqueo(iso(today));
  const cartVencida = DB.cartera.filter(k=>k.status==='Vencida').reduce((s,k)=>s+k.amount,0);
  const cartPend = DB.cartera.filter(k=>k.status==='Pendiente').reduce((s,k)=>s+k.amount,0);
  const cartPagada = DB.cartera.filter(k=>k.status==='Pagada').reduce((s,k)=>s+k.amount,0);
  const ingresosLedger = DB.cashLedger.filter(l=>l.type==='ingreso').reduce((s,l)=>s+l.amount,0);
  const egresosLedger = DB.cashLedger.filter(l=>l.type==='egreso').reduce((s,l)=>s+l.amount,0);

  el.innerHTML = `
    <div class="kpis">
      ${kpi('Cartera vencida',COP(cartVencida),'alert','Del servicio, no de créditos','alert')}
      ${kpi('Cartera pendiente',COP(cartPend),'clock','Dentro del plazo','warn')}
      ${kpi('Cartera pagada',COP(cartPagada),'money','Histórico')}
      ${kpi('Comisiones de hoy',COP(totalComision),'chart',`${rows.reduce((s,r)=>s+r.asistio,0)} citas asistidas`)}
    </div>

    <div class="panel"><div class="panel-h"><div><h3>Arqueo diario de cartera y comisiones</h3><p>Resumen del día en curso, ${fmtDate(iso(today))}.</p></div>
      <button class="btn btn-p btn-sm" id="finArqueoBtn">📋 Ver arqueo del día</button></div>
      <div class="panel-b"><div class="g3">
        ${kpiMini('Ingresado hoy (caja)', COP(ingresosLedger))}
        ${kpiMini('Egresos registrados', COP(egresosLedger))}
        ${kpiMini('Comisión a pagar hoy', COP(totalComision))}
      </div></div></div>

    <div class="panel"><div class="panel-h"><div><h3>Ingreso por cuenta bancaria</h3><p>Registra manualmente cada movimiento y a qué cuenta entró.</p></div></div>
      <div class="panel-b">
        <div class="fgrid">
          <div><label class="flabel">Cuenta</label><select id="ledAcc" class="finput">${DB.bankAccounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select></div>
          <div><label class="flabel">Tipo</label><select id="ledType" class="finput"><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select></div>
          <div><label class="flabel">Concepto</label><input id="ledConcept" class="finput" placeholder="Ej: Pago revisión ABC123"></div>
          <div><label class="flabel">Valor</label><input id="ledAmount" class="finput" inputmode="numeric" placeholder="150000"></div>
        </div>
        <button class="btn btn-p btn-sm" style="margin-top:12px" id="ledSave">Registrar movimiento</button>
        <div class="tw" style="margin-top:18px"><table>
          <thead><tr><th>Fecha</th><th>Cuenta</th><th>Concepto</th><th>Tipo</th><th>Valor</th></tr></thead>
          <tbody id="tbLedger">${DB.cashLedger.length?DB.cashLedger.slice(0,10).map(l=>{
            const acc=DB.bankAccounts.find(a=>a.id===l.accountId);
            return `<tr><td>${fmtDate(l.date)}</td><td>${acc?acc.name:'—'}</td><td>${l.concept}</td>
              <td><span class="pill ${l.type==='ingreso'?'pill-ok':'pill-dan'}">${l.type}</span></td>
              <td class="num">${COP(l.amount)}</td></tr>`;}).join(''):`<tr><td colspan="5">${emptyBox('Sin movimientos','Registra el primer ingreso o egreso del día.')}</td></tr>`}</tbody>
        </table></div>
      </div></div>

    <div class="panel"><div class="panel-h"><div><h3>Prospección financiera</h3><p>Proyección simple basada en el comportamiento de los últimos 6 meses.</p></div></div>
      <div class="panel-b">
        <div class="chart">${DB.monthly.map((v,i)=>`<div class="chart-b"><b>${COP(v*4500)}</b><div class="chart-bw"><i style="height:${Math.round(v/Math.max(...DB.monthly)*100)}%"></i></div><span>${['Mar','Abr','May','Jun','Jul','Ago'][i]}</span></div>`).join('')}</div>
        <div class="note-box" style="margin-top:14px"><b>Cómo leer esto</b>La proyección multiplica el volumen histórico de revisiones por un valor promedio de referencia. Es una guía inicial — se afina con datos reales una vez esté conectado el backend.</div>
      </div></div>

    <div class="panel"><div class="panel-h"><div><h3>Informes por periodo</h3><p>Genera un reporte específico para revisar con el equipo o el contador.</p></div></div>
      <div class="panel-b">
        <div class="g3">
          ${['Ingresos vs. egresos del mes','Comisiones por asesor','Cartera vencida por cliente','Créditos desembolsados por entidad','Flujo de caja por cuenta bancaria','Conversión de recordatorios a ingreso'].map(t=>
            `<div class="card" style="padding:16px"><b style="font-size:.88rem;display:block;margin-bottom:8px">${t}</b>
              <button class="btn btn-o btn-xs" data-informe="${t}">Generar</button></div>`).join('')}
        </div>
        <div class="note-box" style="margin-top:16px"><b>Recomendación</b>Los tres informes más útiles para revisar cada semana son: <b>comisiones por asesor</b> (control de nómina variable), <b>cartera vencida por cliente</b> (prioriza cobros) y <b>créditos desembolsados por entidad</b> (mide qué tan rápido paga cada aliado financiero).</div>
      </div></div>`;

  $('#finArqueoBtn')?.addEventListener('click', openArqueoDiario);
  $('#ledSave')?.addEventListener('click',()=>{
    const acc=$('#ledAcc').value, type=$('#ledType').value, concept=$('#ledConcept').value.trim();
    const amount=+($('#ledAmount').value.replace(/\D/g,''));
    if(!concept||!amount) return toast('Completa el concepto y el valor');
    DB.cashLedger.unshift({id:uid('l'),date:iso(today),accountId:acc,concept,amount,type});
    const bankAcc=DB.bankAccounts.find(a=>a.id===acc);
    bankAcc.balance += type==='ingreso'?amount:-amount;
    logAct(`Movimiento de caja registrado · ${concept} · ${COP(amount)}`);
    trackAction('registrar-movimiento');
    renderFinanzas(); toast('Movimiento registrado');
  });
  $$('[data-informe]').forEach(b=>b.addEventListener('click',()=>{
    toast(`Generando informe: ${b.dataset.informe}...`);
    download(`informe-${b.dataset.informe.toLowerCase().replace(/\s+/g,'-')}-${iso(today)}.csv`, csv(EXPORTS.indicadores()));
  }));
}
function kpiMini(label,val){
  return `<div class="kpi"><div class="kpi-t">${label}</div><div class="kpi-v">${val}</div></div>`;
}

/* ---------- CLIENTES Y PAGOS (vista digitadora de caja) ---------- */
function renderCaja(){
  const el = $('#avCaja'); if(!el) return;
  el.innerHTML = `
    <div class="panel"><div class="panel-h"><div><h3>Buscar o agregar cliente</h3><p>Registra el proceso y el pago cuando el cliente llega al centro.</p></div></div>
      <div class="panel-b">
        <div class="tbar"><input class="finput" id="cajaSearch" placeholder="Buscar por nombre, documento o placa..." style="min-width:280px">
          <button class="btn btn-p btn-sm" id="cajaNewCli">+ Cliente nuevo</button></div>
        <div id="cajaResults" style="margin-top:16px"></div>
      </div></div>
    <div class="panel"><div class="panel-h"><h3>Últimos pagos registrados</h3></div>
      <div class="panel-b flush"><div class="tw"><table>
        <thead><tr><th>Fecha</th><th>Cuenta</th><th>Concepto</th><th>Valor</th></tr></thead>
        <tbody>${DB.cashLedger.filter(l=>l.type==='ingreso').slice(0,8).map(l=>{
          const acc=DB.bankAccounts.find(a=>a.id===l.accountId);
          return `<tr><td>${fmtDate(l.date)}</td><td><small style="margin:0">${acc?acc.name:'—'}</small></td><td>${l.concept}</td><td class="num">${COP(l.amount)}</td></tr>`;
        }).join('')||`<tr><td colspan="4">${emptyBox('Sin pagos aún','Los pagos que registres aquí aparecerán en este listado.')}</td></tr>`}</tbody>
      </table></div></div></div>`;
  $('#cajaSearch').addEventListener('input', drawCajaSearch);
  $('#cajaNewCli').addEventListener('click', openCajaNewClient);
  drawCajaSearch();
}
function drawCajaSearch(){
  const q = ($('#cajaSearch')?.value||'').toLowerCase();
  if(!q){ $('#cajaResults').innerHTML=''; return; }
  const clients = DB.clients.filter(c=>c.name.toLowerCase().includes(q)||c.doc.includes(q));
  const veh = DB.vehicles.filter(v=>v.plate.toLowerCase().includes(q));
  const ids = new Set([...clients.map(c=>c.id), ...veh.map(v=>v.clientId)]);
  const results = [...ids].map(cliOf);
  $('#cajaResults').innerHTML = results.length? results.map(c=>`
    <div class="vrow" style="padding:12px 0"><span><b>${c.name}</b> · C.C. ${c.doc} · ${c.phone}</span>
      <button class="btn btn-o btn-xs" data-cajaproc="${c.id}">Registrar proceso y pago</button></div>`).join('')
    : emptyBox('Sin resultados','Prueba con otro nombre, documento o placa.');
  $$('[data-cajaproc]').forEach(b=>b.addEventListener('click',()=>openCajaProcess(b.dataset.cajaproc)));
}
function openCajaNewClient(){
  modal('Cliente nuevo',`
    <div class="fgrid">
      <div><label class="flabel">Nombre completo</label><input id="ccName" class="finput"></div>
      <div><label class="flabel">Documento</label><input id="ccDoc" class="finput" inputmode="numeric"></div>
      <div><label class="flabel">Celular</label><input id="ccPhone" class="finput" inputmode="tel"></div>
      <div><label class="flabel">Correo (opcional)</label><input id="ccMail" class="finput" type="email"></div>
      <div><label class="flabel">Placa</label><input id="ccPlate" class="finput mono" style="text-transform:uppercase"></div>
      <div><label class="flabel">Tipo de vehículo</label><select id="ccType" class="finput">${Object.entries(VTREE).flatMap(([g,grp])=>grp.sub.map(s=>`<option value="${s.id}">${grp.label} · ${s.label}</option>`)).join('')}</select></div>
    </div>`,
    `<button class="btn btn-o" data-mclose>Cancelar</button><button class="btn btn-p" id="ccSave">Crear cliente</button>`);
  $('#ccSave').addEventListener('click',()=>{
    const name=$('#ccName').value.trim(), doc=$('#ccDoc').value.trim(), phone=$('#ccPhone').value.trim(), plate=$('#ccPlate').value.trim().toUpperCase();
    if(name.length<3||!doc||!phone) return toast('Completa nombre, documento y celular');
    const cl={id:uid('c'),doc,name,phone,email:$('#ccMail').value.trim(),notes:'Registrado desde caja.'};
    DB.clients.push(cl);
    if(plate && !vehByPlate(plate)) DB.vehicles.push({id:uid('v'),plate,type:$('#ccType').value,cat:vLabel($('#ccType').value),clientId:cl.id,due:null});
    logAct(`Cliente nuevo registrado desde caja · ${name}`);
    trackAction('crear-cliente');
    closeModal(); toast('Cliente creado'); openCajaProcess(cl.id);
  });
  $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
}
function openCajaProcess(clientId){
  const c = cliOf(clientId);
  const vs = DB.vehicles.filter(v=>v.clientId===clientId);
  const matchAppt = DB.appts.find(a=>a.clientId===clientId && ['Pendiente','Confirmada','Inasistente'].includes(a.status)
    && Math.abs(daysTo(a.date))<=3);
  modal(`Proceso y pago · ${c.name}`,`
    ${matchAppt?`<div class="note-box" style="margin-bottom:16px"><b>Cita encontrada</b>Este cliente tenía una cita el ${fmtDate(matchAppt.date)} a las ${matchAppt.time} (${matchAppt.status}). Al guardar, se marcará como asistida y se conserva la comisión del asesor.</div>`:''}
    <div class="fgrid">
      <div><label class="flabel">Placa</label><select id="cpPlate" class="finput">${vs.map(v=>`<option value="${v.plate}">${v.plate} · ${v.cat}</option>`).join('')||'<option value="">Sin vehículos</option>'}</select></div>
      <div><label class="flabel">Servicio</label><select id="cpSrv" class="finput">${SERVICES.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
      <div><label class="flabel">Valor cobrado</label><input id="cpAmount" class="finput" inputmode="numeric" placeholder="150000"></div>
      <div><label class="flabel">Cuenta de destino</label><select id="cpAcc" class="finput">${DB.bankAccounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select></div>
    </div>`,
    `<button class="btn btn-o" data-mclose>Cancelar</button><button class="btn btn-p" id="cpSave">Registrar</button>`);
  $('#cpSave').addEventListener('click',()=>{
    const amount=+($('#cpAmount').value.replace(/\D/g,''));
    if(!amount) return toast('Ingresa el valor cobrado');
    const plate=$('#cpPlate').value;
    DB.cashLedger.unshift({id:uid('l'),date:iso(today),accountId:$('#cpAcc').value,
      concept:`${SERVICES.find(s=>s.id===$('#cpSrv').value).name} · ${plate}`,amount,type:'ingreso'});
    const acc=DB.bankAccounts.find(a=>a.id===$('#cpAcc').value); acc.balance+=amount;
    if(matchAppt){
      matchAppt.status='Completada'; matchAppt.confirmedArrival=true;
      logAct(`Cita retomada automáticamente desde caja · ${plate} → Completada (comisión conservada)`);
    }
    const v=vehByPlate(plate);
    if(v){ DB.revisions.push({id:uid('r'),vehicleId:v.id,date:iso(today),result:'Aprobada',notes:'Registrada desde caja.'}); v.due=iso(addDays(today,365)); }
    logAct(`Proceso y pago registrado · ${c.name} · ${plate} · ${COP(amount)}`);
    trackAction('registrar-pago');
    closeModal(); renderAdmin(); toast('Proceso y pago registrados');
  });
  $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
}

/* ---------- GUÍA DE CREDENCIALES (PDF para gerencia) ---------- */
function generarGuiaCredenciales(){
  const ref=docRef('general').replace('IG','GC');
  const logo=(typeof LOGO_SRC!=='undefined')?LOGO_SRC:'assets/logo.png';
  const cards=USERS.map(u=>{
    const r=ROLES[u.role];
    return `<div class="cred">
      <div class="cred-hd" style="background:${r.color}">
        <b>${r.label}</b><span>${r.desc}</span>
      </div>
      <div class="cred-bd">
        <div class="cred-person">${u.name}</div>
        <div class="cred-row"><span>Usuario</span><b>${u.username}</b></div>
        <div class="cred-row"><span>Contraseña</span><b>Personal · la define cada usuario</b></div>
        <div class="cred-acc"><span>Módulos habilitados</span><p>${r.nav.map(k=>NAV_META[k]?NAV_META[k].label:k).join(' · ')}</p></div>
      </div></div>`;}).join('');
  openDoc(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Guía de credenciales</title>
  <style>
    @page{size:letter;margin:20mm 16mm}
    *{box-sizing:border-box}
    body{font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#15201A;margin:0;font-size:12px}
    .hd{display:flex;align-items:flex-start;gap:18px;border-bottom:3px solid #164A26;padding-bottom:16px;margin-bottom:8px}
    .hd img{height:58px;object-fit:contain}
    .hd-txt h1{font-size:20px;color:#0F3319;margin:0 0 3px}
    .hd-txt p{font-size:12px;color:#4B564F;margin:0}
    .hd-org{margin-left:auto;text-align:right;font-size:10px;color:#6E786C;line-height:1.6}
    .hd-org b{display:block;color:#0F3319;font-size:12px}
    .refbar{display:flex;justify-content:space-between;background:#EAF6EC;border-radius:6px;
      padding:8px 12px;font-size:10.5px;color:#164A26;margin-bottom:18px}
    .refbar b{font-family:'Courier New',monospace}
    .warn{background:#FFF6E0;border-left:3px solid #FAC800;padding:11px 14px;font-size:10.5px;
      color:#7A5A00;border-radius:0 6px 6px 0;margin-bottom:20px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .cred{border:1px solid #E4E2D7;border-radius:9px;overflow:hidden;page-break-inside:avoid}
    .cred-hd{padding:11px 14px;color:#fff}
    .cred-hd b{display:block;font-size:13px}
    .cred-hd span{font-size:9.5px;opacity:.85}
    .cred-bd{padding:13px 14px}
    .cred-person{font-weight:700;font-size:12.5px;margin-bottom:9px;color:#0F3319}
    .cred-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F2F0E8;font-size:11px}
    .cred-row b{font-family:'Courier New',monospace;background:#EAF6EC;padding:2px 8px;border-radius:4px;color:#164A26}
    .cred-acc{margin-top:10px}
    .cred-acc span{font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#8A8578;font-weight:600}
    .cred-acc p{font-size:9.5px;color:#4B564F;margin:3px 0 0;line-height:1.5}
    h2{font-size:13px;color:#0F3319;margin:26px 0 8px;padding-bottom:5px;border-bottom:1.5px solid #EAF6EC}
    table{width:100%;border-collapse:collapse}
    th{background:#164A26;color:#fff;text-align:left;padding:7px 10px;font-size:9.5px;text-transform:uppercase}
    td{padding:8px 10px;border-bottom:1px solid #EFEDE4;font-size:10.5px}
    .ft{margin-top:26px;padding-top:12px;border-top:1px solid #E4E2D7;font-size:9px;color:#8A8578;
      display:flex;justify-content:space-between}
  </style></head><body>
    <div class="hd"><img src="${logo}" alt="">
      <div class="hd-txt"><h1>Guía de acceso al sistema</h1><p>Credenciales y permisos por perfil de usuario</p></div>
      <div class="hd-org"><b>CDA REVITOLIMA</b>NIT 901.841.056-1<br>Calle 111 #20-25 Sur<br>Ibagué, Tolima</div>
    </div>
    <div class="refbar"><span>Documento N° <b>${ref}</b></span><span>Generado: <b>${new Date().toLocaleString('es-CO')}</b></span><span>Confidencial</span></div>
    <div class="warn"><b>⚠ Documento confidencial.</b> Entregar únicamente a la gerencia. Cada usuario debe cambiar su contraseña en el primer ingreso y no compartirla. El sistema registra todas las acciones por usuario.</div>
    <div class="grid">${cards}</div>
    <h2>Qué puede hacer cada perfil</h2>
    <table><thead><tr><th>Perfil</th><th>Alcance</th><th>Informes</th></tr></thead><tbody>
      <tr><td><b>Superusuario</b></td><td>Ve gráficas, informes y generalidades de todas las áreas. Enfocado en seguimiento, control y revisión. Puede editar.</td><td>Todos, incluidos gerenciales y financieros</td></tr>
      <tr><td><b>Superadministrador</b></td><td>Todo lo del superusuario, más la gestión interna de usuarios y permisos.</td><td>Todos, sin restricción</td></tr>
      <tr><td><b>Usuario administrador</b></td><td>Caja y digitación: registra clientes, citas, procesos, pagos y redime bonos.</td><td>Operativos únicamente</td></tr>
      <tr><td><b>Usuario asesor</b></td><td>Agenda citas y preventivas, gestiona sus prospectos y consulta su arqueo de comisiones.</td><td>Operativos de su gestión</td></tr>
    </tbody></table>
    <h2>Regla de comisión vigente</h2>
    <table><tbody>
      <tr><td>Valor por vehículo atendido</td><td><b>${COP(DB.config.comisionPorCita)}</b></td></tr>
      <tr><td>Meta mensual por asesor</td><td><b>${DB.config.metaMensualVehiculos} vehículos</b></td></tr>
      <tr><td>Condición</td><td>La comisión empieza a sumar únicamente al alcanzar la meta</td></tr>
      <tr><td>Reinicio de contadores</td><td>Automático el día 1 de cada mes</td></tr>
    </tbody></table>
    <div class="ft"><span>CDA REVITOLIMA · NIT 901.841.056-1 · Documento confidencial</span><span>${ref}</span></div>
    <script>window.onload=()=>window.print();<\/script>
  </body></html>`);
  logAct('Guía de credenciales generada');
}

/* ---------- USUARIOS Y PERMISOS ---------- */
function renderUsuarios(){
  const el = $('#avUsuarios'); if(!el) return;
  el.innerHTML = `
    <div class="note-box" style="margin-bottom:18px"><b>Los 4 perfiles del sistema</b>
      Cada perfil entra al mismo sistema pero ve su propio portal. La información sensible queda protegida según el rol.</div>
    <div class="g2" style="margin-bottom:20px">
      ${Object.entries(ROLES).map(([k,r])=>`
        <div class="role-card" style="border-left:5px solid ${r.color}">
          <b>${r.label}</b><p>${r.desc}</p>
          <div class="role-mods">${r.nav.slice(0,6).map(n=>`<span>${NAV_META[n]?NAV_META[n].label:n}</span>`).join('')}${r.nav.length>6?`<span>+${r.nav.length-6} más</span>`:''}</div>
        </div>`).join('')}
    </div>
    <div class="panel"><div class="panel-h"><div><h3>Usuarios activos</h3><p>Credenciales asignadas</p></div>
      <button class="btn btn-p btn-sm" id="genCreds">📄 Guía de credenciales (PDF)</button></div>
      <div class="panel-b flush"><div class="tw"><table>
        <thead><tr><th>Usuario</th><th>Nombre</th><th>Perfil</th><th>Módulos</th><th>Estado</th></tr></thead>
        <tbody>${USERS.map(u=>`<tr><td><b class="mono">${u.username}</b></td><td>${u.name}</td>
          <td><span class="pill" style="background:${ROLES[u.role].color}22;color:${ROLES[u.role].color}">${ROLES[u.role].label}</span></td>
          <td class="num">${ROLES[u.role].nav.length}</td><td><span class="pill pill-ok">Activo</span></td></tr>`).join('')}
        </tbody></table></div>
        <div style="padding:16px"><div class="note-box"><b>Requiere backend</b>Crear o desactivar usuarios de forma permanente necesita Supabase con autenticación real. La estructura de permisos ya está definida y funcionando.</div></div>
      </div></div>
    <div class="panel"><div class="panel-h"><div><h3>Perfiles de asesor</h3><p>Meta ${DB.config.metaMensualVehiculos} vehículos · comisión ${COP(DB.config.comisionPorCita)} por vehículo sobre la meta</p></div></div>
      <div class="panel-b flush"><div class="tw"><table>
        <thead><tr><th>Asesor</th><th>Celular</th><th class="num">Mes actual</th><th>Estado meta</th><th class="num">Comisión</th></tr></thead>
        <tbody>${ADVISORS.map(a=>{const st=advisorMonthStats(a.id);
          return `<tr><td><b>${a.name}</b></td><td class="num">${a.phone}</td><td class="num">${st.total}/${st.meta}</td>
            <td>${st.metaAlcanzada?'<span class="pill pill-ok">Comisionando</span>':'<span class="pill pill-warn">En progreso</span>'}</td>
            <td class="num">${COP(st.comision)}</td></tr>`;}).join('')}
        </tbody></table></div></div></div>`;
  $('#genCreds')?.addEventListener('click',generarGuiaCredenciales);
}

/* ---------- FINANZAS ---------- */
function renderFinanzas(){
  const el = $('#avFinanzas'); if(!el) return;
  const {rows, totalComision} = computeArqueo(iso(today));
  const cartVencida = DB.cartera.filter(k=>k.status==='Vencida').reduce((s,k)=>s+k.amount,0);
  const cartPend = DB.cartera.filter(k=>k.status==='Pendiente').reduce((s,k)=>s+k.amount,0);
  const cartPagada = DB.cartera.filter(k=>k.status==='Pagada').reduce((s,k)=>s+k.amount,0);
  const ingresosLedger = DB.cashLedger.filter(l=>l.type==='ingreso').reduce((s,l)=>s+l.amount,0);
  const egresosLedger = DB.cashLedger.filter(l=>l.type==='egreso').reduce((s,l)=>s+l.amount,0);

  el.innerHTML = `
    <div class="kpis">
      ${kpi('Cartera vencida',COP(cartVencida),'alert','Del servicio, no de créditos','alert')}
      ${kpi('Cartera pendiente',COP(cartPend),'clock','Dentro del plazo','warn')}
      ${kpi('Cartera pagada',COP(cartPagada),'money','Histórico')}
      ${kpi('Comisiones de hoy',COP(totalComision),'chart',`${rows.reduce((s,r)=>s+r.asistio,0)} citas asistidas`)}
    </div>

    <div class="panel"><div class="panel-h"><div><h3>Arqueo diario de cartera y comisiones</h3><p>Resumen del día en curso, ${fmtDate(iso(today))}.</p></div>
      <button class="btn btn-p btn-sm" id="finArqueoBtn">📋 Ver arqueo del día</button></div>
      <div class="panel-b"><div class="g3">
        ${kpiMini('Ingresado hoy (caja)', COP(ingresosLedger))}
        ${kpiMini('Egresos registrados', COP(egresosLedger))}
        ${kpiMini('Comisión a pagar hoy', COP(totalComision))}
      </div></div></div>

    <div class="panel"><div class="panel-h"><div><h3>Ingreso por cuenta bancaria</h3><p>Registra manualmente cada movimiento y a qué cuenta entró.</p></div></div>
      <div class="panel-b">
        <div class="fgrid">
          <div><label class="flabel">Cuenta</label><select id="ledAcc" class="finput">${DB.bankAccounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select></div>
          <div><label class="flabel">Tipo</label><select id="ledType" class="finput"><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select></div>
          <div><label class="flabel">Concepto</label><input id="ledConcept" class="finput" placeholder="Ej: Pago revisión ABC123"></div>
          <div><label class="flabel">Valor</label><input id="ledAmount" class="finput" inputmode="numeric" placeholder="150000"></div>
        </div>
        <button class="btn btn-p btn-sm" style="margin-top:12px" id="ledSave">Registrar movimiento</button>
        <div class="tw" style="margin-top:18px"><table>
          <thead><tr><th>Fecha</th><th>Cuenta</th><th>Concepto</th><th>Tipo</th><th>Valor</th></tr></thead>
          <tbody id="tbLedger">${DB.cashLedger.length?DB.cashLedger.slice(0,10).map(l=>{
            const acc=DB.bankAccounts.find(a=>a.id===l.accountId);
            return `<tr><td>${fmtDate(l.date)}</td><td>${acc?acc.name:'—'}</td><td>${l.concept}</td>
              <td><span class="pill ${l.type==='ingreso'?'pill-ok':'pill-dan'}">${l.type}</span></td>
              <td class="num">${COP(l.amount)}</td></tr>`;}).join(''):`<tr><td colspan="5">${emptyBox('Sin movimientos','Registra el primer ingreso o egreso del día.')}</td></tr>`}</tbody>
        </table></div>
      </div></div>

    <div class="panel"><div class="panel-h"><div><h3>Prospección financiera</h3><p>Proyección simple basada en el comportamiento de los últimos 6 meses.</p></div></div>
      <div class="panel-b">
        <div class="chart">${DB.monthly.map((v,i)=>`<div class="chart-b"><b>${COP(v*4500)}</b><div class="chart-bw"><i style="height:${Math.round(v/Math.max(...DB.monthly)*100)}%"></i></div><span>${['Mar','Abr','May','Jun','Jul','Ago'][i]}</span></div>`).join('')}</div>
        <div class="note-box" style="margin-top:14px"><b>Cómo leer esto</b>La proyección multiplica el volumen histórico de revisiones por un valor promedio de referencia. Es una guía inicial — se afina con datos reales una vez esté conectado el backend.</div>
      </div></div>

    <div class="panel"><div class="panel-h"><div><h3>Informes por periodo</h3><p>Genera un reporte específico para revisar con el equipo o el contador.</p></div></div>
      <div class="panel-b">
        <div class="g3">
          ${['Ingresos vs. egresos del mes','Comisiones por asesor','Cartera vencida por cliente','Créditos desembolsados por entidad','Flujo de caja por cuenta bancaria','Conversión de recordatorios a ingreso'].map(t=>
            `<div class="card" style="padding:16px"><b style="font-size:.88rem;display:block;margin-bottom:8px">${t}</b>
              <button class="btn btn-o btn-xs" data-informe="${t}">Generar</button></div>`).join('')}
        </div>
        <div class="note-box" style="margin-top:16px"><b>Recomendación</b>Los tres informes más útiles para revisar cada semana son: <b>comisiones por asesor</b> (control de nómina variable), <b>cartera vencida por cliente</b> (prioriza cobros) y <b>créditos desembolsados por entidad</b> (mide qué tan rápido paga cada aliado financiero).</div>
      </div></div>`;

  $('#finArqueoBtn')?.addEventListener('click', openArqueoDiario);
  $('#ledSave')?.addEventListener('click',()=>{
    const acc=$('#ledAcc').value, type=$('#ledType').value, concept=$('#ledConcept').value.trim();
    const amount=+($('#ledAmount').value.replace(/\D/g,''));
    if(!concept||!amount) return toast('Completa el concepto y el valor');
    DB.cashLedger.unshift({id:uid('l'),date:iso(today),accountId:acc,concept,amount,type});
    const bankAcc=DB.bankAccounts.find(a=>a.id===acc);
    bankAcc.balance += type==='ingreso'?amount:-amount;
    logAct(`Movimiento de caja registrado · ${concept} · ${COP(amount)}`);
    trackAction('registrar-movimiento');
    renderFinanzas(); toast('Movimiento registrado');
  });
  $$('[data-informe]').forEach(b=>b.addEventListener('click',()=>{
    toast(`Generando informe: ${b.dataset.informe}...`);
    download(`informe-${b.dataset.informe.toLowerCase().replace(/\s+/g,'-')}-${iso(today)}.csv`, csv(EXPORTS.indicadores()));
  }));
}
function kpiMini(label,val){
  return `<div class="kpi"><div class="kpi-t">${label}</div><div class="kpi-v">${val}</div></div>`;
}

/* ---------- CLIENTES Y PAGOS (vista digitadora de caja) ---------- */
function renderCaja(){
  const el = $('#avCaja'); if(!el) return;
  el.innerHTML = `
    <div class="panel"><div class="panel-h"><div><h3>Buscar o agregar cliente</h3><p>Registra el proceso y el pago cuando el cliente llega al centro.</p></div></div>
      <div class="panel-b">
        <div class="tbar"><input class="finput" id="cajaSearch" placeholder="Buscar por nombre, documento o placa..." style="min-width:280px">
          <button class="btn btn-p btn-sm" id="cajaNewCli">+ Cliente nuevo</button></div>
        <div id="cajaResults" style="margin-top:16px"></div>
      </div></div>
    <div class="panel"><div class="panel-h"><h3>Últimos pagos registrados</h3></div>
      <div class="panel-b flush"><div class="tw"><table>
        <thead><tr><th>Fecha</th><th>Cuenta</th><th>Concepto</th><th>Valor</th></tr></thead>
        <tbody>${DB.cashLedger.filter(l=>l.type==='ingreso').slice(0,8).map(l=>{
          const acc=DB.bankAccounts.find(a=>a.id===l.accountId);
          return `<tr><td>${fmtDate(l.date)}</td><td><small style="margin:0">${acc?acc.name:'—'}</small></td><td>${l.concept}</td><td class="num">${COP(l.amount)}</td></tr>`;
        }).join('')||`<tr><td colspan="4">${emptyBox('Sin pagos aún','Los pagos que registres aquí aparecerán en este listado.')}</td></tr>`}</tbody>
      </table></div></div></div>`;
  $('#cajaSearch').addEventListener('input', drawCajaSearch);
  $('#cajaNewCli').addEventListener('click', openCajaNewClient);
  drawCajaSearch();
}
function drawCajaSearch(){
  const q = ($('#cajaSearch')?.value||'').toLowerCase();
  if(!q){ $('#cajaResults').innerHTML=''; return; }
  const clients = DB.clients.filter(c=>c.name.toLowerCase().includes(q)||c.doc.includes(q));
  const veh = DB.vehicles.filter(v=>v.plate.toLowerCase().includes(q));
  const ids = new Set([...clients.map(c=>c.id), ...veh.map(v=>v.clientId)]);
  const results = [...ids].map(cliOf);
  $('#cajaResults').innerHTML = results.length? results.map(c=>`
    <div class="vrow" style="padding:12px 0"><span><b>${c.name}</b> · C.C. ${c.doc} · ${c.phone}</span>
      <button class="btn btn-o btn-xs" data-cajaproc="${c.id}">Registrar proceso y pago</button></div>`).join('')
    : emptyBox('Sin resultados','Prueba con otro nombre, documento o placa.');
  $$('[data-cajaproc]').forEach(b=>b.addEventListener('click',()=>openCajaProcess(b.dataset.cajaproc)));
}
function openCajaNewClient(){
  modal('Cliente nuevo',`
    <div class="fgrid">
      <div><label class="flabel">Nombre completo</label><input id="ccName" class="finput"></div>
      <div><label class="flabel">Documento</label><input id="ccDoc" class="finput" inputmode="numeric"></div>
      <div><label class="flabel">Celular</label><input id="ccPhone" class="finput" inputmode="tel"></div>
      <div><label class="flabel">Correo (opcional)</label><input id="ccMail" class="finput" type="email"></div>
      <div><label class="flabel">Placa</label><input id="ccPlate" class="finput mono" style="text-transform:uppercase"></div>
      <div><label class="flabel">Tipo de vehículo</label><select id="ccType" class="finput">${Object.entries(VTREE).flatMap(([g,grp])=>grp.sub.map(s=>`<option value="${s.id}">${grp.label} · ${s.label}</option>`)).join('')}</select></div>
    </div>`,
    `<button class="btn btn-o" data-mclose>Cancelar</button><button class="btn btn-p" id="ccSave">Crear cliente</button>`);
  $('#ccSave').addEventListener('click',()=>{
    const name=$('#ccName').value.trim(), doc=$('#ccDoc').value.trim(), phone=$('#ccPhone').value.trim(), plate=$('#ccPlate').value.trim().toUpperCase();
    if(name.length<3||!doc||!phone) return toast('Completa nombre, documento y celular');
    const cl={id:uid('c'),doc,name,phone,email:$('#ccMail').value.trim(),notes:'Registrado desde caja.'};
    DB.clients.push(cl);
    if(plate && !vehByPlate(plate)) DB.vehicles.push({id:uid('v'),plate,type:$('#ccType').value,cat:vLabel($('#ccType').value),clientId:cl.id,due:null});
    logAct(`Cliente nuevo registrado desde caja · ${name}`);
    trackAction('crear-cliente');
    closeModal(); toast('Cliente creado'); openCajaProcess(cl.id);
  });
  $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
}
function openCajaProcess(clientId){
  const c = cliOf(clientId);
  const vs = DB.vehicles.filter(v=>v.clientId===clientId);
  const matchAppt = DB.appts.find(a=>a.clientId===clientId && ['Pendiente','Confirmada','Inasistente'].includes(a.status)
    && Math.abs(daysTo(a.date))<=3);
  modal(`Proceso y pago · ${c.name}`,`
    ${matchAppt?`<div class="note-box" style="margin-bottom:16px"><b>Cita encontrada</b>Este cliente tenía una cita el ${fmtDate(matchAppt.date)} a las ${matchAppt.time} (${matchAppt.status}). Al guardar, se marcará como asistida y se conserva la comisión del asesor.</div>`:''}
    <div class="fgrid">
      <div><label class="flabel">Placa</label><select id="cpPlate" class="finput">${vs.map(v=>`<option value="${v.plate}">${v.plate} · ${v.cat}</option>`).join('')||'<option value="">Sin vehículos</option>'}</select></div>
      <div><label class="flabel">Servicio</label><select id="cpSrv" class="finput">${SERVICES.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
      <div><label class="flabel">Valor cobrado</label><input id="cpAmount" class="finput" inputmode="numeric" placeholder="150000"></div>
      <div><label class="flabel">Cuenta de destino</label><select id="cpAcc" class="finput">${DB.bankAccounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select></div>
    </div>`,
    `<button class="btn btn-o" data-mclose>Cancelar</button><button class="btn btn-p" id="cpSave">Registrar</button>`);
  $('#cpSave').addEventListener('click',()=>{
    const amount=+($('#cpAmount').value.replace(/\D/g,''));
    if(!amount) return toast('Ingresa el valor cobrado');
    const plate=$('#cpPlate').value;
    DB.cashLedger.unshift({id:uid('l'),date:iso(today),accountId:$('#cpAcc').value,
      concept:`${SERVICES.find(s=>s.id===$('#cpSrv').value).name} · ${plate}`,amount,type:'ingreso'});
    const acc=DB.bankAccounts.find(a=>a.id===$('#cpAcc').value); acc.balance+=amount;
    if(matchAppt){
      matchAppt.status='Completada'; matchAppt.confirmedArrival=true;
      logAct(`Cita retomada automáticamente desde caja · ${plate} → Completada (comisión conservada)`);
    }
    const v=vehByPlate(plate);
    if(v){ DB.revisions.push({id:uid('r'),vehicleId:v.id,date:iso(today),result:'Aprobada',notes:'Registrada desde caja.'}); v.due=iso(addDays(today,365)); }
    logAct(`Proceso y pago registrado · ${c.name} · ${plate} · ${COP(amount)}`);
    trackAction('registrar-pago');
    closeModal(); renderAdmin(); toast('Proceso y pago registrados');
  });
  $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
}

/* ---------- GUÍA DE CREDENCIALES (PDF para gerencia) ---------- */
function generarGuiaCredenciales(){
  const ref=docRef('general').replace('IG','GC');
  const logo=(typeof LOGO_SRC!=='undefined')?LOGO_SRC:'assets/logo.png';
  const cards=USERS.map(u=>{
    const r=ROLES[u.role];
    return `<div class="cred">
      <div class="cred-hd" style="background:${r.color}">
        <b>${r.label}</b><span>${r.desc}</span>
      </div>
      <div class="cred-bd">
        <div class="cred-person">${u.name}</div>
        <div class="cred-row"><span>Usuario</span><b>${u.username}</b></div>
        <div class="cred-row"><span>Contraseña</span><b>Personal · la define cada usuario</b></div>
        <div class="cred-acc"><span>Módulos habilitados</span><p>${r.nav.map(k=>NAV_META[k]?NAV_META[k].label:k).join(' · ')}</p></div>
      </div></div>`;}).join('');
  openDoc(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Guía de credenciales</title>
  <style>
    @page{size:letter;margin:20mm 16mm}
    *{box-sizing:border-box}
    body{font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#15201A;margin:0;font-size:12px}
    .hd{display:flex;align-items:flex-start;gap:18px;border-bottom:3px solid #164A26;padding-bottom:16px;margin-bottom:8px}
    .hd img{height:58px;object-fit:contain}
    .hd-txt h1{font-size:20px;color:#0F3319;margin:0 0 3px}
    .hd-txt p{font-size:12px;color:#4B564F;margin:0}
    .hd-org{margin-left:auto;text-align:right;font-size:10px;color:#6E786C;line-height:1.6}
    .hd-org b{display:block;color:#0F3319;font-size:12px}
    .refbar{display:flex;justify-content:space-between;background:#EAF6EC;border-radius:6px;
      padding:8px 12px;font-size:10.5px;color:#164A26;margin-bottom:18px}
    .refbar b{font-family:'Courier New',monospace}
    .warn{background:#FFF6E0;border-left:3px solid #FAC800;padding:11px 14px;font-size:10.5px;
      color:#7A5A00;border-radius:0 6px 6px 0;margin-bottom:20px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .cred{border:1px solid #E4E2D7;border-radius:9px;overflow:hidden;page-break-inside:avoid}
    .cred-hd{padding:11px 14px;color:#fff}
    .cred-hd b{display:block;font-size:13px}
    .cred-hd span{font-size:9.5px;opacity:.85}
    .cred-bd{padding:13px 14px}
    .cred-person{font-weight:700;font-size:12.5px;margin-bottom:9px;color:#0F3319}
    .cred-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F2F0E8;font-size:11px}
    .cred-row b{font-family:'Courier New',monospace;background:#EAF6EC;padding:2px 8px;border-radius:4px;color:#164A26}
    .cred-acc{margin-top:10px}
    .cred-acc span{font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#8A8578;font-weight:600}
    .cred-acc p{font-size:9.5px;color:#4B564F;margin:3px 0 0;line-height:1.5}
    h2{font-size:13px;color:#0F3319;margin:26px 0 8px;padding-bottom:5px;border-bottom:1.5px solid #EAF6EC}
    table{width:100%;border-collapse:collapse}
    th{background:#164A26;color:#fff;text-align:left;padding:7px 10px;font-size:9.5px;text-transform:uppercase}
    td{padding:8px 10px;border-bottom:1px solid #EFEDE4;font-size:10.5px}
    .ft{margin-top:26px;padding-top:12px;border-top:1px solid #E4E2D7;font-size:9px;color:#8A8578;
      display:flex;justify-content:space-between}
  </style></head><body>
    <div class="hd"><img src="${logo}" alt="">
      <div class="hd-txt"><h1>Guía de acceso al sistema</h1><p>Credenciales y permisos por perfil de usuario</p></div>
      <div class="hd-org"><b>CDA REVITOLIMA</b>NIT 901.841.056-1<br>Calle 111 #20-25 Sur<br>Ibagué, Tolima</div>
    </div>
    <div class="refbar"><span>Documento N° <b>${ref}</b></span><span>Generado: <b>${new Date().toLocaleString('es-CO')}</b></span><span>Confidencial</span></div>
    <div class="warn"><b>⚠ Documento confidencial.</b> Entregar únicamente a la gerencia. Cada usuario debe cambiar su contraseña en el primer ingreso y no compartirla. El sistema registra todas las acciones por usuario.</div>
    <div class="grid">${cards}</div>
    <h2>Qué puede hacer cada perfil</h2>
    <table><thead><tr><th>Perfil</th><th>Alcance</th><th>Informes</th></tr></thead><tbody>
      <tr><td><b>Superusuario</b></td><td>Ve gráficas, informes y generalidades de todas las áreas. Enfocado en seguimiento, control y revisión. Puede editar.</td><td>Todos, incluidos gerenciales y financieros</td></tr>
      <tr><td><b>Superadministrador</b></td><td>Todo lo del superusuario, más la gestión interna de usuarios y permisos.</td><td>Todos, sin restricción</td></tr>
      <tr><td><b>Usuario administrador</b></td><td>Caja y digitación: registra clientes, citas, procesos, pagos y redime bonos.</td><td>Operativos únicamente</td></tr>
      <tr><td><b>Usuario asesor</b></td><td>Agenda citas y preventivas, gestiona sus prospectos y consulta su arqueo de comisiones.</td><td>Operativos de su gestión</td></tr>
    </tbody></table>
    <h2>Regla de comisión vigente</h2>
    <table><tbody>
      <tr><td>Valor por vehículo atendido</td><td><b>${COP(DB.config.comisionPorCita)}</b></td></tr>
      <tr><td>Meta mensual por asesor</td><td><b>${DB.config.metaMensualVehiculos} vehículos</b></td></tr>
      <tr><td>Condición</td><td>La comisión empieza a sumar únicamente al alcanzar la meta</td></tr>
      <tr><td>Reinicio de contadores</td><td>Automático el día 1 de cada mes</td></tr>
    </tbody></table>
    <div class="ft"><span>CDA REVITOLIMA · NIT 901.841.056-1 · Documento confidencial</span><span>${ref}</span></div>
    <script>window.onload=()=>window.print();<\/script>
  </body></html>`);
  logAct('Guía de credenciales generada');
}

/* ---------- USUARIOS Y PERMISOS ---------- */
/* helpers admin */
const ICONS={
  car:'<path d="M3 13l1.6-4.8A2 2 0 0 1 6.5 7h11a2 2 0 0 1 1.9 1.2L21 13"/><rect x="2" y="13" width="20" height="6" rx="1.6"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 11h18"/>',
  money:'<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  card:'<rect x="2" y="5" width="20" height="14" rx="2.4"/><path d="M2 10h20"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  alert:'<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  chart:'<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>',
  bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'
};
function kpi(label,val,ico,desc,cls=''){
  return `<div class="kpi ${cls}">
    <div class="kpi-t"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">${ICONS[ico]||''}</svg>${label}</div>
    <div class="kpi-v">${val}</div><div class="kpi-d">${desc}</div></div>`;
}
function panelTable(title,sub,tools,inner){
  return `<div class="panel"><div class="panel-h"><div><h3>${title}</h3><p>${sub}</p></div>${tools}</div>
    <div class="panel-b flush"><div class="tw"><table>${inner}</table></div></div></div>`;
}
function alertsAdmin(){
  const items=[];
  DB.cartera.filter(k=>k.status==='Vencida').forEach(k=>{
    const c=cliOf(k.clientId);
    items.push({cls:'dan',t:`Cartera vencida · ${c.name}`,p:`${COP(k.amount)} — venció el ${fmtDate(k.due)} (${Math.abs(daysTo(k.due))} días de mora).`});
  });
  DB.vehicles.filter(v=>v.due&&daysTo(v.due)<0).forEach(v=>{
    const c=cliOf(v.clientId);
    items.push({cls:'dan',t:`Revisión vencida · ${v.plate}`,p:`${c.name} — venció el ${fmtDate(v.due)}. Contactar para reagendar.`});
  });
  DB.appts.filter(a=>a.status==='Pendiente'&&daysTo(a.date)>=0).forEach(a=>{
    items.push({cls:'warn',t:`Cita sin confirmar · ${a.plate}`,p:`${a.name} — ${fmtDate(a.date)} a las ${a.time}. Confirmar con el cliente.`});
  });
  DB.credits.filter(f=>f.status==='Pendiente').forEach(f=>{
    const c=cliOf(f.clientId);
    items.push({cls:'warn',t:`Crédito en trámite · ${c.name}`,p:`${f.entidad} — ${COP(f.amount)} solicitado el ${fmtDate(f.dateSolicitud)}, sin resolver.`});
  });
  if(!items.length) return `<div class="alertbar ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6 9 17l-5-5"/></svg><div><b>Sin alertas pendientes</b><p>No hay mora, vencimientos ni citas sin confirmar.</p></div></div>`;
  return items.slice(0,6).map(i=>`<div class="alertbar ${i.cls}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
    <div><b>${i.t}</b><p>${i.p}</p></div></div>`).join('');
}

/* draw tables */
function drawCitas(){
  const q=($('#fCitas')?.value||'').toLowerCase(), st=$('#fCitasSt')?.value||'';
  const rows=DB.appts.filter(a=>(!st||a.status===st) &&
    (!q||a.plate.toLowerCase().includes(q)||a.name.toLowerCase().includes(q)))
    .sort((a,b)=>a.date<b.date?1:-1);
  $('#tbCitas').innerHTML = rows.length?rows.map(a=>`<tr>
    <td><b>${fmtDate(a.date)}</b></td><td class="num">${a.time}</td>
    <td><b>${a.name}</b><small>${a.phone}</small></td>
    <td><span class="plate">${a.plate}</span></td>
    <td>${a.type==='moto'?'Moto':'Carro'}</td><td><small style="margin:0">${a.source}</small></td>
    <td>${apStatus(a.status)}</td>
    <td class="tact">
      <button class="iconbtn" data-apst="${a.id}" title="Cambiar estado"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg></button>
      <a class="iconbtn" href="https://wa.me/57${a.phone}?text=${encodeURIComponent(`Hola ${a.name.split(' ')[0]}, te confirmamos tu cita en CDA Revitolima para el ${fmtDate(a.date)} a las ${a.time}, placa ${a.plate}.`)}" target="_blank" rel="noopener" title="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/></svg></a>
    </td></tr>`).join('')
    :`<tr><td colspan="8">${emptyBox('Sin citas','No hay citas que coincidan con el filtro.')}</td></tr>`;
  $$('[data-apst]').forEach(b=>b.addEventListener('click',()=>{
    const a=DB.appts.find(x=>x.id===b.dataset.apst);
    modal('Cambiar estado de la cita',
      `<p style="font-size:.88rem;color:var(--ink-2);margin-bottom:14px">${a.name} · placa ${a.plate} · ${fmtDate(a.date)} ${a.time}</p>
       <label class="flabel">Estado</label><select id="stSel" class="finput">${['Pendiente','Confirmada','Completada','Cancelada'].map(s=>`<option ${s===a.status?'selected':''}>${s}</option>`).join('')}</select>`,
      `<button class="btn btn-o" data-mclose>Cancelar</button><button class="btn btn-p" id="stSave">Guardar</button>`);
    $('#stSave').addEventListener('click',()=>{
      a.status=$('#stSel').value;
      if(a.status==='Completada'){
        const v=vehByPlate(a.plate);
        if(v){ DB.revisions.push({id:uid('r'),vehicleId:v.id,date:a.date,result:'Aprobada',notes:'Registrada desde la cita.'});
               v.due=iso(addDays(new Date(a.date+'T00:00:00'),365)); }
      }
      logAct(`Estado de cita actualizado · ${a.plate} → ${a.status}`);
      closeModal(); renderAdmin(); toast('Estado actualizado');
    });
    $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
  }));
}
function drawCli(){
  const q=($('#fCli')?.value||'').toLowerCase();
  const rows=DB.clients.filter(c=>!q||c.name.toLowerCase().includes(q)||c.doc.includes(q));
  $('#tbCli').innerHTML = rows.length?rows.map(c=>{
    const vs=DB.vehicles.filter(v=>v.clientId===c.id);
    const deuda=DB.cartera.filter(k=>k.clientId===c.id&&k.status!=='Pagada').reduce((s,k)=>s+k.amount,0);
    const hasMora=DB.cartera.some(k=>k.clientId===c.id&&k.status==='Vencida');
    const f=DB.credits.filter(x=>x.clientId===c.id);
    return `<tr>
      <td><b>${c.name}</b>${c.notes?`<small>${c.notes}</small>`:''}</td>
      <td class="num">${c.doc}</td>
      <td class="num">${c.phone}<small style="margin:0">${c.email||'Sin correo'}</small></td>
      <td>${vs.map(v=>`<span class="plate" style="margin:1px">${v.plate}</span>`).join(' ')||'—'}</td>
      <td>${deuda?`<b class="num" style="color:${hasMora?'var(--danger)':'var(--warn)'}">${COP(deuda)}</b>`:'<span class="pill pill-ok">Al día</span>'}</td>
      <td>${f.length?f.map(x=>`<span class="pill ${x.status==='Desembolsado'?'pill-ok':x.status==='Rechazado'?'pill-dan':'pill-warn'}" style="margin:1px">${x.entidad}</span>`).join(''):'<small style="margin:0">—</small>'}</td>
      <td><button class="iconbtn" data-cliv="${c.id}" title="Ver ficha"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></button></td>
    </tr>`;}).join('')
    :`<tr><td colspan="7">${emptyBox('Sin clientes','No hay clientes que coincidan con la búsqueda.')}</td></tr>`;
  $$('[data-cliv]').forEach(b=>b.addEventListener('click',()=>openCli(b.dataset.cliv)));
}
function openCli(id){
  const c=cliOf(id);
  const vs=DB.vehicles.filter(v=>v.clientId===id);
  const ap=DB.appts.filter(a=>a.clientId===id).sort((a,b)=>a.date<b.date?1:-1);
  const rv=DB.revisions.filter(r=>vs.some(v=>v.id===r.vehicleId)).sort((a,b)=>a.date<b.date?1:-1);
  const kr=DB.cartera.filter(k=>k.clientId===id);
  const fn=DB.credits.filter(f=>f.clientId===id);
  const rm=DB.reminders.filter(m=>vs.some(v=>v.plate===m.plate));
  modal(c.name,`
    <div style="display:flex;gap:9px;flex-wrap:wrap;margin-bottom:18px">
      <span class="pill pill-neu">C.C. ${c.doc}</span><span class="pill pill-neu">${c.phone}</span>
      ${c.email?`<span class="pill pill-neu">${c.email}</span>`:''}</div>
    ${c.notes?`<div class="note-box" style="margin-bottom:16px"><b>Observaciones internas</b>${c.notes}</div>`:''}
    <h4 style="font-family:'Plus Jakarta Sans';font-size:.9rem;margin-bottom:9px">Vehículos (${vs.length})</h4>
    ${vs.map(v=>`<div class="vrow"><span><span class="plate">${v.plate}</span> ${v.cat}</span><span>${v.due?fmtDate(v.due):'Sin vencimiento'} ${dueBadge(v.due)}</span></div>`).join('')||'<p style="font-size:.85rem;color:var(--ink-3)">Sin vehículos.</p>'}
    <h4 style="font-family:'Plus Jakarta Sans';font-size:.9rem;margin:18px 0 9px">Citas (${ap.length})</h4>
    ${ap.slice(0,5).map(a=>`<div class="vrow"><span>${fmtDate(a.date)} · ${a.time} · ${a.plate}</span><span>${apStatus(a.status)}</span></div>`).join('')||'<p style="font-size:.85rem;color:var(--ink-3)">Sin citas.</p>'}
    <h4 style="font-family:'Plus Jakarta Sans';font-size:.9rem;margin:18px 0 9px">Revisiones (${rv.length})</h4>
    ${rv.slice(0,5).map(r=>`<div class="vrow"><span>${fmtDate(r.date)} · ${vehOf(r.vehicleId).plate}${r.notes?` <small style="color:var(--ink-3)">— ${r.notes}</small>`:''}</span><span class="pill ${r.result==='Rechazada'?'pill-dan':r.result==='Reaprobada'?'pill-warn':'pill-ok'}">${r.result}</span></div>`).join('')||'<p style="font-size:.85rem;color:var(--ink-3)">Sin revisiones.</p>'}
    <h4 style="font-family:'Plus Jakarta Sans';font-size:.9rem;margin:18px 0 9px">Cartera</h4>
    ${kr.map(k=>`<div class="vrow"><span>${k.concept}</span><span class="num">${COP(k.amount)} ${k.status==='Vencida'?'<span class="pill pill-dan">Vencida</span>':k.status==='Pagada'?'<span class="pill pill-ok">Pagada</span>':'<span class="pill pill-warn">Pendiente</span>'}</span></div>`).join('')||'<p style="font-size:.85rem;color:var(--ink-3)">Sin obligaciones.</p>'}
    <h4 style="font-family:'Plus Jakarta Sans';font-size:.9rem;margin:18px 0 9px">Créditos</h4>
    ${fn.map(f=>`<div class="vrow"><span>${f.entidad} · ${COP(f.amount)}</span><span class="pill ${f.status==='Desembolsado'?'pill-ok':f.status==='Rechazado'?'pill-dan':'pill-warn'}">${f.status}</span></div>`).join('')||'<p style="font-size:.85rem;color:var(--ink-3)">Sin solicitudes.</p>'}
    <h4 style="font-family:'Plus Jakarta Sans';font-size:.9rem;margin:18px 0 9px">Recordatorios enviados</h4>
    ${rm.map(m=>`<div class="vrow"><span>${m.plate} · ${m.channel}</span><span>${fmtDate(m.due)}</span></div>`).join('')||'<p style="font-size:.85rem;color:var(--ink-3)">Sin recordatorios.</p>'}`,
    `<a class="btn btn-wa" href="https://wa.me/57${c.phone}" target="_blank" rel="noopener">Contactar</a><button class="btn btn-o" data-mclose>Cerrar</button>`);
  $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
}
function drawVeh(){
  const q=($('#fVeh')?.value||'').toLowerCase(), t=$('#fVehT')?.value||'';
  const rows=DB.vehicles.filter(v=>(!t||v.type===t)&&(!q||v.plate.toLowerCase().includes(q)));
  $('#tbVeh').innerHTML = rows.length?rows.map(v=>{
    const c=cliOf(v.clientId);
    const lr=DB.revisions.filter(r=>r.vehicleId===v.id).sort((a,b)=>a.date<b.date?1:-1)[0];
    return `<tr><td><span class="plate">${v.plate}</span></td><td>${v.cat}</td>
      <td><b>${c.name}</b><small>${c.phone}</small></td>
      <td>${lr?fmtDate(lr.date):'Sin registro'}${lr&&lr.result==='Rechazada'?'<small style="color:var(--danger)">Rechazada</small>':lr&&lr.result==='Reaprobada'?'<small style="color:var(--warn)">Reaprobada</small>':''}</td>
      <td>${v.due?fmtDate(v.due):'—'}</td><td>${dueBadge(v.due)}</td>
      <td class="tact">
        <button class="iconbtn" data-cliv="${v.clientId}" title="Ver propietario"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></button>
        <button class="iconbtn" data-newrev="${v.id}" title="Registrar resultado de revisión"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></button>
      </td></tr>`;}).join('')
    :`<tr><td colspan="7">${emptyBox('Sin vehículos','No hay vehículos que coincidan con el filtro.')}</td></tr>`;
  $$('[data-cliv]').forEach(b=>b.addEventListener('click',()=>openCli(b.dataset.cliv)));
  $$('[data-newrev]').forEach(b=>b.addEventListener('click',()=>{
    const v=DB.vehicles.find(x=>x.id===b.dataset.newrev);
    modal(`Registrar revisión · ${v.plate}`,`
      <div class="fgrid">
        <div><label class="flabel">Fecha</label><input type="date" id="rvDate" class="finput" value="${iso(today)}"></div>
        <div><label class="flabel">Resultado</label><select id="rvRes" class="finput"><option>Aprobada</option><option>Rechazada</option><option>Reaprobada</option></select></div>
      </div>
      <label class="flabel" style="margin-top:14px">Observaciones</label>
      <textarea id="rvObs" class="finput" rows="3" placeholder="Detalle de lo revisado, hallazgos o correcciones..."></textarea>`,
      `<button class="btn btn-o" data-mclose>Cancelar</button><button class="btn btn-p" id="rvSave">Guardar</button>`);
    $('#rvSave').addEventListener('click',()=>{
      const res=$('#rvRes').value;
      DB.revisions.push({id:uid('r'),vehicleId:v.id,date:$('#rvDate').value,result:res,notes:$('#rvObs').value.trim()});
      if(res!=='Rechazada') v.due=iso(addDays(new Date($('#rvDate').value+'T00:00:00'),365));
      logAct(`Revisión registrada · ${v.plate} → ${res}`);
      closeModal(); renderAdmin(); toast('Revisión registrada en el historial del vehículo');
    });
    $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
  }));
}
function drawCart(){
  const st=$('#fCart')?.value||'';
  const rows=[...DB.cartera].filter(k=>!st||k.status===st).sort((a,b)=>daysTo(a.due)-daysTo(b.due));
  $('#tbCart').innerHTML = rows.length?rows.map(k=>{
    const c=cliOf(k.clientId), d=daysTo(k.due);
    const ant = k.status==='Pagada'?'—':d<0?`${Math.abs(d)} días de mora`:`Vence en ${d} días`;
    return `<tr><td><b>${c.name}</b><small>${c.phone}</small></td><td>${k.concept}</td>
      <td class="num">${COP(k.amount)}</td><td>${fmtDate(k.due)}</td>
      <td><small style="margin:0;color:${d<0&&k.status!=='Pagada'?'var(--danger)':'var(--ink-3)'}">${ant}</small></td>
      <td><span class="pill ${k.status==='Vencida'?'pill-dan':k.status==='Pagada'?'pill-ok':'pill-warn'}">${k.status}</span></td>
      <td class="tact">
        ${k.status!=='Pagada'?`<button class="iconbtn" data-pay="${k.id}" title="Marcar como pagada"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg></button>`:''}
        <a class="iconbtn" href="https://wa.me/57${c.phone}?text=${encodeURIComponent(`Hola ${c.name.split(' ')[0]}, le escribimos de CDA Revitolima para recordarle su obligación pendiente de ${COP(k.amount)} por concepto de ${k.concept}.`)}" target="_blank" rel="noopener" title="Gestionar cobro"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/></svg></a>
      </td></tr>`;}).join('')
    :`<tr><td colspan="7">${emptyBox('Sin registros','No hay obligaciones con ese estado.')}</td></tr>`;
  $$('[data-pay]').forEach(b=>b.addEventListener('click',()=>{
    const k=DB.cartera.find(x=>x.id===b.dataset.pay);
    k.status='Pagada'; logAct(`Obligación marcada como pagada · ${cliOf(k.clientId).name} · ${COP(k.amount)}`);
    renderAdmin(); toast('Obligación marcada como pagada');
  }));
}
function creditKpis(){
  const all = DB.credits;
  const desemb = all.filter(f=>f.status==='Desembolsado');
  const pend = all.filter(f=>f.status==='Pendiente');
  const totalDesemb = desemb.reduce((s,f)=>s+f.amount,0);
  const totalPend = pend.reduce((s,f)=>s+f.amount,0);
  const tiempos = desemb.filter(f=>f.dateDesembolso).map(f=>
    Math.round((new Date(f.dateDesembolso)-new Date(f.dateSolicitud))/86400000));
  const tProm = tiempos.length? Math.round(tiempos.reduce((a,b)=>a+b,0)/tiempos.length):null;
  // Proyección simple a 3 meses: si la cartera pendiente se desembolsa al mismo ritmo historico,
  // se distribuye segun el tiempo promedio de desembolso observado.
  const tasaAprob = all.length? desemb.length/(desemb.length+all.filter(f=>f.status==='Rechazado').length||1):0;
  const proyectado = Math.round(totalPend*(tasaAprob||0.6));
  return {totalDesemb, totalPend, tProm, proyectado, desembCount:desemb.length, pendCount:pend.length};
}
function drawFin(){
  const st=$('#fFin')?.value||'';
  const k = creditKpis();
  $('#finKpis').innerHTML = `
    ${kpi('Desembolsado histórico',COP(k.totalDesemb),'money',`${k.desembCount} crédito(s) desembolsados`)}
    ${kpi('En trámite con la entidad',COP(k.totalPend),'clock',`${k.pendCount} solicitud(es) pendientes`,'warn')}
    ${kpi('Tiempo promedio de desembolso',k.tProm!=null?k.tProm+' días':'Sin datos','cal','Desde la solicitud hasta el giro')}
    ${kpi('Proyección próximos 3 meses',COP(k.proyectado),'chart','Cartera pendiente × tasa histórica de aprobación')}`;
  const rows=DB.credits.filter(f=>!st||f.status===st).sort((a,b)=>a.dateSolicitud<b.dateSolicitud?1:-1);
  $('#tbFin').innerHTML = rows.length?rows.map(f=>{
    const c=cliOf(f.clientId);
    const dias = f.dateDesembolso? Math.round((new Date(f.dateDesembolso)-new Date(f.dateSolicitud))/86400000)+' días' : '—';
    return `<tr><td><b>${c.name}</b><small>${c.phone}</small></td>
      <td><span class="pill pill-neu">${f.entidad}</span></td>
      <td class="num">${COP(f.amount)}</td>
      <td>${fmtDate(f.dateSolicitud)}</td>
      <td>${f.dateDesembolso?fmtDate(f.dateDesembolso):'—'}</td>
      <td><small style="margin:0">${dias}</small></td>
      <td><small style="margin:0">${f.diaPago||'—'}</small></td>
      <td><span class="pill ${f.status==='Desembolsado'?'pill-ok':f.status==='Rechazado'?'pill-dan':'pill-warn'}">${f.status}</span></td>
      <td><button class="iconbtn" data-finst="${f.id}" title="Actualizar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button></td></tr>`;}).join('')
    :`<tr><td colspan="9">${emptyBox('Sin solicitudes','No hay créditos con ese estado.')}</td></tr>`;
  $$('[data-finst]').forEach(b=>b.addEventListener('click',()=>{
    const f=DB.credits.find(x=>x.id===b.dataset.finst);
    modal('Actualizar crédito',
      `<p style="font-size:.88rem;color:var(--ink-2);margin-bottom:14px">${cliOf(f.clientId).name} · ${f.entidad} · ${COP(f.amount)} · solicitud del ${fmtDate(f.dateSolicitud)}</p>
       <div class="fgrid">
         <div><label class="flabel">Estado</label><select id="fnSt" class="finput">${['Pendiente','Desembolsado','Rechazado'].map(s=>`<option ${s===f.status?'selected':''}>${s}</option>`).join('')}</select></div>
         <div><label class="flabel">Fecha de desembolso</label><input type="date" id="fnDesem" class="finput" value="${f.dateDesembolso||''}"></div>
         <div><label class="flabel">Día de pago</label><input id="fnDia" class="finput" placeholder="Ej: Día 5 de cada mes" value="${f.diaPago||''}"></div>
         <div><label class="flabel">Responsable</label><input id="fnOw" class="finput" value="${f.owner}"></div>
       </div>
       <label class="flabel" style="margin-top:14px">Observaciones</label><textarea id="fnNt" class="finput" rows="3">${f.notes||''}</textarea>`,
      `<button class="btn btn-o" data-mclose>Cancelar</button><button class="btn btn-p" id="fnSave">Guardar</button>`);
    $('#fnSave').addEventListener('click',()=>{
      f.status=$('#fnSt').value; f.dateDesembolso=$('#fnDesem').value||null;
      f.diaPago=$('#fnDia').value.trim()||null; f.owner=$('#fnOw').value.trim(); f.notes=$('#fnNt').value.trim();
      logAct(`Crédito actualizado · ${cliOf(f.clientId).name} → ${f.status}`);
      closeModal(); renderAdmin(); toast('Crédito actualizado · visible en el portal del cliente');
    });
    $$('[data-mclose]').forEach(x=>x.addEventListener('click',closeModal));
  }));
}

/* config */
function bindCfg(){
  const num=v=>{const n=String(v).replace(/\D/g,'');return n?+n:null;};
  $('#saveTar')?.addEventListener('click',()=>{
    DB.config.tarifas.carro.rtm=num($('#tCarRtm').value);
    DB.config.tarifas.carro.reinsp=num($('#tCarRe').value);
    DB.config.tarifas.moto.rtm=num($('#tMotRtm').value);
    DB.config.tarifas.moto.reinsp=num($('#tMotRe').value);
    logAct('Tarifas de referencia interna actualizadas');
    toast('Referencia interna guardada (no se publica en el sitio)');
  });
  $('#saveCfg')?.addEventListener('click',()=>{
    DB.config.direccion=$('#cfgAddr').value.trim();
    DB.config.telefono=$('#cfgTel').value.trim();
    DB.config.horarioDom=$('#cfgHrs').value.trim();
    $('#addrPub').textContent=DB.config.direccion;
    logAct('Datos de contacto actualizados');
    toast('Datos actualizados en el sitio');
  });
  $('#saveInt')?.addEventListener('click',()=>{
    const v=$('#cfgInt').value.split(',').map(x=>parseInt(x)).filter(x=>!isNaN(x)&&x>0);
    if(!v.length) return toast('Ingresa al menos un intervalo válido');
    DB.config.intervalos=v.sort((a,b)=>b-a);
    $('#remIntervals').textContent=DB.config.intervalos.join(', ')+' días antes';
    logAct('Intervalos de recordatorio actualizados');
    toast('Intervalos actualizados');
  });
  $('#saveSlots')?.addEventListener('click',()=>{
    const v=$('#cfgSlots').value.split(',').map(x=>x.trim()).filter(x=>/^\d{1,2}:\d{2}$/.test(x));
    if(!v.length) return toast('Formato inválido. Usa HH:MM separados por coma');
    DB.config.slots=v; renderSlots(); logAct('Turnos de agendamiento actualizados');
    renderAdmin(); toast('Turnos actualizados');
  });
}

/* ---------- EXPORTACIONES CSV ---------- */
function csv(rows){
  return '\uFEFF'+rows.map(r=>r.map(c=>{
    const s=String(c??'');
    return /[";\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  }).join(';')).join('\r\n');
}
function download(name,content){
  const b=new Blob([content],{type:'text/csv;charset=utf-8;'});
  const u=URL.createObjectURL(b), a=document.createElement('a');
  a.href=u; a.download=name; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(u);
}
const EXPORTS={
  clientes:()=>[['Nombre','Documento','Celular','Correo','Vehiculos','Cartera pendiente','Observaciones'],
    ...DB.clients.map(c=>[c.name,c.doc,c.phone,c.email,
      DB.vehicles.filter(v=>v.clientId===c.id).map(v=>v.plate).join(' / '),
      DB.cartera.filter(k=>k.clientId===c.id&&k.status!=='Pagada').reduce((s,k)=>s+k.amount,0),c.notes])],
  vehiculos:()=>[['Placa','Tipo','Categoria','Propietario','Documento','Vence','Dias restantes'],
    ...DB.vehicles.map(v=>{const c=cliOf(v.clientId);return [v.plate,v.type,v.cat,c.name,c.doc,v.due||'',v.due?daysTo(v.due):''];})],
  citas:()=>[['Fecha','Hora','Cliente','Celular','Placa','Tipo','Origen','Estado'],
    ...DB.appts.map(a=>[a.date,a.time,a.name,a.phone,a.plate,a.type,a.source,a.status])],
  revisiones:()=>[['Fecha','Placa','Propietario','Resultado','Observaciones'],
    ...DB.revisions.map(r=>{const v=vehOf(r.vehicleId);return [r.date,v.plate,cliOf(v.clientId).name,r.result,r.notes];})],
  vencimientos:()=>[['Placa','Propietario','Celular','Vence','Dias','Estado'],
    ...DB.vehicles.filter(v=>v.due).sort((a,b)=>daysTo(a.due)-daysTo(b.due)).map(v=>{
      const c=cliOf(v.clientId),d=daysTo(v.due);
      return [v.plate,c.name,c.phone,v.due,d,d<0?'Vencida':d<=30?'Por vencer':'Vigente'];})],
  cartera:()=>[['Cliente','Documento','Concepto','Valor','Vence','Dias mora','Estado'],
    ...DB.cartera.map(k=>{const c=cliOf(k.clientId),d=daysTo(k.due);
      return [c.name,c.doc,k.concept,k.amount,k.due,d<0?Math.abs(d):0,k.status];})],
  financiacion:()=>[['Cliente','Documento','Entidad','Valor','Fecha solicitud','Fecha desembolso','Dia de pago','Estado','Responsable','Observaciones'],
    ...DB.credits.map(f=>{const c=cliOf(f.clientId);return [c.name,c.doc,f.entidad,f.amount,f.dateSolicitud,f.dateDesembolso||'',f.diaPago||'',f.status,f.owner,f.notes];})],
  recordatorios:()=>[['Nombre','Placa','Tipo','Vence','Celular','Correo','Canal','Convertido'],
    ...DB.reminders.map(m=>[m.name,m.plate,m.type,m.due,m.phone,m.email,m.channel,m.converted?'Si':'No'])],
  indicadores:()=>{
    const pagos=DB.cartera.filter(k=>k.status==='Pagada').reduce((s,k)=>s+k.amount,0);
    const finAp=DB.credits.filter(f=>f.status==='Desembolsado').reduce((s,f)=>s+f.amount,0);
    const pend=DB.cartera.filter(k=>k.status==='Pendiente').reduce((s,k)=>s+k.amount,0);
    const mora=DB.cartera.filter(k=>k.status==='Vencida').reduce((s,k)=>s+k.amount,0);
    const tot=pend+mora+pagos;
    return [['Indicador','Valor'],
      ['Clientes registrados',DB.clients.length],['Vehiculos registrados',DB.vehicles.length],
      ['Citas totales',DB.appts.length],
      ['Citas completadas',DB.appts.filter(a=>a.status==='Completada').length],
      ['Citas canceladas',DB.appts.filter(a=>a.status==='Cancelada').length],
      ['Revisiones registradas',DB.revisions.length],
      ['Ingresos por pago directo',pagos],['Ingresos por financiacion aprobada',finAp],
      ['Cartera pendiente',pend],['Cartera vencida',mora],
      ['Tasa de mora (%)',tot?Math.round(mora/tot*100):0],
      ['Revisiones por vencer (30 dias)',DB.vehicles.filter(v=>v.due&&daysTo(v.due)>=0&&daysTo(v.due)<=30).length],
      ['Recordatorios registrados',DB.reminders.length],
      ['Conversion recordatorio a cita (%)',DB.reminders.length?Math.round(DB.reminders.filter(m=>m.converted).length/DB.reminders.length*100):0]];
  }
};
function bindExports(){
  $$('[data-exp]').forEach(b=>{
    if(b.dataset.expBound) return; b.dataset.expBound='1';
    b.addEventListener('click',()=>{
      const k=b.dataset.exp, f=EXPORTS[k];
      if(!f) return;
      download(`cda-revitolima-${k}-${iso(today)}.csv`, csv(f()));
      logAct(`Exportación descargada · ${k}`);
      toast(`Archivo de ${k} descargado`);
    });
  });
}
$('#admExportTop').addEventListener('click',()=>{
  download(`cda-revitolima-indicadores-${iso(today)}.csv`, csv(EXPORTS.indicadores()));
  toast('Indicadores exportados');
});

/* ---------- INIT ---------- */
syncPublic();
bkShow(1);
simShow(1);
refreshBadges();
bindExports();

function applyPublicConfig(){
  try{
    $('#remIntervals').textContent = DB.config.intervalos.join(', ')+' días antes';
    $('#addrPub').textContent = DB.config.direccion;
    const bm=$('#btnMaps'); if(bm) bm.href = DB.config.mapsUrl;
    renderStrip(); renderHorarios(); renderFaq();
    if(bk && bk.date) renderSlots();
  }catch(e){ console.warn(e); }
}
if(window.CDA_ENTRY!=='admin'){
  sbConfigPublica().then(cfg=>{
    if(cfg && Object.keys(cfg).length){ Object.assign(DB.config,cfg); applyPublicConfig(); }
  }).catch(()=>{});
}
if(window.CDA_ENTRY==='admin' || window.CDA_ENTRY==='cliente'){
  go(window.CDA_ENTRY);
  document.title = window.CDA_ENTRY==='admin' ? 'CDA Revitolima · Portal administrativo' : 'CDA Revitolima · Portal del cliente';
}
if(window.CDA_ENTRY==='admin'){
  sbAdminResume().then(p=>{
    if(p) startAdminSession(p).catch(()=>adErr('No pudimos cargar los datos. Ingresa de nuevo.'));
  });
}
