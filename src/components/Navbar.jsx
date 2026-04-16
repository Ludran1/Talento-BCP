import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import "../stylesheets/Navbar.css";
import logoBCP from "../images/LogoBCP.png";

import { FaHome, FaUsers, FaChartBar, FaUser, FaSignOutAlt } from "react-icons/fa";

/*
  esLider se determina consultando Firestore:
  si el uid existe en la colección "lideres" → es líder.
  Así funciona independientemente del dominio del correo.
*/
function Navbar() {
  const [user,    setUser]    = useState(null);
  const [esLider, setEsLider] = useState(false);
  const [checked, setChecked] = useState(false); // evita flash
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDocs(
            query(collection(db, "lideres"), where("uid", "==", u.uid))
          );
          setEsLider(!snap.empty);
        } catch {
          setEsLider(false);
        }
      } else {
        setEsLider(false);
      }
      setChecked(true);
    });
    return () => unsub();
  }, []);

  const cerrarSesion = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (!checked) return null; // evita parpadeo antes de saber el rol

  return (
    <nav className="navbar-custom">
      <div className="logo-container" onClick={() => navigate("/")}>
        <img src={logoBCP} alt="BCP" className="logo-img" />
        <span className="logo-text">| Talento BCP</span>
      </div>

      <div className="nav-actions">
        <Link to="/" className="nav-link">
          <FaHome className="icon-btn" /> Inicio
        </Link>

        <Link to="/catalogo" className="nav-link">
          <FaUsers className="icon-btn" /> Buscar Talento
        </Link>

        {user ? (
          <>
            {esLider ? (
              <Link to="/dashboard-lider" className="nav-link nav-highlight">
                <FaChartBar className="icon-btn" /> Dashboard
              </Link>
            ) : (
              <Link to="/perfil" className="nav-link">
                <FaUser className="icon-btn" /> Mi perfil
              </Link>
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
      </div>
    </nav>
  );
}

export default Navbar;
