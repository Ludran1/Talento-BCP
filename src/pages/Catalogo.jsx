import { useState } from "react";
import Navbar from "../components/Nabvar";
import CardPerfil from "../components/CardPerfil";
import Filtros from "../components/Filtros";

function Catalogo() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("");

  const perfiles = [
    {
      id: 1,
      nombre: "Valeria Ortiz",
      area: "Frontend",
      skills: ["React", "CSS", "JS"],
    },
    {
      id: 2,
      nombre: "Ana Torres",
      area: "Backend",
      skills: ["Node", "Firebase"],
    },
  ];

  const filtrados = perfiles.filter((p) => {
    return (
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
      (filtro === "" || p.area === filtro)
    );
  });

  return (
    <div style={{ background: "#f4f6f8", minHeight: "100vh" }}>
      <Navbar />

      <div style={styles.container}>
        {/* FILTROS */}
        <div style={styles.sidebar}>
          <Filtros setFiltro={setFiltro} />
        </div>

        {/* CONTENIDO */}
        <div style={styles.main}>
          <input
            type="text"
            placeholder="Buscar talento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.input}
          />

          {filtrados.map((perfil) => (
            <CardPerfil key={perfil.id} perfil={perfil} />
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    padding: "20px",
    gap: "20px",
  },
  sidebar: {
    width: "25%",
  },
  main: {
    width: "75%",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
  },
};

export default Catalogo;