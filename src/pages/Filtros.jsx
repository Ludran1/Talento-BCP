import { useState } from "react";

/* ─── CONSTANTES ─── */
const AREAS_BCP = [
  "Analítica & Tecnología",
  "Finanzas & Control",
  "Gestión & Operaciones",
  "Comunicación & Relación",
  "Riesgos & Cumplimiento",
  "Marketing & Experiencia Cliente",
];

const NIVELES_EDU = [
  "Técnico",
  "Universitario (en curso)",
  "Universitario (egresado)",
  "Postgrado",
  "Maestría",
  "Doctorado",
];

const IDIOMAS_OPC = [
  "Español","Inglés","Portugués","Francés","Alemán",
  "Chino (Mandarín)","Japonés","Coreano","Italiano","Ruso",
  "Árabe","Hindi","Neerlandés","Polaco","Turco",
  "Sueco","Noruego","Danés","Finés","Griego",
  "Hebreo","Tailandés","Vietnamita","Indonesio","Malayo",
  "Ucraniano","Catalán","Quechua","Aymara",
];

const GENEROS = ["Hombre", "Mujer", "Prefiero no decir", "Otro"];

/* Distritos / ciudades más frecuentes en Lima + otras ciudades de Perú */
const UBICACIONES = [
  "Lima", "Miraflores", "San Isidro", "Surco", "La Molina",
  "San Borja", "Barranco", "Pueblo Libre", "Magdalena",
  "Lince", "Jesús María", "San Miguel", "Chorrillos",
  "Los Olivos", "Independencia", "San Martín de Porres",
  "Ate", "Santa Anita", "El Agustino", "Villa El Salvador",
  "Callao", "Arequipa", "Trujillo", "Cusco", "Piura",
  "Chiclayo", "Iquitos", "Huancayo",
];

const toggle = (arr, val) =>
  arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

/* ─── Grupo colapsable ─── */
function Grupo({ titulo, badge = 0, inicialAbierto = false, children }) {
  const [abierto, setAbierto] = useState(inicialAbierto);
  return (
    <div className="fg-grupo">
      <button
        className="fg-cabecera"
        onClick={() => setAbierto((v) => !v)}
        type="button"
      >
        <span className="fg-cabecera-izq">
          <span className="fg-titulo">{titulo}</span>
          {badge > 0 && <span className="fg-badge-mini">{badge}</span>}
        </span>
        <span className={`fg-chevron ${abierto ? "fg-chevron-open" : ""}`}>❯</span>
      </button>
      {abierto && <div className="fg-body">{children}</div>}
    </div>
  );
}

