import { Link } from "react-router-dom";

function CardPerfil({ perfil }) {
  return (
    <div style={styles.card}>
      <h3>{perfil.nombre}</h3>
      <p>{perfil.area}</p>

      <div>
        {perfil.skills.map((skill, i) => (
          <span key={i} style={styles.skill}>
            {skill}
          </span>
        ))}
      </div>

      <Link to={`/perfil/${perfil.id}`}>Ver perfil</Link>
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #ddd",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "15px",
    background: "white",
  },
  skill: {
    background: "#eee",
    padding: "5px",
    margin: "3px",
    borderRadius: "5px",
    display: "inline-block",
  },
};

export default CardPerfil;