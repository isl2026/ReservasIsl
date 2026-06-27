import { useState, useEffect, useCallback } from "react";

// ─── Paleta ISL (fiel al logo real) ──────────────────────────────────────────
const C = {
  verde:   "#5BAD8F",   // verde medio ISL
  verde2:  "#3D8C6A",   // verde oscuro ISL
  verde3:  "#2E7055",   // verde más oscuro para degradados
  celeste: "#7ECBDE",   // celeste claro ISL
  celeste2:"#4BAFC8",   // celeste medio ISL
  fondo:   "#EEF8F4",
  blanco:  "#FFFFFF",
  texto:   "#1C3A2C",
  gris:    "#6B7280",
};

// ─── Logo SVG — fiel al original ISL ─────────────────────────────────────────
// Círculo celeste izquierda, círculo verde derecha, solapan en centro más oscuro
// Texto "ISL" bold gris oscuro, "Medicina Empresarial" gris claro
const ISLLogo = ({size=1, onDark=false}) => {
  const txtColor  = onDark ? "#FFFFFF"  : "#2C3E35";
  const subColor  = onDark ? "#C8EFE0"  : "#6B7280";
  return (
    <svg width={210*size} height={52*size} viewBox="0 0 210 52" xmlns="http://www.w3.org/2000/svg">
      {/* Círculo celeste izquierda */}
      <circle cx="26" cy="26" r="22" fill="#7ECBDE"/>
      {/* Círculo verde derecha */}
      <circle cx="46" cy="26" r="22" fill="#5BAD8F"/>
      {/* Intersección más oscura (mezcla visual) */}
      <circle cx="36" cy="26" r="14" fill="#3D9E78" opacity="0.75"/>
      {/* Texto ISL */}
      <text x="78" y="32" fontFamily="Arial,Helvetica,sans-serif" fontWeight="bold" fontSize="24" fill={txtColor}>ISL</text>
      {/* Subtítulo */}
      <text x="78" y="47" fontFamily="Arial,Helvetica,sans-serif" fontSize="11" fill={subColor}>Medicina Empresarial</text>
    </svg>
  );
};

// ─── Datos iniciales ──────────────────────────────────────────────────────────
const DEFAULT_ESPACIOS = [
  { id:"c1", nombre:"Consultorio 1",    planta:"Planta Baja", tipo:"sala",     activo:true },
  { id:"c2", nombre:"Consultorio 2",    planta:"Planta Baja", tipo:"sala",     activo:true },
  { id:"o1", nombre:"Oficina 1",        planta:"1° Piso",     tipo:"sala",     activo:true },
  { id:"o2", nombre:"Oficina 2",        planta:"1° Piso",     tipo:"sala",     activo:true },
  { id:"sr", nombre:"Sala de Reuniones",planta:"1° Piso",     tipo:"sala",     activo:true },
  { id:"nb1",nombre:"NB-01 (Dell Latitude)",   planta:"", tipo:"notebook", activo:true },
  { id:"nb2",nombre:"NB-02 (Lenovo ThinkPad)", planta:"", tipo:"notebook", activo:true },
  { id:"nb3",nombre:"NB-03 (HP EliteBook)",    planta:"", tipo:"notebook", activo:true },
  { id:"nb4",nombre:"NB-04 (Dell Inspiron)",   planta:"", tipo:"notebook", activo:true },
  { id:"nb5",nombre:"NB-05 (Lenovo IdeaPad)",  planta:"", tipo:"notebook", activo:true },
];

const DEFAULT_USUARIOS = [
  { id:"u1", nombre:"Karina Coordinadora", mail:"karina@islarg.com.ar", rol:"admin",  activo:true },
  { id:"u2", nombre:"Lucia Cañete",        mail:"lucia@islarg.com.ar",  rol:"admin",  activo:true },
  { id:"u3", nombre:"Irma Oviedo",         mail:"irma@islarg.com.ar",   rol:"user",   activo:true },
  { id:"u4", nombre:"Carolina Villarreal", mail:"carolina@islarg.com.ar",rol:"user",  activo:true },
  { id:"u5", nombre:"Patricia Licovich",   mail:"patricia@islarg.com.ar",rol:"user",  activo:true },
];

const HORAS = [
  "07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"
];

const REQS = [
  { id:"cafe",     label:"Café",                           det:false },
  { id:"agua",     label:"Agua",                           det:false },
  { id:"gaseosas", label:"Gaseosas",                       det:false },
  { id:"tv",       label:"TV",                             det:false },
  { id:"nb_req",   label:"Notebook",                       det:false },
  { id:"pizarron", label:"Pizarrón",                       det:false },
  { id:"libreria", label:"Librería",                       det:true  },
  { id:"catering", label:"Desayuno / Merienda / Almuerzo", det:true  },
  { id:"otros",    label:"Otros",                          det:true  },
];

const DIAS = [
  {v:"1",l:"Lunes"},{v:"2",l:"Martes"},{v:"3",l:"Miércoles"},
  {v:"4",l:"Jueves"},{v:"5",l:"Viernes"}
];

// Supabase conectado — sin storage local

const hoy   = () => new Date().toISOString().split("T")[0];
const uid   = () => Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const fmt   = f => { if(!f) return ""; const [y,m,d]=f.split("-"); return d+"/"+m+"/"+y; };
const fmtDT = () => new Date().toLocaleString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});

// ─── Supabase client ─────────────────────────────────────────────────────────
const SUPA_URL = "https://eegczyrvfshaxnwehwbj.supabase.co";
const SUPA_KEY = "sb_publishable_mOeByTEAyqsVhEA5XQd_GQ_grVLgRol";