function Chip({ label, activo, onClick }) {
  return (
    <button
      type="button"
      className={`fg-chip ${activo ? "fg-chip-activo" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function ToggleRow({ label, activo, onChange }) {
  return (
    <div className="fg-toggle-row" onClick={onChange}>
      <span className="fg-toggle-label">{label}</span>
      <div className={`fg-toggle ${activo ? "fg-toggle-on" : ""}`}>
        <div className="fg-toggle-bola" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   FILTROS
   Props:
     filtros           → estado actual
     onChange          → fn(nuevosFiltros)
     skillsDisponibles → string[] dinámicos
     esLider           → bool
     abierto           → bool (drawer mobile)
     onCerrar          → fn()
══════════════════════════════════════════ */
function Filtros({
  filtros,
  onChange,
  skillsDisponibles = [],
  esLider = false,
  abierto = false,
  onCerrar,
}) {
  const [busqSkill, setBusqSkill] = useState("");
  const [busqUbic,  setBusqUbic]  = useState("");

  const upd = (campo, valor) => onChange({ ...filtros, [campo]: valor });
  const tgl = (campo, val)   => onChange({ ...filtros, [campo]: toggle(filtros[campo] || [], val) });

  const cntArea = (filtros.areasActuales?.length || 0) + (filtros.areasAnteriores?.length || 0);
  const total =
    cntArea +
    (filtros.skills?.length         || 0) +
    (filtros.idiomas?.length        || 0) +
    (filtros.nivelEducacion?.length || 0) +
    (filtros.generos?.length        || 0) +
    (filtros.ubicaciones?.length    || 0) +
    (filtros.soloFavoritos       ? 1 : 0) +
    (filtros.soloConProyectos    ? 1 : 0) +
    (filtros.soloConRotaciones   ? 1 : 0);

  const limpiar = () =>
    onChange({
      ...filtros,
      areasActuales:    [],
      areasAnteriores:  [],
      skills:           [],
      idiomas:          [],
      nivelEducacion:   [],
      generos:          [],
      ubicaciones:      [],
      soloFavoritos:    false,
      soloConProyectos: false,
      soloConRotaciones:false,
    });

  const skillsFiltrados = skillsDisponibles.filter((s) =>
    s.toLowerCase().includes(busqSkill.toLowerCase())
  );
  const ubicFiltradas = UBICACIONES.filter((u) =>
    u.toLowerCase().includes(busqUbic.toLowerCase())
  );

  return (
    <>
      {abierto && <div className="filtros-overlay" onClick={onCerrar} />}

      <aside className={`filtros-panel ${abierto ? "filtros-panel-open" : ""}`}>

        {/* HEADER */}
        <div className="filtros-header">
          <div className="filtros-header-left">
            <span className="filtros-header-titulo">Filtros</span>
            {total > 0 && <span className="filtros-badge">{total}</span>}
          </div>
          <div className="filtros-header-right">
            {total > 0 && (
              <button className="filtros-limpiar-btn" onClick={limpiar}>
                Limpiar todo
              </button>
            )}
          </div>
        </div>

        <div className="filtros-scroll">

          {/* FAVORITOS — solo líderes */}
          {esLider && (
            <div className="fg-grupo">
              <div className="fg-cabecera fg-cabecera-flat">
                <span className="fg-cabecera-izq">
                  <span className="fg-titulo">Talentos favoritos</span>
                </span>
                <input
                  type="checkbox"
                  className="fg-checkbox"
                  checked={!!filtros.soloFavoritos}
                  onChange={() => upd("soloFavoritos", !filtros.soloFavoritos)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* ─── SKILLS / TAGS ─── */}
          <Grupo
            titulo="Skills / Tags"
            badge={filtros.skills?.length || 0}
            inicialAbierto={true}
          >
            <p className="fg-hint">Filtra por tecnologías y herramientas</p>
            <input
              className="fg-search-input"
              placeholder="Buscar skill..."
              value={busqSkill}
              onChange={(e) => setBusqSkill(e.target.value)}
            />
            {skillsFiltrados.length > 0 ? (
              <div className="fg-chips-wrap">
                {skillsFiltrados.slice(0, 40).map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    activo={(filtros.skills || []).includes(s)}
                    onClick={() => tgl("skills", s)}
                  />
                ))}
              </div>
            ) : (
              <p className="fg-empty">
                {skillsDisponibles.length === 0 ? "Cargando skills..." : "Sin coincidencias"}
              </p>
            )}
          </Grupo>

          {/* ─── UBICACIÓN ─── */}
          <Grupo titulo="Ubicación" badge={filtros.ubicaciones?.length || 0}>
            <p className="fg-hint">Filtra por ciudad o distrito</p>
            <input
              className="fg-search-input"
              placeholder="Buscar ubicación..."
              value={busqUbic}
              onChange={(e) => setBusqUbic(e.target.value)}
            />
            <div className="fg-chips-wrap">
              {ubicFiltradas.map((u) => (
                <Chip
                  key={u}
                  label={u}
                  activo={(filtros.ubicaciones || []).includes(u)}
                  onClick={() => tgl("ubicaciones", u)}
                />
              ))}
            </div>
          </Grupo>

          {/* ─── ÁREA DEL PRACTICANTE ─── */}
          <Grupo titulo="Área del practicante" badge={cntArea}>
            <div className="fg-subgrupo">
              <div className="fg-subgrupo-header">
                <span className="fg-subgrupo-dot fg-dot-actual" />
                <span className="fg-subgrupo-titulo">Área actual</span>
              </div>
              <p className="fg-hint">Área en la que trabaja actualmente</p>
              <div className="fg-chips-wrap">
                {AREAS_BCP.map((a) => (
                  <Chip
                    key={`act-${a}`}
                    label={a}
                    activo={(filtros.areasActuales || []).includes(a)}
                    onClick={() => tgl("areasActuales", a)}
                  />
                ))}
              </div>
            </div>

            <div className="fg-subgrupo" style={{ marginTop: 14 }}>
              <div className="fg-subgrupo-header">
                <span className="fg-subgrupo-dot fg-dot-anterior" />
                <span className="fg-subgrupo-titulo">Áreas anteriores en BCP</span>
              </div>
              <p className="fg-hint">Áreas por las que rotó anteriormente</p>
              <div className="fg-chips-wrap">
                {AREAS_BCP.map((a) => (
                  <Chip
                    key={`ant-${a}`}
                    label={a}
                    activo={(filtros.areasAnteriores || []).includes(a)}
                    onClick={() => tgl("areasAnteriores", a)}
                  />
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <ToggleRow
                  label="Solo con historial interno BCP"
                  activo={!!filtros.soloConRotaciones}
                  onChange={() => upd("soloConRotaciones", !filtros.soloConRotaciones)}
                />
              </div>
            </div>
          </Grupo>

          {/* ─── IDIOMAS ─── */}
          <Grupo titulo="Idiomas" badge={filtros.idiomas?.length || 0}>
            <div className="fg-chips-wrap">
              {IDIOMAS_OPC.map((id) => (
                <Chip
                  key={id}
                  label={id}
                  activo={(filtros.idiomas || []).includes(id)}
                  onClick={() => tgl("idiomas", id)}
                />
              ))}
            </div>
          </Grupo>

          {/* ─── FORMACIÓN ─── */}
          <Grupo titulo="Formación" badge={filtros.nivelEducacion?.length || 0}>
            <div className="fg-chips-wrap">
              {NIVELES_EDU.map((n) => (
                <Chip
                  key={n}
                  label={n}
                  activo={(filtros.nivelEducacion || []).includes(n)}
                  onClick={() => tgl("nivelEducacion", n)}
                />
              ))}
            </div>
          </Grupo>

          {/* ─── GÉNERO ─── */}
          <Grupo titulo="Género" badge={filtros.generos?.length || 0}>
            <div className="fg-chips-wrap">
              {GENEROS.map((g) => (
                <Chip
                  key={g}
                  label={g}
                  activo={(filtros.generos || []).includes(g)}
                  onClick={() => tgl("generos", g)}
                />
              ))}
            </div>
          </Grupo>

          {/* ─── PROYECTOS ─── */}
          <Grupo titulo="Proyectos">
            <ToggleRow
              label="Con proyectos destacados"
              activo={!!filtros.soloConProyectos}
              onChange={() => upd("soloConProyectos", !filtros.soloConProyectos)}
            />
          </Grupo>

        </div>

        {/* BOTÓN APLICAR mobile */}
        <div className="filtros-footer-mobile">
          <button className="filtros-aplicar-btn" onClick={onCerrar}>
            Ver resultados →
          </button>
        </div>
      </aside>
    </>
  );
}

export default Filtros;
