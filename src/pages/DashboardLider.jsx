import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import {
  collection, query, where, getDocs,
  doc, getDoc, updateDoc, arrayRemove,
  addDoc, serverTimestamp, deleteDoc,
} from "firebase/firestore";
import { useRol } from "../hooks/useRol";
import Navbar from "../components/Navbar.jsx";
import "../stylesheets/DashboardLider.css";

import {
  FiStar, FiMail, FiMapPin, FiUsers,
  FiTrendingUp, FiLogOut, FiBriefcase,
  FiPlusCircle, FiTrash2, FiEdit2, FiEye,
} from "react-icons/fi";
import { MdBolt } from "react-icons/md";
import { HiOutlineBriefcase, HiOutlineOfficeBuilding } from "react-icons/hi";
import { RiTeamLine } from "react-icons/ri";
import { IoSearchOutline } from "react-icons/io5";

/* ── helpers ── */
const calcComp = (p) => {
  const c = [
    p.titulo, p.resumen, p.area, p.intereses,
    p.experiencia?.length > 0, p.educacion?.length > 0,
    p.idiomas?.length > 0, p.cursos?.length > 0,
    p.skills?.length > 0, p.habilidadesBlandas?.length > 0,
  ];
  return Math.round(c.filter(Boolean).length / c.length * 100);
};