async function supaFetch(path, opts={}) {
  const res = await fetch(SUPA_URL + "/rest/v1/" + path, {
    headers: {
      "apikey": SUPA_KEY,
      "Authorization": "Bearer " + SUPA_KEY,
      "Content-Type": "application/json",
      "Prefer": opts.prefer || "return=representation",
      ...opts.headers
    },
    ...opts
  });
  if (!res.ok) { const e = await res.text(); console.error("Supabase error:", e); return null; }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Funciones de base de datos ───────────────────────────────────────────────
async function dbGetReservas() {
  return await supaFetch("reservas?select=*&order=creado_en.desc") || [];
}
async function dbGetEspacios() {
  return await supaFetch("espacios?select=*&order=tipo,nombre") || [];
}
async function dbGetUsuarios() {
  return await supaFetch("usuarios?select=id,nombre,mail,rol,activo&order=nombre") || [];
}
async function dbVerificarLogin(id, clave) {
  const res = await supaFetch("rpc/verificar_login", {
    method: "POST",
    body: JSON.stringify({ p_id: id, p_clave: clave })
  });
  return (res && res.length > 0) ? res[0] : null;
}

async function dbInsertReserva(r) {
  return await supaFetch("reservas", {
    method: "POST",
    body: JSON.stringify({
      id: r.id, espacio_id: r.espacioId, usuario_id: r.usuarioId,
      tipo: r.tipo, fecha: r.fecha, h_desde: r.hDesde, h_hasta: r.hHasta,
      responsable: r.responsable, equipo: r.equipo||null, cliente: r.cliente||null,
      personas: r.personas||null, requerimientos: r.requerimientos||[],
      acomp: r.acomp||false, obs: r.obs||null,
      es_rec: r.esRec||false, dias: r.dias||[], f_desde: r.fDesde||null, f_hasta: r.fHasta||null,
      estado: "activa", historial: r.historial||[], creado_en: r.creadoEn
    })
  });
}

async function dbUpdateReserva(id, cambios) {
  const body = {};
  if(cambios.hDesde !== undefined) body.h_desde = cambios.hDesde;
  if(cambios.hHasta !== undefined) body.h_hasta = cambios.hHasta;
  if(cambios.fecha !== undefined) body.fecha = cambios.fecha;
  if(cambios.obs !== undefined) body.obs = cambios.obs;
  if(cambios.estado !== undefined) body.estado = cambios.estado;
  if(cambios.historial !== undefined) body.historial = cambios.historial;
  return await supaFetch("reservas?id=eq."+id, {
    method: "PATCH", body: JSON.stringify(body)
  });
}

async function dbSaveEspacios(lista) {
  for(const e of lista) {
    await supaFetch("espacios?id=eq."+e.id, {
      method: "PATCH",
      body: JSON.stringify({ nombre: e.nombre, planta: e.planta, activo: e.activo })
    });
  }
  // Insert new ones (those not in DB yet)
  const existing = await dbGetEspacios();
  const existIds = existing.map(e=>e.id);
  const nuevos = lista.filter(e=>!existIds.includes(e.id));
  for(const e of nuevos) {
    await supaFetch("espacios", {
      method: "POST",
      body: JSON.stringify({ id:e.id, nombre:e.nombre, planta:e.planta||"", tipo:e.tipo, activo:e.activo })
    });
  }
}

async function dbSaveUsuarios(lista) {
  for(const u of lista) {
    await supaFetch("usuarios?id=eq."+u.id, {
      method: "PATCH",
      body: JSON.stringify({ nombre:u.nombre, mail:u.mail, rol:u.rol, activo:u.activo })
    });
  }
  const existing = await dbGetUsuarios();
  const existIds = existing.map(u=>u.id);
  const nuevos = lista.filter(u=>!existIds.includes(u.id));
  for(const u of nuevos) {
    await supaFetch("usuarios", {
      method: "POST",
      body: JSON.stringify({ id:u.id, nombre:u.nombre, mail:u.mail, rol:u.rol, activo:u.activo })
    });
  }
}

// Mapear snake_case de DB a camelCase del frontend
function mapReserva(r) {
  return {
    id: r.id, espacioId: r.espacio_id, usuarioId: r.usuario_id,
    tipo: r.tipo, fecha: r.fecha, hDesde: r.h_desde, hHasta: r.h_hasta,
    responsable: r.responsable, equipo: r.equipo, cliente: r.cliente,
    personas: r.personas, requerimientos: r.requerimientos||[],
    acomp: r.acomp, obs: r.obs,
    esRec: r.es_rec, dias: r.dias||[], fDesde: r.f_desde, fHasta: r.f_hasta,
    estado: r.estado, historial: r.historial||[], creadoEn: r.creado_en
  };
}

// ─── Helpers de conflicto ─────────────────────────────────────────────────────
function hayConflicto(reservas, espacioId, fecha, hDesde, hHasta, excludeId=null) {
  const fd = new Date(fecha+"T12:00:00");
  const dia = String(fd.getDay());
  return reservas.some(r => {
    if(r.estado==="anulada") return false;
    if(r.espacioId!==espacioId) return false;
    if(r.id===excludeId) return false;
    let fechaOk = false;
    if(r.esRec) fechaOk = r.dias?.includes(dia) && fecha>=r.fDesde && fecha<=r.fHasta;
    else fechaOk = r.fecha===fecha;
    if(!fechaOk) return false;
    return hDesde < r.hHasta && hHasta > r.hDesde;
  });
}

function horasDisponiblesDesde(reservas, espacioId, fecha) {
  return HORAS.filter(h => {
    const sig = HORAS[HORAS.indexOf(h)+1];
    if(!sig) return false;
    return !hayConflicto(reservas, espacioId, fecha, h, sig);
  });
}

// ─── Componentes UI ───────────────────────────────────────────────────────────
const Btn = ({onClick,children,variant="primary",size="md",className=""}) => {
  const base = "font-bold rounded-xl transition-all ";
  const sz = size==="sm"?"px-3 py-1.5 text-xs":size==="lg"?"px-6 py-3 text-base":"px-4 py-2.5 text-sm";
  const vars = {
    primary:  {style:{background:`linear-gradient(135deg,${C.verde},${C.verde2})`}, className:"text-white shadow-sm hover:opacity-90"},
    celeste:  {style:{background:`linear-gradient(135deg,${C.celeste},${C.celeste2})`}, className:"text-white shadow-sm hover:opacity-90"},
    outline:  {style:{border:`2px solid ${C.verde}`}, className:"text-green-800 bg-white hover:bg-green-50"},
    danger:   {style:{}, className:"bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"},
    ghost:    {style:{}, className:"bg-slate-100 text-slate-600 hover:bg-slate-200"},
  }[variant]||{style:{},className:""};
  return <button onClick={onClick} style={vars.style} className={base+sz+" "+vars.className+" "+className}>{children}</button>;
};

function Bdg({c="slate",children}){
  const m={green:"bg-green-100 text-green-800",blue:"bg-sky-100 text-sky-800",
    amber:"bg-amber-100 text-amber-800",red:"bg-red-100 text-red-800",
    slate:"bg-slate-100 text-slate-600",purple:"bg-purple-100 text-purple-800",
    teal:"bg-teal-100 text-teal-800"}[c]||"bg-slate-100 text-slate-600";
  return <span className={"px-2 py-0.5 rounded-full text-xs font-semibold "+m}>{children}</span>;
}

const INP = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 text-slate-700";
const LBL = "block text-xs font-bold mb-1 uppercase tracking-wide";

// ─── Modal correo ─────────────────────────────────────────────────────────────
function ModalMail({r, espacios, usuarios, onClose}){
  if(!r) return null;
  const esp = espacios.find(e=>e.id===r.espacioId)||{};
  const usr = usuarios.find(u=>u.id===r.usuarioId)||{};
  const reqs = (r.requerimientos||[]).map(x=>{
    const d=REQS.find(q=>q.id===x.id);
    return d?(x.detalle?d.label+": "+x.detalle:d.label):x.id;
  }).join(", ");
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-3" style={{background:`linear-gradient(135deg,${C.verde},${C.celeste})`}}>
          <div className="bg-white rounded-xl p-1.5"><ISLLogo size={0.55} onDark={false}/></div>
          <div>
            <p className="text-white font-bold text-sm">Notificación enviada</p>
            <p className="text-green-100 text-xs">Simulación de correo automático</p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs font-mono space-y-1">
            <p><span className="text-slate-400">Para:</span> recepcion@islarg.com.ar</p>
            <p><span className="text-slate-400">CC:</span> {usr.mail||"—"}</p>
            <p><span className="text-slate-400">Asunto:</span> ✅ Reserva #{r.id.slice(-6).toUpperCase()} — {esp.nombre}</p>
            <hr className="border-slate-200 my-2"/>
            <div className="bg-white border border-slate-100 rounded-lg p-3 font-sans text-slate-700 space-y-1">
              <p>📍 <b>Espacio:</b> {esp.planta?esp.planta+" — ":""}{esp.nombre}</p>
              {r.esRec?(<>
                <p>🔁 <b>Días:</b> {DIAS.filter(d=>r.dias?.includes(d.v)).map(d=>d.l).join(", ")}</p>
                <p>📅 <b>Período:</b> {fmt(r.fDesde)} al {fmt(r.fHasta)}</p>
              </>):<p>📅 <b>Fecha:</b> {fmt(r.fecha)}</p>}
              <p>🕐 <b>Horario:</b> {r.hDesde} a {r.hHasta} hs</p>
              <p>👤 <b>Responsable:</b> {r.responsable}</p>
              {r.equipo&&<p>👥 <b>Equipo:</b> {r.equipo}</p>}
              {r.cliente&&<p>🏢 <b>Cliente/Prestador:</b> {r.cliente}</p>}
              {r.personas&&<p>🧑‍🤝‍🧑 <b>Personas:</b> {r.personas}</p>}
              {reqs&&<p>📋 <b>Requerimientos:</b> {reqs}</p>}
              {r.acomp&&<p>🛎️ <b>Acompañamiento de recepción: Sí</b></p>}
              {r.obs&&<p>📝 <b>Obs:</b> {r.obs}</p>}
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center">En producción este correo se envía vía Power Automate.</p>
        </div>
        <div className="px-5 pb-5 flex justify-end">
          <Btn onClick={onClose}>Entendido</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Pantalla de login ────────────────────────────────────────────────────────
function Login({usuarios, onLogin}){
  const [sel,setSel]=useState("");
  const [busq,setBusq]=useState("");
  const [abierto,setAbierto]=useState(false);
  const activos=usuarios.filter(u=>u.activo);
  const filtrados=activos.filter(u=>u.nombre.toLowerCase().includes(busq.toLowerCase()));
  const usuSel=activos.find(u=>u.id===sel);

  const [clave,setClave]=useState("");
  const [error,setError]=useState("");
  const [cargando,setCargando]=useState(false);

  const elegir=(u)=>{setSel(u.id);setBusq(u.nombre);setAbierto(false);setClave("");setError("");};

  const entrar=async()=>{
    if(!sel||!clave||cargando) return;
    setCargando(true); setError("");
    const u=await dbVerificarLogin(sel, clave);
    setCargando(false);
    if(u){ onLogin(sel); } else { setError("Contraseña incorrecta. Intentá de nuevo."); }
  };

  return(
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:`linear-gradient(135deg,${C.verde3} 0%,${C.verde} 50%,${C.celeste} 100%)`}}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header con logo sobre fondo blanco limpio */}
        <div className="px-8 pt-8 pb-6 text-center border-b border-slate-100">
          <div className="flex justify-center mb-3">
            <ISLLogo size={0.85} onDark={false}/>
          </div>
          <h1 className="font-bold text-lg" style={{color:C.texto}}>Sistema de Reservas</h1>
        </div>

        <div className="p-8 space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-2">¿Quién sos?</p>
            <div className="relative">
              <input
                type="text"
                value={busq}
                onChange={e=>{setBusq(e.target.value);setSel("");setAbierto(true);}}
                onFocus={()=>setAbierto(true)}
                placeholder="Escribí tu nombre..."
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                style={{borderColor:abierto?C.verde:""}}
              />
              {busq&&<button onClick={()=>{setBusq("");setSel("");setAbierto(false);}} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-lg">×</button>}
              {abierto&&filtrados.length>0&&(
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                  {filtrados.map(u=>(
                    <button key={u.id} onClick={()=>elegir(u)}
                      className="w-full text-left px-4 py-2.5 hover:bg-green-50 flex items-center justify-between transition-colors border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{u.nombre}</p>
                        <p className="text-xs text-slate-400">{u.mail}</p>
                      </div>
                      {u.rol==="admin"&&<Bdg c="teal">Admin</Bdg>}
                    </button>
                  ))}
                </div>
              )}
              {abierto&&busq.length>0&&filtrados.length===0&&(
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm text-slate-400">
                  No se encontraron resultados
                </div>
              )}
            </div>
          </div>

          {usuSel&&(
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{background:"#F0FBF6",border:`1px solid ${C.verde}44`}}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{background:`linear-gradient(135deg,${C.verde},${C.celeste})`}}>
                {usuSel.nombre.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{color:C.texto}}>{usuSel.nombre}</p>
                <p className="text-xs text-slate-400">{usuSel.mail}</p>
              </div>
              {usuSel.rol==="admin"&&<Bdg c="teal">Admin</Bdg>}
            </div>
          )}

          {usuSel&&(
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">Contraseña</p>
              <input
                type="password"
                value={clave}
                onChange={e=>{setClave(e.target.value);setError("");}}
                onKeyDown={e=>{if(e.key==="Enter")entrar();}}
                placeholder="Ingresá tu contraseña"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                style={{borderColor:error?"#EF4444":(clave?C.verde:"")}}
              />
              {error&&<p className="text-xs mt-1.5" style={{color:"#EF4444"}}>{error}</p>}
            </div>
          )}

          <button
            onClick={entrar}
            disabled={!sel||!clave||cargando}
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all"
            style={{background:(sel&&clave&&!cargando)?`linear-gradient(135deg,${C.verde},${C.celeste})`:"#CBD5E1",cursor:(sel&&clave&&!cargando)?"pointer":"not-allowed"}}>
            {cargando?"Verificando...":"Ingresar al sistema"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Formulario Sala ──────────────────────────────────────────────────────────
function FormSala({espacios,reservas,usuario,onSubmit}){
  const salas=espacios.filter(e=>e.tipo==="sala"&&e.activo);
  const plantas=[...new Set(salas.map(s=>s.planta))];
  const E0={espacioId:"",fecha:"",hDesde:"",hHasta:"",responsable:usuario.nombre,
    equipo:"",cliente:"",personas:"",reqs:[],reqDet:{},acomp:false,obs:"",
    esRec:false,dias:[],fDesde:"",fHasta:""};
  const [f,setF]=useState(E0);
  const [errs,setErrs]=useState({});
  const [conflicto,setConflicto]=useState(false);

  const togReq=id=>setF(p=>({...p,reqs:p.reqs.includes(id)?p.reqs.filter(x=>x!==id):[...p.reqs,id]}));
  const togDia=v=>setF(p=>({...p,dias:p.dias.includes(v)?p.dias.filter(x=>x!==v):[...p.dias,v]}));

  const hDesdeDisp = f.espacioId&&f.fecha ? horasDisponiblesDesde(reservas,f.espacioId,f.fecha) : HORAS.slice(0,-1);
  const hHastaDisp = f.hDesde ? HORAS.filter(h=>h>f.hDesde) : [];

  const validate=()=>{
    const er={};
    if(!f.espacioId) er.esp="Seleccioná un espacio";
    if(!f.esRec&&!f.fecha) er.fecha="Ingresá la fecha";
    if(f.esRec&&f.dias.length===0) er.dias="Seleccioná al menos un día";
    if(f.esRec&&!f.fDesde) er.fDesde="Requerido";
    if(f.esRec&&!f.fHasta) er.fHasta="Requerido";
    if(!f.hDesde) er.hDesde="Seleccioná hora de inicio";
    if(!f.hHasta||f.hHasta<=f.hDesde) er.hHasta="Debe ser posterior a hora desde";
    if(!f.responsable.trim()) er.resp="Requerido";
    return er;
  };

  const submit=()=>{
    const er=validate(); if(Object.keys(er).length){setErrs(er);return;}
    const fechaCheck=f.esRec?f.fDesde:f.fecha;
    if(hayConflicto(reservas,f.espacioId,fechaCheck,f.hDesde,f.hHasta)){
      setConflicto(true); return;
    }
    const rqs=f.reqs.map(id=>({id,detalle:f.reqDet[id]||""}));
    onSubmit({...f,requerimientos:rqs,tipo:"sala",id:uid(),usuarioId:usuario.id,
      creadoEn:fmtDT(),estado:"activa",
      historial:[{accion:"Creada",por:usuario.nombre,fecha:fmtDT()}]});
    setF(E0); setErrs({}); setConflicto(false);
  };

  const e=k=>errs[k]?<p className="text-red-500 text-xs mt-0.5">{errs[k]}</p>:null;

  return(
    <div className="space-y-5">
      {conflicto&&(
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl">🚫</span>
          <div>
            <p className="font-bold text-red-700 text-sm">El espacio ya está reservado en ese horario</p>
            <p className="text-red-600 text-xs mt-0.5">Revisá la grilla de ocupación y elegí otro horario disponible.</p>
            <button onClick={()=>setConflicto(false)} className="text-xs text-red-500 underline mt-1">Cerrar</button>
          </div>
        </div>
      )}
      <div>
        <label className={LBL} style={{color:C.verde2}}>Espacio *</label>
        {plantas.map(planta=>(
          <div key={planta} className="mb-3">
            <p className="text-xs font-bold text-slate-400 mb-1.5">{planta}</p>
            <div className="flex flex-wrap gap-2">
              {salas.filter(s=>s.planta===planta).map(s=>(
                <button key={s.id} type="button" onClick={()=>setF(p=>({...p,espacioId:s.id,hDesde:"",hHasta:""}))}
                  className={"px-3 py-2 rounded-xl text-xs font-semibold border transition-all "+(f.espacioId===s.id?"text-white border-transparent shadow-sm":"bg-white text-slate-600 border-slate-200 hover:border-green-400")}
                  style={f.espacioId===s.id?{background:`linear-gradient(135deg,${C.verde},${C.verde2})`}:{}}>
                  {s.nombre}
                </button>
              ))}
            </div>
          </div>
        ))}
        {e("esp")}
      </div>

      <label className="flex items-center gap-2 cursor-pointer p-3 bg-green-50 rounded-xl border border-green-200">
        <input type="checkbox" checked={f.esRec} onChange={ev=>setF(p=>({...p,esRec:ev.target.checked}))} className="w-4 h-4 accent-green-600"/>
        <span className="text-sm font-semibold text-slate-700">Reserva recurrente (se repite en el tiempo)</span>
      </label>

      {f.esRec?(
        <div className="space-y-4 p-4 rounded-xl border" style={{background:"#F0FBF6",borderColor:C.verde+"55"}}>
          <div>
            <label className={LBL} style={{color:C.verde2}}>Días de la semana *</label>
            <div className="flex flex-wrap gap-2">
              {DIAS.map(d=>(
                <button key={d.v} type="button" onClick={()=>togDia(d.v)}
                  className={"px-3 py-1.5 rounded-lg text-xs font-bold border "+(f.dias.includes(d.v)?"text-white border-transparent":"bg-white text-slate-600 border-slate-200")}
                  style={f.dias.includes(d.v)?{background:C.verde}:{}}>{d.l}</button>
              ))}
            </div>
            {e("dias")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LBL} style={{color:C.verde2}}>Desde *</label>
              <input type="date" value={f.fDesde} min={hoy()} onChange={ev=>setF(p=>({...p,fDesde:ev.target.value}))} className={INP}/>{e("fDesde")}</div>
            <div><label className={LBL} style={{color:C.verde2}}>Hasta *</label>
              <input type="date" value={f.fHasta} min={f.fDesde||hoy()} onChange={ev=>setF(p=>({...p,fHasta:ev.target.value}))} className={INP}/>{e("fHasta")}</div>
          </div>
        </div>
      ):(
        <div>
          <label className={LBL} style={{color:C.verde2}}>Fecha *</label>
          <input type="date" value={f.fecha} min={hoy()} onChange={ev=>setF(p=>({...p,fecha:ev.target.value,hDesde:"",hHasta:""}))} className={INP}/>
          {e("fecha")}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LBL} style={{color:C.verde2}}>Hora desde *</label>
          <select value={f.hDesde} onChange={ev=>setF(p=>({...p,hDesde:ev.target.value,hHasta:""}))} className={INP}>
            <option value="">Seleccioná...</option>
            {hDesdeDisp.map(h=><option key={h} value={h}>{h} hs</option>)}
          </select>{e("hDesde")}
        </div>
        <div>
          <label className={LBL} style={{color:C.verde2}}>Hora hasta *</label>
          <select value={f.hHasta} onChange={ev=>setF(p=>({...p,hHasta:ev.target.value}))} className={INP} disabled={!f.hDesde}>
            <option value="">Seleccioná...</option>
            {hHastaDisp.map(h=><option key={h} value={h}>{h} hs</option>)}
          </select>{e("hHasta")}
        </div>
      </div>

      <div>
        <label className={LBL} style={{color:C.verde2}}>Responsable de reserva *</label>
        <input type="text" value={f.responsable} onChange={ev=>setF(p=>({...p,responsable:ev.target.value}))} className={INP}/>{e("resp")}
      </div>
      <div>
        <label className={LBL} style={{color:C.verde2}}>Equipo de trabajo</label>
        <input type="text" value={f.equipo} onChange={ev=>setF(p=>({...p,equipo:ev.target.value}))} placeholder="Ej: Recursos Humanos..." className={INP}/>
      </div>
      <div>
        <label className={LBL} style={{color:C.verde2}}>Cliente / Prestador</label>
        <input type="text" value={f.cliente} onChange={ev=>setF(p=>({...p,cliente:ev.target.value}))} placeholder="Opcional" className={INP}/>
      </div>
      <div>
        <label className={LBL} style={{color:C.verde2}}>Cantidad de personas</label>
        <input type="number" min="1" value={f.personas} onChange={ev=>setF(p=>({...p,personas:ev.target.value}))} placeholder="Ej: 8" className={INP}/>
      </div>

      <div>
        <label className={LBL} style={{color:C.verde2}}>Requerimientos</label>
        <div className="space-y-2 mt-1">
          {REQS.map(r=>(
            <div key={r.id}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={f.reqs.includes(r.id)} onChange={()=>togReq(r.id)} className="w-4 h-4 accent-green-600"/>
                <span className="text-sm text-slate-700">{r.label}</span>
              </label>
              {r.det&&f.reqs.includes(r.id)&&(
                <input type="text" placeholder="Detalle..." value={f.reqDet[r.id]||""}
                  onChange={ev=>setF(p=>({...p,reqDet:{...p.reqDet,[r.id]:ev.target.value}}))}
                  className="mt-1 ml-6 border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-[calc(100%-1.5rem)] focus:outline-none focus:ring-1 focus:ring-green-300"/>
              )}
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer p-3 bg-green-50 rounded-xl border border-green-200">
        <input type="checkbox" checked={f.acomp} onChange={ev=>setF(p=>({...p,acomp:ev.target.checked}))} className="w-4 h-4 accent-green-600"/>
        <span className="text-sm font-medium text-slate-700">Acompañamiento de recepción</span>
      </label>

      <div>
        <label className={LBL} style={{color:C.verde2}}>Observaciones</label>
        <textarea rows={2} value={f.obs} onChange={ev=>setF(p=>({...p,obs:ev.target.value}))} placeholder="Detalles adicionales..." className={INP+" resize-none"}/>
      </div>

      <button onClick={submit} className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-sm"
        style={{background:`linear-gradient(135deg,${C.verde},${C.celeste})`}}>
        Confirmar reserva
      </button>
    </div>
  );
}

// ─── Formulario Notebook ──────────────────────────────────────────────────────
function FormNB({espacios,reservas,usuario,onSubmit}){
  const nbs=espacios.filter(e=>e.tipo==="notebook"&&e.activo);
  const E0={espacioId:"",fecha:"",hDesde:"",hHasta:"",responsable:usuario.nombre,obs:"",esRec:false,dias:[],fDesde:"",fHasta:""};
  const [f,setF]=useState(E0);
  const [errs,setErrs]=useState({});
  const [conflicto,setConflicto]=useState(false);
  const togDia=v=>setF(p=>({...p,dias:p.dias.includes(v)?p.dias.filter(x=>x!==v):[...p.dias,v]}));

  const hDesdeDisp = f.espacioId&&f.fecha ? horasDisponiblesDesde(reservas,f.espacioId,f.fecha) : HORAS.slice(0,-1);
  const hHastaDisp = f.hDesde ? HORAS.filter(h=>h>f.hDesde) : [];

  const validate=()=>{
    const er={};
    if(!f.espacioId) er.esp="Seleccioná un modelo";
    if(!f.esRec&&!f.fecha) er.fecha="Requerido";
    if(f.esRec&&f.dias.length===0) er.dias="Seleccioná al menos un día";
    if(f.esRec&&!f.fDesde) er.fDesde="Requerido";
    if(f.esRec&&!f.fHasta) er.fHasta="Requerido";
    if(!f.hDesde) er.hDesde="Requerido";
    if(!f.hHasta||f.hHasta<=f.hDesde) er.hHasta="Debe ser posterior";
    if(!f.responsable.trim()) er.resp="Requerido";
    return er;
  };

  const submit=()=>{
    const er=validate(); if(Object.keys(er).length){setErrs(er);return;}
    const fechaCheck=f.esRec?f.fDesde:f.fecha;
    if(hayConflicto(reservas,f.espacioId,fechaCheck,f.hDesde,f.hHasta)){setConflicto(true);return;}
    onSubmit({...f,tipo:"notebook",id:uid(),usuarioId:usuario.id,
      creadoEn:fmtDT(),estado:"activa",
      historial:[{accion:"Creada",por:usuario.nombre,fecha:fmtDT()}]});
    setF(E0); setErrs({}); setConflicto(false);
  };

  const e=k=>errs[k]?<p className="text-red-500 text-xs mt-0.5">{errs[k]}</p>:null;

  return(
    <div className="space-y-5">
      {conflicto&&(
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl">🚫</span>
          <div>
            <p className="font-bold text-red-700 text-sm">La notebook ya está reservada en ese horario</p>
            <p className="text-red-600 text-xs mt-0.5">Elegí otro horario o modelo disponible.</p>
            <button onClick={()=>setConflicto(false)} className="text-xs text-red-500 underline mt-1">Cerrar</button>
          </div>
        </div>
      )}
      <div>
        <label className={LBL} style={{color:C.verde2}}>Modelo *</label>
        <div className="space-y-1.5">
          {nbs.map(n=>(
            <button key={n.id} type="button" onClick={()=>setF(p=>({...p,espacioId:n.id,hDesde:"",hHasta:""}))}
              className={"w-full px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all "+(f.espacioId===n.id?"text-white border-transparent":"bg-white text-slate-600 border-slate-200 hover:border-green-400")}
              style={f.espacioId===n.id?{background:`linear-gradient(135deg,${C.verde},${C.verde2})`}:{}}>
              💻 {n.nombre}
            </button>
          ))}
        </div>{e("esp")}
      </div>

      <label className="flex items-center gap-2 cursor-pointer p-3 bg-green-50 rounded-xl border border-green-200">
        <input type="checkbox" checked={f.esRec} onChange={ev=>setF(p=>({...p,esRec:ev.target.checked}))} className="w-4 h-4 accent-green-600"/>
        <span className="text-sm font-semibold text-slate-700">Reserva recurrente</span>
      </label>

      {f.esRec?(
        <div className="space-y-4 p-4 rounded-xl border" style={{background:"#F0FBF6",borderColor:C.verde+"55"}}>
          <div>
            <label className={LBL} style={{color:C.verde2}}>Días *</label>
            <div className="flex flex-wrap gap-2">
              {DIAS.map(d=>(
                <button key={d.v} type="button" onClick={()=>togDia(d.v)}
                  className={"px-3 py-1.5 rounded-lg text-xs font-bold border "+(f.dias.includes(d.v)?"text-white border-transparent":"bg-white text-slate-600 border-slate-200")}
                  style={f.dias.includes(d.v)?{background:C.verde}:{}}>
                  {d.l}
                </button>
              ))}
            </div>{e("dias")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LBL} style={{color:C.verde2}}>Desde *</label>
              <input type="date" value={f.fDesde} min={hoy()} onChange={ev=>setF(p=>({...p,fDesde:ev.target.value}))} className={INP}/>{e("fDesde")}</div>
            <div><label className={LBL} style={{color:C.verde2}}>Hasta *</label>
              <input type="date" value={f.fHasta} min={f.fDesde||hoy()} onChange={ev=>setF(p=>({...p,fHasta:ev.target.value}))} className={INP}/>{e("fHasta")}</div>
          </div>
        </div>
      ):(
        <div>
          <label className={LBL} style={{color:C.verde2}}>Fecha *</label>
          <input type="date" value={f.fecha} min={hoy()} onChange={ev=>setF(p=>({...p,fecha:ev.target.value,hDesde:"",hHasta:""}))} className={INP}/>{e("fecha")}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div><label className={LBL} style={{color:C.verde2}}>Hora desde *</label>
          <select value={f.hDesde} onChange={ev=>setF(p=>({...p,hDesde:ev.target.value,hHasta:""}))} className={INP}>
            <option value="">Seleccioná...</option>
            {hDesdeDisp.map(h=><option key={h} value={h}>{h} hs</option>)}
          </select>{e("hDesde")}</div>
        <div><label className={LBL} style={{color:C.verde2}}>Hora hasta *</label>
          <select value={f.hHasta} onChange={ev=>setF(p=>({...p,hHasta:ev.target.value}))} className={INP} disabled={!f.hDesde}>
            <option value="">Seleccioná...</option>
            {hHastaDisp.map(h=><option key={h} value={h}>{h} hs</option>)}
          </select>{e("hHasta")}</div>
      </div>

      <div><label className={LBL} style={{color:C.verde2}}>Responsable *</label>
        <input type="text" value={f.responsable} onChange={ev=>setF(p=>({...p,responsable:ev.target.value}))} className={INP}/>{e("resp")}</div>
      <div><label className={LBL} style={{color:C.verde2}}>Observaciones</label>
        <textarea rows={2} value={f.obs} onChange={ev=>setF(p=>({...p,obs:ev.target.value}))} placeholder="Software, accesorios, etc." className={INP+" resize-none"}/></div>

      <button onClick={submit} className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-sm"
        style={{background:`linear-gradient(135deg,${C.verde},${C.celeste})`}}>
        Confirmar reserva
      </button>
    </div>
  );
}

// ─── Mis Reservas (vista solicitante) ─────────────────────────────────────────
function MisReservas({reservas,espacios,usuario,onEditar}){
  const [editando,setEdit]=useState(null);
  const mias=reservas.filter(r=>r.usuarioId===usuario.id).sort((a,b)=>b.creadoEn>a.creadoEn?1:-1);
  const getEsp=id=>espacios.find(e=>e.id===id)||{};

  const ModalMod=({r,onClose})=>{
    const [hD,setHD]=useState(r.hDesde);
    const [hH,setHH]=useState(r.hHasta);
    const [fecha,setFecha]=useState(r.fecha||"");
    const [obs,setObs]=useState(r.obs||"");
    const [conf,setConf]=useState(false);
    const [conflicto,setConflicto]=useState(false);
    const esp=getEsp(r.espacioId);

    const guardar=()=>{
      const fc=r.esRec?r.fDesde:fecha;
      if(hayConflicto(reservas,r.espacioId,fc,hD,hH,r.id)){setConflicto(true);return;}
      onEditar(r.id,{hDesde:hD,hHasta:hH,fecha,obs,
        historial:[...(r.historial||[]),{accion:"Modificada por solicitante",por:usuario.nombre,fecha:fmtDT()}]});
      onClose();
    };
    const anular=()=>{
      onEditar(r.id,{estado:"anulada",
        historial:[...(r.historial||[]),{accion:"Anulada por solicitante",por:usuario.nombre,fecha:fmtDT()}]});
      onClose();
    };

    return(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between text-white" style={{background:`linear-gradient(135deg,${C.verde},${C.celeste})`}}>
            <div><p className="font-bold text-sm">Modificar reserva</p>
              <p className="text-green-100 text-xs">#{r.id.slice(-6).toUpperCase()} — {esp.nombre}</p></div>
            <button onClick={onClose} className="text-green-100 hover:text-white text-xl">✕</button>
          </div>
          <div className="p-5 space-y-4">
            {conflicto&&<div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold">🚫 Ese horario ya está ocupado. Elegí otro.</div>}
            {!r.esRec&&(<div>
              <label className={LBL} style={{color:C.verde2}}>Fecha</label>
              <input type="date" value={fecha} min={hoy()} onChange={e=>setFecha(e.target.value)} className={INP}/>
            </div>)}
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LBL} style={{color:C.verde2}}>Hora desde</label>
                <select value={hD} onChange={e=>setHD(e.target.value)} className={INP}>
                  {HORAS.map(h=><option key={h}>{h}</option>)}
                </select></div>
              <div><label className={LBL} style={{color:C.verde2}}>Hora hasta</label>
                <select value={hH} onChange={e=>setHH(e.target.value)} className={INP}>
                  {HORAS.filter(h=>h>hD).map(h=><option key={h}>{h}</option>)}
                </select></div>
            </div>
            <div><label className={LBL} style={{color:C.verde2}}>Observaciones</label>
              <textarea rows={2} value={obs} onChange={e=>setObs(e.target.value)} className={INP+" resize-none"}/></div>
            {conf?(
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                <p className="text-red-700 text-xs font-semibold">¿Confirmar anulación? No se puede deshacer.</p>
                <div className="flex gap-2">
                  <button onClick={anular} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold">Sí, anular</button>
                  <button onClick={()=>setConf(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold">Cancelar</button>
                </div>
              </div>
            ):(
              <div className="flex gap-2">
                <button onClick={guardar} className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold"
                  style={{background:`linear-gradient(135deg,${C.verde},${C.verde2})`}}>Guardar</button>
                <button onClick={()=>setConf(true)}
                  className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100">
                  Anular mi reserva
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return(
    <div className="space-y-4">
      {mias.length===0?(
        <div className="text-center py-12 text-slate-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">Todavía no tenés reservas</p>
        </div>
      ):(
        <div className="space-y-3">
          {mias.map(r=>{
            const esp=getEsp(r.espacioId);
            return(
              <div key={r.id} className={"border rounded-2xl p-4 "+(r.estado==="anulada"?"opacity-50 bg-slate-50":"bg-white border-slate-200")}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{r.tipo==="sala"?"🚪":"💻"}</span>
                    <span className="font-bold text-slate-800 text-sm">{esp.planta?esp.planta+" — "+esp.nombre:esp.nombre}</span>
                    {r.esRec&&<Bdg c="purple">Recurrente</Bdg>}
                    {r.estado==="anulada"&&<Bdg c="red">Anulada</Bdg>}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">#{r.id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-600">
                  {r.esRec?<><span>🔁 {DIAS.filter(d=>r.dias?.includes(d.v)).map(d=>d.l).join(", ")}</span>
                    <span>📅 {fmt(r.fDesde)} → {fmt(r.fHasta)}</span></>
                    :<span>📅 {fmt(r.fecha)}</span>}
                  <span>🕐 {r.hDesde} – {r.hHasta}</span>
                  {r.equipo&&<span>👥 {r.equipo}</span>}
                </div>
                {r.obs&&<p className="mt-2 text-xs text-slate-500 italic bg-slate-50 rounded-lg px-3 py-1.5">"{r.obs}"</p>}
                {r.historial?.length>0&&(
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <p className="text-xs text-slate-400 font-semibold mb-1">Historial</p>
                    {r.historial.map((h,i)=>(
                      <p key={i} className="text-xs text-slate-500">• {h.accion} — {h.por} — {h.fecha}</p>
                    ))}
                  </div>
                )}
                {r.estado!=="anulada"&&(
                  <button onClick={()=>setEdit(r)} className="mt-3 text-xs font-semibold px-4 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-50"
                    style={{borderColor:C.verde+"66"}}>
                    ✏️ Modificar / Anular
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {editando&&<ModalMod r={editando} onClose={()=>setEdit(null)}/>}
    </div>
  );
}


// ─── Card expandible para panel recepción ─────────────────────────────────────
function CardRec({r, esp, usr, onEdit}){
  const [expand,setExpand]=useState(false);
  const reqsLabel=(r.requerimientos||[]).map(q=>REQS.find(x=>x.id===q.id)?.label).filter(Boolean).join(", ");
  return(
    <div className={"border rounded-xl overflow-hidden "+(r.estado==="anulada"?"opacity-50 bg-slate-50 border-slate-200":"bg-white border-slate-200")}>
      <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50" onClick={()=>setExpand(p=>!p)}>
        <span className="text-base">{r.tipo==="sala"?"🚪":"💻"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-800 text-xs truncate">{esp.nombre}</span>
            {esp.planta&&<span className="text-slate-400 text-xs">· {esp.planta}</span>}
            {r.esRec&&<Bdg c="purple">🔁</Bdg>}
            {r.acomp&&<Bdg c="teal">🛎️</Bdg>}
            {r.estado==="anulada"&&<Bdg c="red">Anulada</Bdg>}
          </div>
          <div className="flex gap-3 text-[11px] text-slate-500 mt-0.5 flex-wrap">
            <span>{r.esRec?fmt(r.fDesde)+"→"+fmt(r.fHasta):fmt(r.fecha)}</span>
            <span>{r.hDesde}–{r.hHasta}</span>
            <span>👤 {r.responsable}</span>
            {r.personas&&<span>{r.personas}p</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {r.estado!=="anulada"&&(
            <button onClick={e=>{e.stopPropagation();onEdit();}}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border text-slate-600 hover:bg-green-50"
              style={{borderColor:C.verde+"55"}}>✏️</button>
          )}
          <span className="text-slate-300 text-xs">{expand?"▲":"▼"}</span>
        </div>
      </div>
      {expand&&(
        <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          {r.equipo&&<p>👥 <b>Equipo:</b> {r.equipo}</p>}
          {r.cliente&&<p>🏢 <b>Cliente:</b> {r.cliente}</p>}
          {usr.mail&&<p>📧 {usr.mail}</p>}
          {reqsLabel&&<p>📋 <b>Reqs:</b> {reqsLabel}</p>}
          {r.obs&&<p className="italic text-slate-400">"{r.obs}"</p>}
          {r.historial?.length>0&&(
            <div className="border-t border-slate-100 pt-1.5">
              <p className="font-semibold mb-0.5" style={{color:C.verde2}}>Historial</p>
              {r.historial.map((h,i)=>(
                <p key={i} className="text-slate-400">• {h.accion} — {h.por} — {h.fecha}</p>
              ))}
            </div>
          )}
          <span className="text-slate-300 font-mono">#{r.id.slice(-6).toUpperCase()}</span>
        </div>
      )}
    </div>
  );
}

// ─── Panel Recepción (admin) ──────────────────────────────────────────────────
function PanelRec({reservas,espacios,usuarios,usuarioActual,onEditar}){
  const [fil,setFil]=useState("activas");
  const [busq,setBusq]=useState("");
  const [editando,setEdit]=useState(null);
  const getEsp=id=>espacios.find(e=>e.id===id)||{};
  const getUsr=id=>usuarios.find(u=>u.id===id)||{};

  const filtradas=reservas.filter(r=>{
    if(fil==="activas") return r.estado!=="anulada";
    if(fil==="anuladas") return r.estado==="anulada";
    if(fil==="rec") return r.esRec&&r.estado!=="anulada";
    if(fil==="sala") return r.tipo==="sala"&&r.estado!=="anulada";
    if(fil==="nb") return r.tipo==="notebook"&&r.estado!=="anulada";
    if(fil==="acomp") return r.acomp&&r.estado!=="anulada";
    return true;
  }).filter(r=>!busq||
    (r.responsable||"").toLowerCase().includes(busq.toLowerCase())||
    (getEsp(r.espacioId).nombre||"").toLowerCase().includes(busq.toLowerCase()))
    .sort((a,b)=>b.creadoEn>a.creadoEn?1:-1);

  const ModalAdminEdit=({r,onClose})=>{
    const [hD,setHD]=useState(r.hDesde);
    const [hH,setHH]=useState(r.hHasta);
    const [fecha,setF]=useState(r.fecha||"");
    const [obs,setO]=useState(r.obs||"");
    const [conf,setConf]=useState(false);
    const [conflicto,setConfl]=useState(false);
    const esp=getEsp(r.espacioId);

    const guardar=()=>{
      const fc=r.esRec?r.fDesde:fecha;
      if(hayConflicto(reservas,r.espacioId,fc,hD,hH,r.id)){setConfl(true);return;}
      onEditar(r.id,{hDesde:hD,hHasta:hH,fecha,obs,
        historial:[...(r.historial||[]),{accion:"Modificada por Admin",por:usuarioActual.nombre,fecha:fmtDT()}]});
      onClose();
    };
    const anular=()=>{
      onEditar(r.id,{estado:"anulada",
        historial:[...(r.historial||[]),{accion:"Anulada por Admin",por:usuarioActual.nombre,fecha:fmtDT()}]});
      onClose();
    };
    return(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between text-white" style={{background:`linear-gradient(135deg,${C.verde},${C.celeste})`}}>
            <div><p className="font-bold text-sm">Modificar reserva (Admin)</p>
              <p className="text-green-100 text-xs">#{r.id.slice(-6).toUpperCase()} — {esp.nombre}</p></div>
            <button onClick={onClose} className="text-green-100 hover:text-white text-xl">✕</button>
          </div>
          <div className="p-5 space-y-4">
            {conflicto&&<div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold">🚫 Ese horario ya está ocupado.</div>}
            {!r.esRec&&(<div><label className={LBL} style={{color:C.verde2}}>Fecha</label>
              <input type="date" value={fecha} min={hoy()} onChange={e=>setF(e.target.value)} className={INP}/></div>)}
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LBL} style={{color:C.verde2}}>Hora desde</label>
                <select value={hD} onChange={e=>setHD(e.target.value)} className={INP}>
                  {HORAS.map(h=><option key={h}>{h}</option>)}
                </select></div>
              <div><label className={LBL} style={{color:C.verde2}}>Hora hasta</label>
                <select value={hH} onChange={e=>setHH(e.target.value)} className={INP}>
                  {HORAS.filter(h=>h>hD).map(h=><option key={h}>{h}</option>)}
                </select></div>
            </div>
            <div><label className={LBL} style={{color:C.verde2}}>Observaciones</label>
              <textarea rows={2} value={obs} onChange={e=>setO(e.target.value)} className={INP+" resize-none"}/></div>
            {conf?(
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                <p className="text-red-700 text-xs font-semibold">¿Anular esta reserva? Quedará registrado.</p>
                <div className="flex gap-2">
                  <button onClick={anular} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold">Confirmar</button>
                  <button onClick={()=>setConf(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold">Cancelar</button>
                </div>
              </div>
            ):(
              <div className="flex gap-2">
                <button onClick={guardar} className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold"
                  style={{background:`linear-gradient(135deg,${C.verde},${C.verde2})`}}>Guardar</button>
                <button onClick={()=>setConf(true)}
                  className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100">
                  Anular
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TABS=[{k:"activas",l:"Activas"},{k:"acomp",l:"Acomp. Recepción"},{k:"anuladas",l:"Anuladas"},
    {k:"rec",l:"Recurrentes"},{k:"sala",l:"Salas"},{k:"nb",l:"Notebooks"}];

  return(
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setFil(t.k)}
            className={"px-3 py-1.5 rounded-lg text-xs font-bold transition-colors "+(fil===t.k?"text-white":"bg-slate-100 text-slate-600 hover:bg-slate-200")}
            style={fil===t.k?{background:C.verde}:{}}>
            {t.l}
          </button>
        ))}
      </div>
      <input value={busq} onChange={e=>setBusq(e.target.value)} placeholder="Buscar por nombre o espacio..."
        className={INP}/>
      {filtradas.length===0?(
        <div className="text-center py-12 text-slate-400"><p className="text-3xl mb-2">📋</p><p className="text-sm">Sin resultados</p></div>
      ):(
        <div className="space-y-1.5">
          {filtradas.map(r=>(
            <CardRec key={r.id} r={r} esp={getEsp(r.espacioId)} usr={getUsr(r.usuarioId)} onEdit={()=>setEdit(r)}/>
          ))}
        </div>
      )}
      {editando&&<ModalAdminEdit r={editando} onClose={()=>setEdit(null)}/>}
    </div>
  );
}

// ─── Grilla Diaria ────────────────────────────────────────────────────────────
function GrillaDiaria({reservas,espacios}){
  const [fecha,setFecha]=useState(hoy());
  const [tipo,setTipo]=useState("sala");
  const lista=espacios.filter(e=>e.tipo===tipo&&e.activo);

  const ocupado=(espId,hora)=>{
    const dia=String(new Date(fecha+"T12:00:00").getDay());
    return reservas.find(r=>{
      if(r.espacioId!==espId||r.estado==="anulada") return false;
      let ok=r.esRec?r.dias?.includes(dia)&&fecha>=r.fDesde&&fecha<=r.fHasta:r.fecha===fecha;
      return ok&&hora>=r.hDesde&&hora<r.hHasta;
    });
  };

  return(
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          {[{k:"sala",l:"Salas"},{k:"notebook",l:"Notebooks"}].map(t=>(
            <button key={t.k} onClick={()=>setTipo(t.k)}
              className={"px-3 py-1.5 rounded-lg text-xs font-bold "+(tipo===t.k?"text-white shadow-sm":"text-slate-600")}
              style={tipo===t.k?{background:C.verde}:{}}>{t.l}</button>
          ))}
        </div>
        <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"/>
        <span className="text-xs text-slate-500">
          {new Date(fecha+"T12:00:00").toLocaleDateString("es-AR",{weekday:"long",day:"2-digit",month:"long"})}
        </span>
      </div>
      <div className="overflow-auto rounded-2xl border border-slate-200 shadow-sm">
        <table className="min-w-full text-xs">
          <thead>
            <tr style={{background:`linear-gradient(135deg,${C.verde},${C.celeste})`}}>
              <th className="px-3 py-2.5 text-left font-semibold text-white w-20 sticky left-0" style={{background:C.verde}}>Hora</th>
              {lista.map(e=>(
                <th key={e.id} className="px-3 py-2.5 text-center font-semibold text-white whitespace-nowrap min-w-[110px]">
                  {e.nombre}{e.planta&&<div className="text-green-100 text-[10px] font-normal">{e.planta}</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HORAS.slice(0,-1).map((h,hi)=>(
              <tr key={h} className={hi%2===0?"bg-white":"bg-slate-50/50"}>
                <td className="px-3 py-1.5 font-semibold text-slate-400 sticky left-0 bg-inherit border-r border-slate-100">{h}</td>
                {lista.map(e=>{
                  const r=ocupado(e.id,h);
                  return(
                    <td key={e.id} className="px-1.5 py-1">
                      {r?(
                        <div className="rounded-lg px-2 py-1 text-[10px] text-white text-center leading-tight"
                          style={{background:r.esRec?"#7C3AED":C.verde2}}>
                          <p className="font-bold truncate">{r.responsable}</p>
                          {r.esRec&&<p className="opacity-70">🔁</p>}
                        </div>
                      ):(
                        <div className="h-6 rounded-lg flex items-center justify-center"
                          style={{background:"#F0FBF6",border:`1px solid ${C.verde}33`}}>
                          <span className="text-[9px]" style={{color:C.verde}}>libre</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded inline-block" style={{background:C.verde2}}/>Ocupado</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-600 inline-block"/>Recurrente</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded inline-block" style={{background:"#F0FBF6",border:`1px solid ${C.verde}44`}}/>Libre</span>
      </div>
    </div>
  );
}

// ─── Grilla Semanal ───────────────────────────────────────────────────────────
function GrillaSemanal({reservas,espacios}){
  const [tipo,setTipo]=useState("sala");
  const [espId,setEspId]=useState("");
  const [semOff,setSemOff]=useState(0);
  const lista=espacios.filter(e=>e.tipo===tipo&&e.activo);

  const getLunes=(offset)=>{
    const d=new Date(); d.setHours(12,0,0,0);
    const day=d.getDay(); const diff=day===0?-6:1-day;
    d.setDate(d.getDate()+diff+offset*7);
    return d;
  };

  const dias=Array.from({length:5},(_,i)=>{
    const d=new Date(getLunes(semOff)); d.setDate(d.getDate()+i);
    return {fecha:d.toISOString().split("T")[0], label:d.toLocaleDateString("es-AR",{weekday:"short",day:"2-digit",month:"2-digit"})};
  });

  const espSel=lista.find(e=>e.id===espId)||lista[0];

  const ocupado=(fecha,hora)=>{
    if(!espSel) return null;
    const dia=String(new Date(fecha+"T12:00:00").getDay());
    return reservas.find(r=>{
      if(r.espacioId!==espSel.id||r.estado==="anulada") return false;
      let ok=r.esRec?r.dias?.includes(dia)&&fecha>=r.fDesde&&fecha<=r.fHasta:r.fecha===fecha;
      return ok&&hora>=r.hDesde&&hora<r.hHasta;
    });
  };

  const semLabel=()=>{
    const l=getLunes(semOff); const v=new Date(l); v.setDate(v.getDate()+4);
    return fmt(l.toISOString().split("T")[0])+" — "+fmt(v.toISOString().split("T")[0]);
  };

  return(
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          {[{k:"sala",l:"Salas"},{k:"notebook",l:"Notebooks"}].map(t=>(
            <button key={t.k} onClick={()=>{setTipo(t.k);setEspId("");}}
              className={"px-3 py-1.5 rounded-lg text-xs font-bold "+(tipo===t.k?"text-white":"text-slate-600")}
              style={tipo===t.k?{background:C.verde}:{}}>{t.l}</button>
          ))}
        </div>
        <select value={espSel?.id||""} onChange={e=>setEspId(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
          {lista.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <button onClick={()=>setSemOff(p=>p-1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-bold">‹</button>
          <span className="text-xs text-slate-600 font-semibold whitespace-nowrap">{semLabel()}</span>
          <button onClick={()=>setSemOff(p=>p+1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-bold">›</button>
          <button onClick={()=>setSemOff(0)} className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">Hoy</button>
        </div>
      </div>
      <div className="overflow-auto rounded-2xl border border-slate-200 shadow-sm">
        <table className="min-w-full text-xs">
          <thead>
            <tr style={{background:`linear-gradient(135deg,${C.verde},${C.celeste})`}}>
              <th className="px-3 py-2.5 text-left font-semibold text-white w-16 sticky left-0" style={{background:C.verde}}>Hora</th>
              {dias.map(d=>(
                <th key={d.fecha} className="px-2 py-2.5 text-center font-semibold text-white min-w-[90px]">{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HORAS.slice(0,-1).map((h,hi)=>(
              <tr key={h} className={hi%2===0?"bg-white":"bg-slate-50/50"}>
                <td className="px-3 py-1.5 font-semibold text-slate-400 sticky left-0 bg-inherit border-r border-slate-100">{h}</td>
                {dias.map(d=>{
                  const r=ocupado(d.fecha,h);
                  return(
                    <td key={d.fecha} className="px-1 py-1">
                      {r?(
                        <div className="rounded-lg px-1.5 py-1 text-[9px] text-white text-center leading-tight"
                          style={{background:r.esRec?"#7C3AED":C.verde2}}>
                          <p className="font-bold truncate max-w-[70px] mx-auto">{r.responsable}</p>
                        </div>
                      ):(
                        <div className="h-6 rounded-lg flex items-center justify-center"
                          style={{background:"#F0FBF6",border:`1px solid ${C.verde}33`}}>
                          <span style={{color:C.verde,fontSize:"8px"}}>libre</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Config Usuarios ──────────────────────────────────────────────────────────
function ConfigUsuarios({usuarios,onSave}){
  const [lista,setLista]=useState(usuarios);
  const [nuevo,setNuevo]=useState({nombre:"",mail:"",rol:"user"});
  const upd=(id,k,v)=>setLista(p=>p.map(u=>u.id===id?{...u,[k]:v}:u));
  const add=()=>{
    if(!nuevo.nombre.trim()||!nuevo.mail.trim()) return;
    setLista(p=>[...p,{...nuevo,id:uid(),activo:true}]);
    setNuevo({nombre:"",mail:"",rol:"user"});
  };
  return(
    <div className="space-y-4">
      <div className="space-y-2">
        {lista.map(u=>(
          <div key={u.id} className={"flex flex-wrap items-center gap-2 p-3 rounded-xl border "+(u.activo?"bg-white border-slate-200":"bg-slate-50 border-slate-100 opacity-60")}>
            <input value={u.nombre} onChange={ev=>upd(u.id,"nombre",ev.target.value)}
              className="flex-1 min-w-[120px] border-0 outline-none text-sm font-semibold text-slate-700 bg-transparent"/>
            <input value={u.mail} onChange={ev=>upd(u.id,"mail",ev.target.value)}
              className="flex-1 min-w-[150px] border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-500 focus:outline-none"/>
            <select value={u.rol} onChange={ev=>upd(u.id,"rol",ev.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none">
              <option value="user">Solicitante</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={()=>upd(u.id,"activo",!u.activo)}
              className={"text-xs px-2 py-1 rounded-lg font-semibold "+(u.activo?"bg-red-50 text-red-500 hover:bg-red-100":"bg-green-50 text-green-600 hover:bg-green-100")}>
              {u.activo?"Desact.":"Activar"}
            </button>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 pt-4 space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase">Agregar usuario</p>
        <div className="flex gap-2 flex-wrap">
          <input value={nuevo.nombre} onChange={e=>setNuevo(p=>({...p,nombre:e.target.value}))} placeholder="Nombre y apellido"
            className="flex-1 min-w-[140px] border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"/>
          <input value={nuevo.mail} onChange={e=>setNuevo(p=>({...p,mail:e.target.value}))} placeholder="mail@islarg.com.ar"
            className="flex-1 min-w-[160px] border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"/>
          <select value={nuevo.rol} onChange={e=>setNuevo(p=>({...p,rol:e.target.value}))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="user">Solicitante</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={add} className="px-4 py-2 rounded-xl text-white text-sm font-bold" style={{background:C.verde}}>+ Agregar</button>
        </div>
      </div>
      <button onClick={()=>onSave(lista)} className="w-full py-3 rounded-xl text-white font-bold text-sm"
        style={{background:`linear-gradient(135deg,${C.verde},${C.celeste})`}}>
        Guardar usuarios
      </button>
    </div>
  );
}

// ─── Config Espacios ──────────────────────────────────────────────────────────
function ConfigEspacios({espacios,onSave}){
  const [lista,setLista]=useState(()=>JSON.parse(JSON.stringify(espacios)));
  const [nuevo,setNuevo]=useState({nombre:"",planta:"",tipo:"sala"});
  const [guardado,setGuardado]=useState(false);

  // Sincronizar si cambian los espacios externos
  useEffect(()=>{ setLista(JSON.parse(JSON.stringify(espacios))); },[espacios]);

  const upd=(id,k,v)=>{ setGuardado(false); setLista(p=>p.map(e=>e.id===id?{...e,[k]:v}:e)); };
  const add=()=>{
    if(!nuevo.nombre.trim()) return;
    setLista(p=>[...p,{...nuevo,id:uid(),activo:true}]);
    setNuevo({nombre:"",planta:"",tipo:"sala"});
    setGuardado(false);
  };
  const handleSave=()=>{ onSave(lista); setGuardado(true); setTimeout(()=>setGuardado(false),2500); };

  return(
    <div className="space-y-4">
      {guardado&&<div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-xs text-green-700 font-semibold">✅ Cambios guardados correctamente</div>}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs text-amber-700">
        Hacé los cambios y presioná <b>Guardar espacios</b> al final para confirmar.
      </div>
      <div className="space-y-2">
        {lista.map(e=>(
          <div key={e.id} className={"flex flex-wrap items-center gap-2 p-3 rounded-xl border transition-all "+(e.activo?"bg-white border-slate-200":"bg-slate-50 border-slate-100 opacity-60")}>
            <span>{e.tipo==="sala"?"🚪":"💻"}</span>
            <input value={e.nombre} onChange={ev=>upd(e.id,"nombre",ev.target.value)}
              className="flex-1 border-0 outline-none text-sm font-semibold text-slate-700 bg-transparent min-w-0"/>
            <input value={e.planta} onChange={ev=>upd(e.id,"planta",ev.target.value)} placeholder="Planta"
              className="w-28 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-500 focus:outline-none"/>
            <button onClick={()=>upd(e.id,"activo",!e.activo)}
              className={"text-xs px-2 py-1 rounded-lg font-semibold transition-colors "+(e.activo?"bg-red-50 text-red-500 hover:bg-red-100 border border-red-200":"bg-green-50 text-green-600 hover:bg-green-100 border border-green-200")}>
              {e.activo?"Desactivar":"Activar"}
            </button>
          </div>
        ))}
      </div>
      <div className="border-t pt-4 space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase">Agregar espacio</p>
        <div className="flex gap-2 flex-wrap">
          <input value={nuevo.nombre} onChange={e=>setNuevo(p=>({...p,nombre:e.target.value}))} placeholder="Nombre"
            className="flex-1 min-w-[130px] border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"/>
          <input value={nuevo.planta} onChange={e=>setNuevo(p=>({...p,planta:e.target.value}))} placeholder="Planta"
            className="w-32 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"/>
          <select value={nuevo.tipo} onChange={e=>setNuevo(p=>({...p,tipo:e.target.value}))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="sala">🚪 Sala</option>
            <option value="notebook">💻 Notebook</option>
          </select>
          <button onClick={add} className="px-4 py-2 rounded-xl text-white text-sm font-bold" style={{background:C.verde}}>+ Agregar</button>
        </div>
      </div>
      <button onClick={handleSave} className="w-full py-3 rounded-xl text-white font-bold text-sm"
        style={{background:`linear-gradient(135deg,${C.verde},${C.celeste})`}}>
        Guardar espacios
      </button>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App(){
  const [reservas,setReservas]=useState([]);
  const [espacios,setEspacios]=useState(DEFAULT_ESPACIOS);
  const [usuarios,setUsuarios]=useState(DEFAULT_USUARIOS);
  const [loading,setLoading]=useState(true);
  const [usuario,setUsuario]=useState(null);
  const [vista,setVista]=useState("reserva");
  const [subReserva,setSub]=useState("sala");
  const [subOcup,setSubOcup]=useState("diaria");
  const [subConfig,setSubConfig]=useState("espacios");
  const [mail,setMail]=useState(null);
  const [toast,setToast]=useState(null);

  useEffect(()=>{
    Promise.all([dbGetReservas(), dbGetEspacios(), dbGetUsuarios()]).then(([r,e,u])=>{
      if(r && r.length>0) setReservas(r.map(mapReserva));
      if(e && e.length>0) setEspacios(e);
      if(u && u.length>0) setUsuarios(u);
      setLoading(false);
    });
  },[]);

  const showToast=(msg,c="green")=>{setToast({msg,c});setTimeout(()=>setToast(null),3500);};

  const agregar=useCallback(async r=>{
    await dbInsertReserva(r);
    setReservas(p=>[r,...p]);
    setMail(r); showToast("✅ Reserva registrada. Notificación enviada.");
  },[]);

  const editar=useCallback(async(id,cambios)=>{
    await dbUpdateReserva(id, cambios);
    setReservas(p=>p.map(r=>r.id===id?{...r,...cambios}:r));
    showToast(cambios.estado==="anulada"?"Reserva anulada":"Reserva modificada",cambios.estado==="anulada"?"red":"green");
  },[]);

  const guardarEsp=useCallback(async e=>{
    setEspacios(e);
    await dbSaveEspacios(e);
    showToast("Espacios guardados");
  },[]);
  const guardarUsr=useCallback(async u=>{
    setUsuarios(u);
    await dbSaveUsuarios(u);
    showToast("Usuarios guardados");
  },[]);

  const isAdmin=usuario?.rol==="admin";
  const acompPend=reservas.filter(r=>r.estado!=="anulada"&&r.acomp).length;

  if(loading) return(
    <div className="min-h-screen flex items-center justify-center" style={{background:`linear-gradient(135deg,${C.verde},${C.celeste})`}}>
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-white text-sm font-semibold">Cargando...</p>
      </div>
    </div>
  );

  if(!usuario) return <Login usuarios={usuarios} onLogin={id=>{
    const u=usuarios.find(x=>x.id===id); if(u){setUsuario(u);setVista("reserva");}
  }}/>;

  const NAV_USER=[
    {k:"reserva",icon:"📅",label:"Nueva reserva"},
    {k:"mis",    icon:"📋",label:"Mis reservas"},
    {k:"ocup",   icon:"📊",label:"Ocupación"},
  ];
  const NAV_ADMIN=[
    {k:"reserva",  icon:"📅",label:"Nueva reserva"},
    {k:"recepcion",icon:"🛎️",label:"Recepción",badge:acompPend},
    {k:"ocup",     icon:"📊",label:"Ocupación"},
    {k:"config",   icon:"⚙️",label:"Configurar"},
  ];
  const NAV=isAdmin?NAV_ADMIN:NAV_USER;

  return(
    <div className="min-h-screen font-sans" style={{background:C.fondo}}>
      <header className="shadow-lg" style={{background:`linear-gradient(135deg,${C.verde} 0%,${C.celeste} 100%)`}}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="bg-white rounded-xl px-3 py-2 shadow-sm"><ISLLogo size={0.55} onDark={false}/></div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-white text-xs font-semibold">{usuario.nombre}</p>
              <p className="text-green-100 text-[10px]">{isAdmin?"Admin / Recepción":"Solicitante"}</p>
            </div>
            <button onClick={()=>{setUsuario(null);setVista("reserva");}}
              className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
              Salir
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex overflow-x-auto">
          {NAV.map(n=>(
            <button key={n.k} onClick={()=>setVista(n.k)}
              className={"relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors "+(vista===n.k?"border-green-600 text-green-700":"border-transparent text-slate-500 hover:text-slate-700")}>
              <span>{n.icon}</span><span className="hidden sm:inline">{n.label}</span>
              {n.badge>0&&<span className="absolute top-2 right-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{n.badge}</span>}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {vista==="reserva"&&(
          <div className="space-y-4">
            <div className="flex gap-2">
              {[{k:"sala",l:"🚪 Sala"},{k:"notebook",l:"💻 Notebook"}].map(t=>(
                <button key={t.k} onClick={()=>setSub(t.k)}
                  className={"px-5 py-2.5 rounded-xl text-sm font-bold transition-all "+(subReserva===t.k?"text-white shadow-md":"bg-white text-slate-600 border border-slate-200 hover:bg-green-50")}
                  style={subReserva===t.k?{background:`linear-gradient(135deg,${C.verde},${C.celeste})`}:{}}>
                  {t.l}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-bold text-base mb-5" style={{color:C.texto}}>
                {subReserva==="sala"?"Reservar sala / consultorio":"Solicitar notebook"}
              </h2>
              {subReserva==="sala"
                ?<FormSala espacios={espacios} reservas={reservas} usuario={usuario} onSubmit={agregar}/>
                :<FormNB   espacios={espacios} reservas={reservas} usuario={usuario} onSubmit={agregar}/>}
            </div>
          </div>
        )}

        {vista==="mis"&&(
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-base mb-5" style={{color:C.texto}}>Mis reservas</h2>
            <MisReservas reservas={reservas} espacios={espacios} usuario={usuario} onEditar={editar}/>
          </div>
        )}

        {vista==="recepcion"&&isAdmin&&(
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-base mb-5" style={{color:C.texto}}>Panel de Recepción</h2>
            <PanelRec reservas={reservas} espacios={espacios} usuarios={usuarios} usuarioActual={usuario} onEditar={editar}/>
          </div>
        )}

        {vista==="ocup"&&(
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="font-bold text-base" style={{color:C.texto}}>Ocupación</h2>
              <div className="flex gap-1 ml-auto p-1 bg-slate-100 rounded-xl">
                {[{k:"diaria",l:"Diaria"},{k:"semanal",l:"Semanal"}].map(t=>(
                  <button key={t.k} onClick={()=>setSubOcup(t.k)}
                    className={"px-3 py-1.5 rounded-lg text-xs font-bold "+(subOcup===t.k?"text-white":"text-slate-600")}
                    style={subOcup===t.k?{background:C.verde}:{}}>
                    {t.l}
                  </button>
                ))}
              </div>
            </div>
            {subOcup==="diaria"
              ?<GrillaDiaria reservas={reservas} espacios={espacios}/>
              :<GrillaSemanal reservas={reservas} espacios={espacios}/>}
          </div>
        )}

        {vista==="config"&&isAdmin&&(
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex gap-2 mb-5">
              {[{k:"espacios",l:"⚙️ Espacios"},{k:"usuarios",l:"👥 Usuarios"}].map(t=>(
                <button key={t.k} onClick={()=>setSubConfig(t.k)}
                  className={"px-4 py-2 rounded-xl text-sm font-bold transition-all "+(subConfig===t.k?"text-white":"bg-slate-100 text-slate-600 hover:bg-slate-200")}
                  style={subConfig===t.k?{background:C.verde}:{}}>
                  {t.l}
                </button>
              ))}
            </div>
            {subConfig==="espacios"
              ?<ConfigEspacios espacios={espacios} onSave={guardarEsp}/>
              :<ConfigUsuarios usuarios={usuarios} onSave={guardarUsr}/>}
          </div>
        )}
      </main>

      {toast&&(
        <div className={"fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold "+(toast.c==="red"?"bg-red-600":"bg-emerald-600")}>
          {toast.msg}
        </div>
      )}

      <ModalMail r={mail} espacios={espacios} usuarios={usuarios} onClose={()=>setMail(null)}/>
    </div>
  );
}
