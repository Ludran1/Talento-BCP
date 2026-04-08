import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={styles.nav}>
      <h2>Talento BCP</h2>

      <div>
        <Link to="/">Inicio</Link>
        <Link to="/login" style={{ marginLeft: "15px" }}>
          Iniciar sesión
        </Link>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px",
    background: "#002A8D",
    color: "white",
  },
};

export default Navbar;