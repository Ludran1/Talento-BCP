import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useRol } from "../hooks/useRol";
import "../stylesheets/Navbar.css";
import logoBCP from "../images/LogoBCP.png";
import { FaHome, FaUsers, FaChartBar, FaUser, FaSignOutAlt, FaBriefcase } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const { user, rol, cargando } = useRol();

  const cerrarSesion = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav className="navbar-custom">
      {/* LOGO */}
      <div className="logo-container" onClick={() => navigate("/")}>
        <img src={logoBCP} alt="BCP" className="logo-img" />
        <span className="logo-text">| Talento BCP</span>
      </div>

      {/* NAV LINKS */}
      <div className="nav-actions">

        <Link to="/" className="nav-link">
          <FaHome className="icon-btn" /> Inicio
        </Link>

        {/* El catálogo es visible para todos */}
        <Link to="/catalogo" className="nav-link">
          <FaUsers className="icon-btn" /> Buscar Talento
        </Link>

        {!cargando && (
          <>
            {user ? (
              <>
                {rol === "lider" ? (
                  /* LÍDER → Dashboard*/
                  <>
                    <Link to="/dashboard-lider" className="nav-link nav-highlight">
                      <FaChartBar className="icon-btn" /> Dashboard
                    </Link>
                  </>
                ) : (
                  /* PRACTICANTE → Mi perfil (solo ver) */
                  <>
                    <Link to="/perfil" className="nav-link">
                      <FaUser className="icon-btn" /> Mi perfil
                    </Link>
                  </>
                )}

                <button className="nav-link nav-logout" onClick={cerrarSesion}>
                  <FaSignOutAlt className="icon-btn" /> Salir
                </button>
              </>
            ) : (
              <Link to="/auth" className="nav-link">
                <FaUser className="icon-btn" /> Iniciar sesión
              </Link>
            )}
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
