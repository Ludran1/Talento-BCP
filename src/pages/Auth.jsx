import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc, collection, query, where, getDocs,
} from "firebase/firestore";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { db, auth, provider } from "../firebase/firebase";
import "../stylesheets/Auth.css";
import { FiUser, FiMail, FiLock, FiArrowLeft, FiInfo } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineOfficeBuilding } from "react-icons/hi";

/*
  DETECCIÓN AUTOMÁTICA LÍDER / PRACTICANTE
  ─────────────────────────────────────────
  · correo @bcp.com  → Líder    → redirige a /dashboard-lider
  · cualquier otro   → Practicante → redirige a /perfil

  Líderes NO se auto-registran: usan credenciales asignadas por TI.
  El modo "Registro" solo aplica para practicantes.
*/
function Auth() {
  const navigate = useNavigate();

  const [modo,     setModo]     = useState("login");   // "login" | "registro"
  const [nombre,   setNombre]   = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [cargando, setCargando] = useState(false);

  const esLider = email.trim().toLowerCase().endsWith("@bcp.com");

  const reset = (nuevoModo) => {
    setModo(nuevoModo);
    setError("");
    setNombre("");
    setEmail("");
    setPassword("");
  };

  /* ── Garantizar documento en colección "lideres" ── */
  const asegurarDocLider = async (u) => {
    const snap = await getDocs(query(collection(db, "lideres"), where("uid", "==", u.uid)));
    if (snap.empty) {
      await addDoc(collection(db, "lideres"), {
        uid:       u.uid,
        nombre:    u.displayName || "",
        email:     u.email,
        foto:      u.photoURL || "",
        favoritos: [],
        creadoEn:  new Date(),
      });
    }
  };

  /* ── Garantizar documento en colección "practicantes" ── */
  const asegurarDocPracticante = async (u, nombreOverride) => {
    const snap = await getDocs(query(collection(db, "practicantes"), where("uid", "==", u.uid)));
    if (snap.empty) {
      await addDoc(collection(db, "practicantes"), {
        uid:            u.uid,
        nombre:         nombreOverride || u.displayName || "",
        email:          u.email,
        foto:           u.photoURL || "",
        perfilCompleto: false,
        skills:         [],
        area:           "",
        experiencia:    [],
      });
    }
  };

  /* ── REGISTRO (solo practicantes) ── */
  const handleRegistro = async () => {
    setError("");
    if (esLider) {
      setError("Los líderes usan las credenciales asignadas por TI. Usa la pestaña Iniciar Sesión.");
      return;
    }
    if (!nombre.trim())    { setError("Ingresa tu nombre completo."); return; }
    if (!email.trim())     { setError("Ingresa tu correo."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setCargando(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await asegurarDocPracticante(cred.user, nombre.trim());
      navigate("/perfil");
    } catch (e) {
      setError(
        e.code === "auth/email-already-in-use"
          ? "Este correo ya está registrado. Prueba iniciar sesión."
          : "Error al registrarse. Verifica los datos."
      );
    } finally { setCargando(false); }
  };

  /* ── LOGIN — detecta automáticamente el tipo de usuario ── */
  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password) { setError("Completa todos los campos."); return; }
    setCargando(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (esLider) {
        await asegurarDocLider(result.user);
        navigate("/dashboard-lider");
      } else {
        await asegurarDocPracticante(result.user, "");
        navigate("/perfil");
      }
    } catch (e) {
      setError(
        e.code === "auth/user-not-found"
          ? "No existe una cuenta con este correo."
          : "Credenciales incorrectas."
      );
    } finally { setCargando(false); }
  };

  /* ── GOOGLE — detecta automáticamente el tipo de usuario ── */
  const handleGoogle = async () => {
    setError("");
    setCargando(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user   = result.user;
      const esL    = !!user.email?.endsWith("@bcp.com");
      if (esL) {
        await asegurarDocLider(user);
        navigate("/dashboard-lider");
      } else {
        await asegurarDocPracticante(user, "");
        navigate("/perfil");
      }
    } catch {
      setError("Error al iniciar sesión con Google.");
    } finally { setCargando(false); }
  };

  const handleSubmit = () => (modo === "registro" ? handleRegistro() : handleLogin());

  return (
    <div className="auth-container">

      {/* ── IZQUIERDA ── */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-left-logo">B</div>
          <h2>Talento BCP</h2>
          <p>
            {modo === "registro"
              ? "Crea tu perfil como practicante y hazte visible para los líderes del banco."
              : "Accede a la plataforma de gestión de talento interno del BCP."}
          </p>

          <div className="auth-left-cards">
            <div className="auth-left-card">
              <FiUser size={16} className="auth-left-card-icon"/>
              <div>
                <strong>Practicantes</strong>
                <p>Regístrate con cualquier correo o inicia sesión con tus credenciales.</p>
              </div>
            </div>
            <div className="auth-left-card">
              <HiOutlineOfficeBuilding size={16} className="auth-left-card-icon"/>
              <div>
                <strong>Líderes BCP</strong>
                <p>Inicia sesión con tu correo <code>@bcp.com</code> y la contraseña asignada por TI. El sistema te redirigirá automáticamente.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DERECHA ── */}
      <div className="auth-right">
        <button className="auth-volver-btn" onClick={() => navigate("/")}>
          <FiArrowLeft size={14}/> Volver
        </button>

        <div className="auth-box">

          {/* TABS */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${modo === "login" ? "auth-tab-activo" : ""}`}
              onClick={() => reset("login")}
            >
              Iniciar Sesión
            </button>
            <button
              className={`auth-tab ${modo === "registro" ? "auth-tab-activo" : ""}`}
              onClick={() => reset("registro")}
            >
              Registrarse
            </button>
          </div>

          {/* INDICADOR de tipo detectado */}
          {email.trim() && (
            <div className={`auth-tipo-badge ${esLider ? "auth-tipo-lider" : "auth-tipo-practicante"}`}>
              {esLider
                ? <><HiOutlineOfficeBuilding size={13}/> Detectado como <strong>Líder BCP</strong></>
                : <><FiUser size={13}/> Detectado como <strong>Practicante</strong></>
              }
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="auth-error">
              <FiInfo size={13}/> {error}
            </div>
          )}

          {/* NOMBRE — solo registro */}
          {modo === "registro" && (
            <div className="auth-field">
              <FiUser className="auth-field-icon" size={15}/>
              <input
                type="text"
                placeholder="Nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
          )}

          <div className="auth-field">
            <FiMail className="auth-field-icon" size={15}/>
            <input
              type="email"
              placeholder={modo === "login" ? "Correo (practicante o @bcp.com líder)" : "Correo electrónico"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="auth-field">
            <FiLock className="auth-field-icon" size={15}/>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {/* Advertencia registro líder */}
          {modo === "registro" && esLider && (
            <div className="auth-nota">
              <FiInfo size={12}/> Los líderes no se auto-registran. Cambia a la pestaña <strong>Iniciar Sesión</strong> y usa tus credenciales de TI.
            </div>
          )}

          <button
            className="auth-btn-primary"
            onClick={handleSubmit}
            disabled={cargando}
          >
            {cargando
              ? "Cargando..."
              : modo === "registro"
              ? "Crear cuenta"
              : esLider
              ? "Ingresar al Dashboard"
              : "Ingresar"}
          </button>

          <div className="auth-separator"><span>o continúa con</span></div>

          <button className="auth-btn-google" onClick={handleGoogle} disabled={cargando}>
            <FcGoogle size={18}/> Continuar con Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
