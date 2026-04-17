import { useState } from "react";

const AREAS = [
    "Analitica & Tecnología",
    "Finanzas & Control",
    "Gestión & Operaciones",
    "Comunicación & Relación",
];

const IDIOMAS = ["Español", "Inglés", "Portugués", "Francés", "Alemán"];

const SKILLS_OPCIONES = [
    "Excel", "Python", "SQL", "Power BI", "Tableau",
    "Java", "React", "Node.js", "Machine Learning", "Data Science",
];

function FiltrosPanel({ filtros, onChange, totalResultados, abierto, setAbierto }) {

    const handleSkillToggle = (skill) => {
        const actuales = filtros.skills || [];
        const nuevos = actuales.includes(skill)
            ? actuales.filter((s) => s !== skill)
            : [...actuales, skill];
        onChange({ ...filtros, skills: nuevos });
    };

    const handleIdiomaToggle = (idioma) => {
        const actuales = filtros.idiomas || [];
        const nuevos = actuales.includes(idioma)
            ? actuales.filter((i) => i !== idioma)
            : [...actuales, idioma];
        onChange({ ...filtros, idiomas: nuevos });
    };

    const limpiarFiltros = () => {
        onChange({ area: "", skills: [], idiomas: [], experiencia: "", formacion: "", proyectos: false });
    };

    const hayFiltrosActivos =
        filtros.area ||
        (filtros.skills || []).length > 0 ||
        (filtros.idiomas || []).length > 0 ||
        filtros.experiencia ||
        filtros.formacion ||
        filtros.proyectos;

    const ContenidoFiltros = () => (
        <div className="filtros-contenido">
            <div className="filtro-grupo">
                <h6 className="filtro-titulo">Área de experiencia</h6>
                <select
                    className="filtro-select"
                    value={filtros.area || ""}
                    onChange={(e) => onChange({ ...filtros, area: e.target.value })}
                >
                    <option value="">Todas las áreas</option>
                    {AREAS.map((a) => <option key={a}>{a}</option>)}
                </select>
            </div>

            <div className="filtro-grupo">
                <h6 className="filtro-titulo">Skills técnicas</h6>
                <div className="filtro-tags">
                    {SKILLS_OPCIONES.map((skill) => (
                        <button
                            key={skill}
                            className={`filtro-tag ${(filtros.skills || []).includes(skill) ? "activo" : ""}`}
                            onClick={() => handleSkillToggle(skill)}
                        >
                            {skill}
                        </button>
                    ))}
                </div>
            </div>

            <div className="filtro-grupo">
                <h6 className="filtro-titulo">Idiomas</h6>
                <div className="filtro-tags">
                    {IDIOMAS.map((idioma) => (
                        <button
                            key={idioma}
                            className={`filtro-tag ${(filtros.idiomas || []).includes(idioma) ? "activo" : ""}`}
                            onClick={() => handleIdiomaToggle(idioma)}
                        >
                            {idioma}
                        </button>
                    ))}
                </div>
            </div>

            <div className="filtro-grupo">
                <h6 className="filtro-titulo">Nivel de experiencia</h6>
                <div className="filtro-radio-grupo">
                    {["", "Sin experiencia", "Menos de 1 año", "1-2 años", "Más de 2 años"].map((op) => (
                        <label key={op} className="filtro-radio">
                            <input
                                type="radio"
                                name="experiencia"
                                value={op}
                                checked={(filtros.experiencia || "") === op}
                                onChange={(e) => onChange({ ...filtros, experiencia: e.target.value })}
                            />
                            <span>{op === "" ? "Cualquiera" : op}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="filtro-grupo">
                <h6 className="filtro-titulo">Formación</h6>
                <select
                    className="filtro-select"
                    value={filtros.formacion || ""}
                    onChange={(e) => onChange({ ...filtros, formacion: e.target.value })}
                >
                    <option value="">Cualquier nivel</option>
                    <option>Técnico</option>
                    <option>Bachiller en curso</option>
                    <option>Bachiller completo</option>
                    <option>Maestría</option>
                </select>
            </div>

            <div className="filtro-grupo">
                <h6 className="filtro-titulo">Proyectos</h6>
                <label className="filtro-checkbox">
                    <input
                        type="checkbox"
                        checked={filtros.proyectos || false}
                        onChange={(e) => onChange({ ...filtros, proyectos: e.target.checked })}
                    />
                    <span>Solo perfiles con proyectos</span>
                </label>
            </div>

            {hayFiltrosActivos && (
                <button className="filtro-limpiar" onClick={limpiarFiltros}>
                    ✕ Limpiar filtros
                </button>
            )}
        </div>
    );

    return (
        <>
            {/* ── OVERLAY ── */}
            <div
                className={`filtros-overlay ${abierto ? "visible" : ""}`}
                onClick={() => setAbierto(false)}
                aria-hidden="true"
            />

            {/* ── SIDEBAR MOBILE + PANEL DESKTOP ── */}
            <aside className={`filtros-panel ${abierto ? "abierto" : ""}`}>

                {/* Header solo en mobile */}
                <div className="filtros-panel-header">
                    <span className="filtros-panel-titulo">Filtros</span>
                    <button
                        className="filtros-cerrar"
                        onClick={() => setAbierto(false)}
                        aria-label="Cerrar filtros"
                    >
                        ✕
                    </button>
                </div>

                <ContenidoFiltros />

                {/* Botón aplicar — solo mobile */}
                <div className="filtros-footer-mobile">
                    <button
                        className="filtros-aplicar"
                        onClick={() => setAbierto(false)}
                    >
                        Ver {totalResultados} perfil{totalResultados !== 1 ? "es" : ""}
                    </button>
                </div>
            </aside>
        </>
    );
}

export default FiltrosPanel;