import { useState } from "react";

const AREAS = [
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

const IDIOMAS_OPCIONES = ["Español", "Inglés", "Portugués", "Francés", "Alemán"];

const RANGOS_EXP = ["1–3 meses", "4–6 meses", "6–12 meses", "+12 meses"];

const toggle = (arr, val) =>
  arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

/* ── GrupoFiltro ── */
function GrupoFiltro({ titulo, icono, children, inicialAbierto = false }) {
  const [abierto, setAbierto] = useState(inicialAbierto);
  return (
    <div className="fg-grupo">
      <button className="fg-cabecera" onClick={() => setAbierto((v) => !v)} type="button">
        <span className="fg-cabecera-izq">
          <span className="fg-icono">{icono}</span>
          <span className="fg-titulo">{titulo}</span>
        </span>
        <span className={`fg-chevron ${abierto ? "fg-chevron-open" : ""}`}>❯</span>
      </button>
      {abierto && <div className="fg-body">{children}</div>}
    </div>
  );
}

function Chip({ label, activo, onClick }) {
  return (
    <button type="button" className={`fg-chip ${activo ? "fg-chip-activo" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

function ToggleSwitch({ activo, onChange, label }) {
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
══════════════════════════════════════════ */
function Filtros({
  filtros,
  onChange,
  skillsDisponibles = [],
  favoritosIds = [],
  esLider = false,
  abierto = false,
  onCerrar,
}) {
  const upd = (campo, valor) => onChange({ ...filtros, [campo]: valor });
  const toggleMulti = (campo, val) =>
    onChange({ ...filtros, [campo]: toggle(filtros[campo] || [], val) });

  const total =
    filtros.areas.length +
    filtros.skills.length +
    filtros.idiomas.length +
    filtros.nivelEducacion.length +
    (filtros.rangoExperiencia || []).length +
    (filtros.soloFavoritos ? 1 : 0) +
    (filtros.soloConProyectos ? 1 : 0);

  const limpiar = () =>
    onChange({
      ...filtros,
      areas: [], skills: [], idiomas: [], nivelEducacion: [],
      rangoExperiencia: [], soloFavoritos: false, soloConProyectos: false,
    });

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
            {total > 0 && <button className="filtros-limpiar-btn" onClick={limpiar}>Limpiar</button>}
            <button className="filtros-x-btn" onClick={onCerrar}>✕</button>
          </div>
        </div>

        <div className="filtros-scroll">

          {/* FAVORITOS (solo líderes) */}
          {esLider && (
            <div className="fg-grupo">
              <button className="fg-cabecera fg-cabecera-flat" type="button">
                <span className="fg-cabecera-izq">
                  <span className="fg-icono">☆</span>
                  <span className="fg-titulo">Talentos favoritos</span>
                </span>
                <input
                  type="checkbox"
                  className="fg-checkbox"
                  checked={filtros.soloFavoritos}
                  onChange={() => upd("soloFavoritos", !filtros.soloFavoritos)}
                  onClick={(e) => e.stopPropagation()}
                />
              </button>
            </div>
          )}

          {/* TAGS / SKILLS TÉCNICAS */}
          <GrupoFiltro titulo="Tags / Skills técnicas" icono="🏷️" inicialAbierto={true}>
            <p className="fg-hint">Tecnologías y herramientas</p>
            {skillsDisponibles.length > 0 ? (
              <div className="fg-chips-wrap">
                {skillsDisponibles.slice(0, 30).map((s) => (
                  <Chip key={s} label={s} activo={filtros.skills.includes(s)} onClick={() => toggleMulti("skills", s)} />
                ))}
              </div>
            ) : (
              <p className="fg-empty">Sin skills disponibles aún</p>
            )}
          </GrupoFiltro>

          {/* EXPERIENCIA */}
          <GrupoFiltro titulo="Experiencia" icono="💼">
            <p className="fg-hint">Tiempo total de experiencia acumulada</p>
            <div className="fg-chips-wrap">
              {RANGOS_EXP.map((r) => (
                <Chip
                  key={r}
                  label={r}
                  activo={(filtros.rangoExperiencia || []).includes(r)}
                  onClick={() => toggleMulti("rangoExperiencia", r)}
                />
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <ToggleSwitch
                activo={filtros.soloConProyectos}
                onChange={() => upd("soloConProyectos", !filtros.soloConProyectos)}
                label="Con proyectos destacados"
              />
            </div>
          </GrupoFiltro>

          {/* FORMACIÓN */}
          <GrupoFiltro titulo="Formación" icono="🎓">
            <div className="fg-chips-wrap">
              {NIVELES_EDU.map((n) => (
                <Chip key={n} label={n} activo={filtros.nivelEducacion.includes(n)} onClick={() => toggleMulti("nivelEducacion", n)} />
              ))}
            </div>
          </GrupoFiltro>

          {/* IDIOMAS */}
          <GrupoFiltro titulo="Idiomas" icono="🌍">
            <div className="fg-chips-wrap">
              {IDIOMAS_OPCIONES.map((id) => (
                <Chip key={id} label={id} activo={filtros.idiomas.includes(id)} onClick={() => toggleMulti("idiomas", id)} />
              ))}
            </div>
          </GrupoFiltro>

          {/* ÁREA DE VACANTES */}
          <GrupoFiltro titulo="Área de vacantes" icono="👥">
            <p className="fg-hint">Un practicante puede haber rotado por varias áreas</p>
            <div className="fg-chips-wrap">
              {AREAS.map((a) => (
                <Chip key={a} label={a} activo={filtros.areas.includes(a)} onClick={() => toggleMulti("areas", a)} />
              ))}
            </div>
          </GrupoFiltro>

        </div>

        {/* BOTÓN APLICAR mobile */}
        <div className="filtros-footer-mobile">
          <button className="filtros-aplicar-btn" onClick={onCerrar}>Ver resultados →</button>
        </div>

      </aside>
    </>
  );
}

export default Filtros;