/* ── Gráfico barras horizontales ── */
function HBarChart({ data, color = "#003DA5" }) {
  if (!data.length) return <p className="dl-empty-txt">Sin datos aún</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="dl-hbar-list">
      {data.map((d, i) => (
        <div key={i} className="dl-hbar-row">
          <span className="dl-hbar-label" title={d.label}>{d.label}</span>
          <div className="dl-hbar-track">
            <div className="dl-hbar-fill" style={{ width:`${(d.value/max)*100}%`, background:color }}/>
          </div>
          <span className="dl-hbar-val">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Dona SVG ── */
function DonutChart({ segments, size = 120 }) {
  const r = 42; const cx = size/2; const cy = size/2;
  const circ = 2*Math.PI*r;
  const total = segments.reduce((s,d) => s+d.value, 0) || 1;
  let offset = 0;
  const arcs = segments.map((seg) => {
    const dash = (seg.value/total)*circ;
    const arc  = { ...seg, dash, offset: circ-offset };
    offset += dash;
    return arc;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={18}/>
      {arcs.map((arc,i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={arc.color} strokeWidth={18}
          strokeDasharray={`${arc.dash} ${circ}`} strokeDashoffset={arc.offset}
          style={{transform:"rotate(-90deg)", transformOrigin:"center"}}/>
      ))}
      <text x={cx} y={cy+6} textAnchor="middle" fontSize={20} fontWeight="800" fill="#111827">{total}</text>
    </svg>
  );
}

/* ── Sparkline ── */
function SparkLine({ values, color="#003DA5", width=100, height=40 }) {
  if (values.length < 2) return null;
  const max=Math.max(...values,1); const min=Math.min(...values); const rng=max-min||1;
  const pts=values.map((v,i) => {
    const x=(i/(values.length-1))*width;
    const y=height-((v-min)/rng)*(height-8)-4;
    return `${x},${y}`;
  });
  const area=`M${pts[0]} ${pts.slice(1).map(p=>`L${p}`).join(" ")} L${width},${height} L0,${height} Z`;
  const line=`M${pts[0]} ${pts.slice(1).map(p=>`L${p}`).join(" ")}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow:"visible"}}>
      <path d={area} fill={color} fillOpacity={0.12}/>
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round"/>
      {values.map((v,i) => {
        const x=(i/(values.length-1))*width;
        const y=height-((v-min)/rng)*(height-8)-4;
        return <circle key={i} cx={x} cy={y} r={2.5} fill={color}/>;
      })}
    </svg>
  );
}

const AREAS_BCP = [
  "Analítica & Tecnología","Finanzas & Control","Gestión & Operaciones",
  "Comunicación & Relación","Riesgos & Cumplimiento","Marketing & Experiencia Cliente",
];

/* ════════════════════════════════════════════
   DASHBOARD LÍDER
   Acceso: rol === "lider" (verificado por Firestore, no por correo)
════════════════════════════════════════════ */
function DashboardLider() {
  const navigate = useNavigate();

  /* ── Verificación de rol por Firestore ── */
  const { user, rol, docId: liderDocId, cargando: cargandoRol } = useRol();

  const [liderData,    setLiderData]    = useState(null);
  const [practicantes, setPracticantes] = useState([]);
  const [favoritos,    setFavoritos]    = useState([]);
  const [vacantes,     setVacantes]     = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [tabActiva,    setTabActiva]    = useState("metricas");
  const [busqFav,      setBusqFav]      = useState("");
  const [modalVacante, setModalVacante] = useState(false);
  const [vacanteEdit,  setVacanteEdit]  = useState(null);

  /* Guard — redirige si no es líder */
  useEffect(() => {
    if (!cargandoRol && (!user || rol !== "lider")) {
      navigate("/auth");
    }
  }, [cargandoRol, user, rol, navigate]);

  /* Cargar datos */
  useEffect(() => {
    if (!liderDocId) return;
    const cargar = async () => {
      try {
        /* Info del líder */
        const lSnap = await getDocs(query(collection(db, "lideres"), where("uid", "==", user.uid)));
        lSnap.forEach((d) => setLiderData({ id: d.id, ...d.data() }));

        /* Practicantes */
        const pSnap = await getDocs(collection(db, "practicantes"));
        setPracticantes(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        /* Favoritos */
        const lDoc = lSnap.docs[0]?.data();
        if (lDoc?.favoritos?.length) {
          const favs = await Promise.all(
            lDoc.favoritos.map(async (fid) => {
              const s = await getDoc(doc(db, "practicantes", fid));
              return s.exists() ? { id: fid, ...s.data() } : null;
            })
          );
          setFavoritos(favs.filter(Boolean));
        }

        /* Vacantes */
        const vSnap = await getDocs(collection(db, "vacantes"));
        setVacantes(vSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      } catch (e) { console.error(e); }
      finally { setCargando(false); }
    };
    cargar();
  }, [liderDocId, user]);

  const quitarFavorito = async (favId) => {
    await updateDoc(doc(db, "lideres", liderDocId), { favoritos: arrayRemove(favId) });
    setFavoritos((prev) => prev.filter((f) => f.id !== favId));
  };

  const irAPerfil = (pid) => navigate(`/perfil/${pid}`);

  /* ── Métricas ── */
  const total      = practicantes.length;
  const conExp     = practicantes.filter((p) => p.experiencia?.length > 0).length;
  const conRot     = practicantes.filter((p) => p.rotaciones?.length > 0).length;
  const perfilAlto = practicantes.filter((p) => calcComp(p) >= 70).length;
  const conProy    = practicantes.filter((p) => p.proyectos?.length > 0).length;

  const areaTop = Object.entries(
    practicantes.reduce((acc,p) => { if(p.area) acc[p.area]=(acc[p.area]||0)+1; return acc; }, {})
  ).sort((a,b) => b[1]-a[1]).slice(0,6).map(([label,value]) => ({ label:label.split(" ")[0], value }));

  const skillTop = Object.entries(
    practicantes.reduce((acc,p) => {
      (p.skills||[]).forEach(s => { if(s) acc[s]=(acc[s]||0)+1; });
      return acc;
    }, {})
  ).sort((a,b) => b[1]-a[1]).slice(0,8).map(([label,value]) => ({ label, value }));

  const idiomaTop = Object.entries(
    practicantes.reduce((acc,p) => {
      (p.idiomas||[]).forEach(i => { const k=i.idioma||i; if(k) acc[k]=(acc[k]||0)+1; });
      return acc;
    }, {})
  ).sort((a,b) => b[1]-a[1]).slice(0,6).map(([label,value]) => ({ label, value }));

  const generoData = Object.entries(
    practicantes.reduce((acc,p) => { const g=p.genero||"Sin datos"; acc[g]=(acc[g]||0)+1; return acc; }, {})
  ).sort((a,b) => b[1]-a[1]).map(([label,value]) => ({ label, value }));

  const compBuckets = { "< 40%":0, "40–60%":0, "60–80%":0, "80–100%":0 };
  practicantes.forEach((p) => {
    const c = calcComp(p);
    if(c<40) compBuckets["< 40%"]++;
    else if(c<60) compBuckets["40–60%"]++;
    else if(c<80) compBuckets["60–80%"]++;
    else compBuckets["80–100%"]++;
  });

  const sparkData = [Math.max(1,total-5),total-3,total-4,total-1,total-2,total].map(v => Math.max(0,v));
  const favFiltrados = favoritos.filter(p => !busqFav || p.nombre?.toLowerCase().includes(busqFav.toLowerCase()));

  if (cargandoRol || cargando) return (
    <div className="dl-carga"><div className="spinner-bcp"/><p>Cargando dashboard...</p></div>
  );

  if (rol !== "lider") return null; // guard extra mientras redirige

  return (
    <div className="dl-wrapper">

      {/* ── SIDEBAR ── */}
      <aside className="dl-sidebar">
        <div className="dl-sidebar-logo">
          <div className="dl-logo-icon">B</div>
          <span className="dl-logo-text">Talento BCP</span>
        </div>

        <div className="dl-sidebar-user">
          <div className="dl-user-avatar">
            {(liderData?.nombre||user?.email||"L")[0].toUpperCase()}
          </div>
          <div className="dl-user-info">
            <p className="dl-user-nombre">{liderData?.nombre||"Líder"}</p>
            <p className="dl-user-email">{user?.email?.split("@")[0]}</p>
          </div>
        </div>

        <nav className="dl-nav">
          {[
            { id:"metricas",  Icon:FiTrendingUp, label:"Métricas" },
            { id:"favoritos", Icon:FiStar,       label:"Favoritos",  badge:favoritos.length,                          badgeColor:"#d97706" },
            { id:"vacantes",  Icon:FiBriefcase,  label:"Vacantes",   badge:vacantes.filter(v=>v.activa!==false).length, badgeColor:"#003DA5" },
          ].map(({ id, Icon, label, badge, badgeColor }) => (
            <button key={id}
              className={`dl-nav-btn ${tabActiva===id?"dl-nav-active":""}`}
              onClick={() => setTabActiva(id)}
            >
              <Icon size={17}/><span>{label}</span>
              {badge>0 && <span className="dl-nav-badge" style={{background:badgeColor}}>{badge}</span>}
            </button>
          ))}
        </nav>

        <div className="dl-sidebar-footer">
          <button className="dl-nav-btn dl-nav-btn-sec" onClick={() => navigate("/catalogo")}>
            <FiUsers size={17}/><span>Ver catálogo</span>
          </button>
          <button className="dl-nav-btn dl-nav-btn-sec" onClick={async () => { await signOut(auth); navigate("/"); }}>
            <FiLogOut size={17}/><span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="dl-main">
        <div className="dl-topbar">
          <div>
            <h1 className="dl-topbar-titulo">
              {tabActiva==="metricas" ? "Métricas de Talento" : tabActiva==="favoritos" ? "Mis Favoritos" : "Gestión de Vacantes"}
            </h1>
            <p className="dl-topbar-sub">
              Bienvenido, <strong>{liderData?.nombre||user?.email?.split("@")[0]}</strong>
            </p>
          </div>
          {tabActiva==="vacantes" && (
            <button className="dl-btn-nueva-vacante"
              onClick={() => { setVacanteEdit(null); setModalVacante(true); }}>
              <FiPlusCircle size={15}/> Nueva vacante
            </button>
          )}
        </div>

        <div className="dl-content">

          {/* ════ MÉTRICAS ════ */}
          {tabActiva==="metricas" && (
            <div className="dl-metricas">
              <div className="dl-kpi-row">
                <KpiCard label="Total practicantes" value={total} sub="Registrados en plataforma"
                  color="#003DA5" Icon={RiTeamLine} spark={sparkData}/>
                <KpiCard label="Perfil 70%+" value={perfilAlto}
                  sub={`${total>0?Math.round(perfilAlto/total*100):0}% del total`}
                  color="#16a34a" Icon={HiOutlineBriefcase}/>
                <KpiCard label="Con experiencia" value={conExp}
                  sub={`${total>0?Math.round(conExp/total*100):0}% del total`}
                  color="#d97706" Icon={HiOutlineBriefcase}/>
                <KpiCard label="Mis favoritos" value={favoritos.length}
                  sub="Guardados por ti" color="#7c3aed" Icon={FiStar}/>
              </div>

              <div className="dl-charts-row">
                <div className="dl-chart-card dl-chart-card-lg">
                  <h3 className="dl-chart-titulo"><HiOutlineOfficeBuilding size={15}/> Practicantes por área</h3>
                  <HBarChart data={areaTop} color="#003DA5"/>
                </div>
                <div className="dl-chart-card">
                  <h3 className="dl-chart-titulo"><FiTrendingUp size={15}/> Completitud de perfiles</h3>
                  <div className="dl-donut-wrap">
                    <DonutChart segments={[
                      { label:"80–100%", value:compBuckets["80–100%"], color:"#16a34a" },
                      { label:"60–80%",  value:compBuckets["60–80%"],  color:"#003DA5" },
                      { label:"40–60%",  value:compBuckets["40–60%"],  color:"#d97706" },
                      { label:"< 40%",   value:compBuckets["< 40%"],   color:"#e5e7eb" },
                    ]}/>
                    <div className="dl-donut-legend">
                      {[
                        { l:"80–100%", c:"#16a34a", v:compBuckets["80–100%"] },
                        { l:"60–80%",  c:"#003DA5", v:compBuckets["60–80%"] },
                        { l:"40–60%",  c:"#d97706", v:compBuckets["40–60%"] },
                        { l:"< 40%",   c:"#e5e7eb", v:compBuckets["< 40%"] },
                      ].map(s => (
                        <div key={s.l} className="dl-legend-item">
                          <span className="dl-legend-dot" style={{background:s.c}}/>
                          <span className="dl-legend-label">{s.l}</span>
                          <span className="dl-legend-val">{s.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="dl-charts-row dl-charts-row-3">
                <div className="dl-chart-card">
                  <h3 className="dl-chart-titulo"><MdBolt size={15}/> Skills más frecuentes</h3>
                  <HBarChart data={skillTop} color="#003DA5"/>
                </div>
                <div className="dl-chart-card">
                  <h3 className="dl-chart-titulo"><FiUsers size={15}/> Idiomas</h3>
                  <HBarChart data={idiomaTop} color="#5c7d3e"/>
                </div>
                <div className="dl-chart-card">
                  <h3 className="dl-chart-titulo">👤 Distribución por género</h3>
                  <HBarChart data={generoData} color="#7c3aed"/>
                </div>
              </div>

              <div className="dl-mini-stats-row">
                {[
                  { label:"Con proyectos",    val:conProy,         icon:"🚀", color:"#003DA5" },
                  { label:"Historial BCP",    val:conRot,          icon:"🔄", color:"#7c3aed" },
                  { label:"Mis favoritos",    val:favoritos.length, icon:"⭐", color:"#d97706" },
                  { label:"Vacantes activas", val:vacantes.filter(v=>v.activa!==false).length, icon:"📋", color:"#16a34a" },
                ].map(s => (
                  <div key={s.label} className="dl-mini-stat">
                    <span className="dl-mini-icon">{s.icon}</span>
                    <div>
                      <p className="dl-mini-val" style={{color:s.color}}>{s.val}</p>
                      <p className="dl-mini-label">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ FAVORITOS ════ */}
          {tabActiva==="favoritos" && (
            <div>
              {favoritos.length===0 ? (
                <div className="dl-empty-state">
                  <FiStar size={48} color="#d1d5db"/>
                  <h5>Aún no tienes favoritos</h5>
                  <p>Guarda perfiles desde el catálogo de talento</p>
                  <button className="dl-btn-ir" onClick={() => navigate("/catalogo")}>Explorar talento</button>
                </div>
              ) : (
                <>
                  <div className="dl-fav-search-wrap">
                    <IoSearchOutline size={15} style={{color:"#9ca3af",flexShrink:0}}/>
                    <input className="dl-fav-search" placeholder="Buscar en favoritos..." value={busqFav} onChange={e=>setBusqFav(e.target.value)}/>
                  </div>
                  <div className="dl-grid-3">
                    {favFiltrados.map(p => (
                      <TarjetaFav key={p.id} p={p} onVer={() => irAPerfil(p.id)} onQuitar={() => quitarFavorito(p.id)}/>
                    ))}
                    {favFiltrados.length===0 && <p className="dl-empty-txt">Sin resultados para "{busqFav}"</p>}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════ VACANTES ════ */}
          {tabActiva==="vacantes" && (
            <TabVacantes
              vacantes={vacantes}
              setVacantes={setVacantes}
              liderData={liderData}
              user={user}
              onEditar={(v) => { setVacanteEdit(v); setModalVacante(true); }}
              navigate={navigate}
            />
          )}
        </div>
      </main>

      {modalVacante && (
        <ModalVacante
          vacante={vacanteEdit}
          liderData={liderData}
          user={user}
          onCerrar={() => setModalVacante(false)}
          onGuardar={(nueva) => {
            setVacantes(prev => vacanteEdit ? prev.map(v=>v.id===nueva.id?nueva:v) : [nueva,...prev]);
            setModalVacante(false);
          }}
        />
      )}
    </div>
  );
}

/* ── KPI card ── */
function KpiCard({ label, value, sub, color, Icon, spark }) {
  return (
    <div className="dl-kpi-card">
      <div className="dl-kpi-top">
        <div className="dl-kpi-icon-wrap" style={{background:`${color}18`,color}}><Icon size={18}/></div>
        {spark && <SparkLine values={spark} color={color} width={90} height={38}/>}
      </div>
      <p className="dl-kpi-value" style={{color}}>{value}</p>
      <p className="dl-kpi-label">{label}</p>
      {sub && <p className="dl-kpi-sub">{sub}</p>}
    </div>
  );
}

/* ── Tarjeta favorito ── */
function TarjetaFav({ p, onVer, onQuitar }) {
  const ubicacion = [p.ciudad,p.pais].filter(Boolean).join(", ")||p.distrito;
  return (
    <div className="dl-person-card">
      <div className="dl-person-header">
        <div className="dl-person-avatar">
          {p.foto
            ? <img src={p.foto} alt={p.nombre} style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover"}}/>
            : p.nombre?.charAt(0)?.toUpperCase()}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <p className="dl-person-nombre">{p.nombre}</p>
          <p className="dl-person-titulo">{p.titulo||"Sin título"}</p>
          {ubicacion && <p className="dl-person-meta"><FiMapPin size={10}/> {ubicacion}</p>}
        </div>
      </div>
      {p.area && <span className="dl-badge-area">{p.area}</span>}
      <div className="dl-person-tags">
        {(p.skills||[]).slice(0,3).map((s,i) => <span key={i} className="dl-tag-tec">{s}</span>)}
      </div>
      <div className="dl-person-actions">
        <button className="dl-btn-ver" onClick={onVer}>Ver perfil</button>
        {p.email && (
          <a href={`mailto:${p.email}?subject=Oportunidad BCP`} className="dl-btn-mail"><FiMail size={13}/></a>
        )}
        <button className="dl-btn-quitar" onClick={onQuitar} title="Quitar de favoritos">✕</button>
      </div>
    </div>
  );
}

/* ════ TAB VACANTES ════ */
function TabVacantes({ vacantes, setVacantes, liderData, user, onEditar, navigate }) {
  const [filtroArea, setFiltroArea] = useState("");
  const [soloMias,   setSoloMias]   = useState(false);

  const filtradas = vacantes.filter(v => {
    if (soloMias && v.liderUid !== user?.uid) return false;
    if (filtroArea && v.area !== filtroArea) return false;
    return true;
  });

  const eliminar = async (vId) => {
    if (!window.confirm("¿Eliminar esta vacante?")) return;
    await deleteDoc(doc(db, "vacantes", vId));
    setVacantes(prev => prev.filter(v => v.id !== vId));
  };

  const toggleActiva = async (v) => {
    await updateDoc(doc(db, "vacantes", v.id), { activa: !v.activa });
    setVacantes(prev => prev.map(x => x.id===v.id ? {...x, activa:!x.activa} : x));
  };

  return (
    <div>
      <div className="vac-filtros-bar">
        <select className="vac-select" value={filtroArea} onChange={e=>setFiltroArea(e.target.value)}>
          <option value="">Todas las áreas</option>
          {AREAS_BCP.map(a => <option key={a}>{a}</option>)}
        </select>
        <label className="vac-toggle-label">
          <input type="checkbox" checked={soloMias} onChange={e=>setSoloMias(e.target.checked)}/>
          Solo mis vacantes
        </label>
        <span className="vac-count">{filtradas.length} vacante{filtradas.length!==1?"s":""}</span>
      </div>

      {filtradas.length===0 ? (
        <div className="dl-empty-state">
          <FiBriefcase size={48} color="#d1d5db"/>
          <h5>No hay vacantes</h5>
          <p>Publica oportunidades internas para los practicantes BCP</p>
        </div>
      ) : (
        <div className="vac-grid">
          {filtradas.map(v => (
            <VacanteCard key={v.id} v={v} esMia={v.liderUid===user?.uid}
              onEditar={() => onEditar(v)}
              onEliminar={() => eliminar(v.id)}
              onToggle={() => toggleActiva(v)}
              onVer={() => navigate(`/vacante/${v.id}`)}/>
          ))}
        </div>
      )}
    </div>
  );
}

function VacanteCard({ v, esMia, onEditar, onEliminar, onToggle, onVer }) {
  const activa = v.activa !== false;
  return (
    <div className={`vac-card ${!activa?"vac-card-inactiva":""}`}>
      <div className="vac-card-top">
        <div>
          <h4 className="vac-titulo">{v.titulo}</h4>
          <span className="vac-area-badge">{v.area}</span>
        </div>
        <span className={`vac-estado ${activa?"vac-activa":"vac-cerrada"}`}>{activa?"Activa":"Cerrada"}</span>
      </div>
      {v.descripcion && <p className="vac-desc">{v.descripcion.slice(0,120)}{v.descripcion.length>120?"...":""}</p>}
      <div className="vac-meta-row">
        {v.modalidad   && <span className="vac-chip">🏢 {v.modalidad}</span>}
        {v.jornada     && <span className="vac-chip">⏰ {v.jornada}</span>}
        {v.fechaCierre && <span className="vac-chip">📅 Cierra: {v.fechaCierre}</span>}
      </div>
      {v.skills?.length>0 && (
        <div className="vac-skills">
          {v.skills.slice(0,4).map((s,i) => <span key={i} className="dl-tag-tec">{s}</span>)}
        </div>
      )}
      <div className="vac-footer">
        <div className="vac-lider-info">
          <span className="vac-lider-dot">{(v.liderNombre||"L")[0]}</span>
          <span className="vac-lider-nombre">{v.liderNombre||"Líder BCP"}</span>
        </div>
        <div className="vac-acciones">
          <button className="vac-btn vac-btn-ver" onClick={onVer} title="Ver"><FiEye size={13}/></button>
          {esMia && (
            <>
              <button className="vac-btn vac-btn-edit"   onClick={onEditar}   title="Editar"><FiEdit2 size={13}/></button>
              <button className="vac-btn vac-btn-toggle" onClick={onToggle}   title={activa?"Cerrar":"Reactivar"}>{activa?"⏸":"▶"}</button>
              <button className="vac-btn vac-btn-del"    onClick={onEliminar} title="Eliminar"><FiTrash2 size={13}/></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════ MODAL NUEVA/EDITAR VACANTE ════ */
function ModalVacante({ vacante, liderData, user, onCerrar, onGuardar }) {
  const [titulo,      setTitulo]      = useState(vacante?.titulo      || "");
  const [area,        setArea]        = useState(vacante?.area         || "");
  const [descripcion, setDescripcion] = useState(vacante?.descripcion  || "");
  const [requisitos,  setRequisitos]  = useState(vacante?.requisitos   || "");
  const [modalidad,   setModalidad]   = useState(vacante?.modalidad    || "");
  const [jornada,     setJornada]     = useState(vacante?.jornada      || "");
  const [fechaCierre, setFechaCierre] = useState(vacante?.fechaCierre  || "");
  const [skillsStr,   setSkillsStr]   = useState((vacante?.skills||[]).join(", "));
  const [guardando,   setGuardando]   = useState(false);

  const guardar = async () => {
    if (!titulo.trim()||!area) { alert("Título y área son obligatorios."); return; }
    setGuardando(true);
    try {
      const datos = {
        titulo, area, descripcion, requisitos, modalidad, jornada, fechaCierre,
        skills: skillsStr.split(",").map(s=>s.trim()).filter(Boolean),
        liderUid:     user.uid,
        liderNombre:  liderData?.nombre || user.email,
        activa:       vacante?.activa ?? true,
        creadoEn:     vacante?.creadoEn || serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      };
      if (vacante?.id) {
        await updateDoc(doc(db, "vacantes", vacante.id), datos);
        onGuardar({ ...datos, id: vacante.id });
      } else {
        const ref = await addDoc(collection(db, "vacantes"), datos);
        onGuardar({ ...datos, id: ref.id });
      }
    } catch(e) { console.error(e); alert("Error al guardar."); }
    finally { setGuardando(false); }
  };

  return (
    <div className="vac-modal-overlay" onClick={onCerrar}>
      <div className="vac-modal-caja" onClick={e=>e.stopPropagation()}>
        <div className="vac-modal-header">
          <h3>{vacante?"Editar vacante":"Nueva vacante"}</h3>
          <button className="vac-modal-cerrar" onClick={onCerrar}>✕</button>
        </div>
        <div className="vac-modal-body">
          <div className="vac-form-grupo">
            <label>Título del puesto *</label>
            <input className="vac-input" placeholder="Ej: Practicante de Análisis de Datos"
              value={titulo} onChange={e=>setTitulo(e.target.value)}/>
          </div>
          <div className="vac-form-fila">
            <div className="vac-form-grupo">
              <label>Área *</label>
              <select className="vac-input" value={area} onChange={e=>setArea(e.target.value)}>
                <option value="">Selecciona</option>
                {AREAS_BCP.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="vac-form-grupo">
              <label>Modalidad</label>
              <select className="vac-input" value={modalidad} onChange={e=>setModalidad(e.target.value)}>
                <option value="">Selecciona</option>
                <option>Presencial</option><option>Remoto</option><option>Híbrido</option>
              </select>
            </div>
          </div>
          <div className="vac-form-fila">
            <div className="vac-form-grupo">
              <label>Jornada</label>
              <select className="vac-input" value={jornada} onChange={e=>setJornada(e.target.value)}>
                <option value="">Selecciona</option>
                <option>Tiempo completo</option><option>Medio tiempo</option>
                <option>Tiempo completo / Medio tiempo</option>
              </select>
            </div>
            <div className="vac-form-grupo">
              <label>Fecha de cierre</label>
              <input type="date" className="vac-input" value={fechaCierre} onChange={e=>setFechaCierre(e.target.value)}/>
            </div>
          </div>
          <div className="vac-form-grupo">
            <label>Descripción del puesto</label>
            <textarea className="vac-input vac-textarea" rows={4} maxLength={800}
              placeholder="¿Qué hará el practicante en este rol?"
              value={descripcion} onChange={e=>setDescripcion(e.target.value)}/>
            <small>{descripcion.length}/800</small>
          </div>
          <div className="vac-form-grupo">
            <label>Requisitos y perfil buscado</label>
            <textarea className="vac-input vac-textarea" rows={3} maxLength={500}
              placeholder="Conocimientos y habilidades que se valoran..."
              value={requisitos} onChange={e=>setRequisitos(e.target.value)}/>
          </div>
          <div className="vac-form-grupo">
            <label>Skills valoradas <span style={{fontWeight:400,color:"#888"}}>(separadas por comas)</span></label>
            <input className="vac-input" placeholder="Python, SQL, Power BI, Excel..."
              value={skillsStr} onChange={e=>setSkillsStr(e.target.value)}/>
            {skillsStr && (
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
                {skillsStr.split(",").filter(Boolean).map((s,i) => <span key={i} className="dl-tag-tec">{s.trim()}</span>)}
              </div>
            )}
          </div>
        </div>
        <div className="vac-modal-footer">
          <button className="vac-btn-cancelar" onClick={onCerrar}>Cancelar</button>
          <button className="vac-btn-guardar" onClick={guardar} disabled={guardando}>
            {guardando?"Guardando...":vacante?"Guardar cambios":"Publicar vacante"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardLider;
