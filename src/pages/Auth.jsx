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
  LÓGICA DE ROLES
  ──────────────────────────────────────────────────────
  El rol NO se detecta por el correo (ambos tipos de
  usuario pueden tener correo institucional BCP).

  En su lugar el usuario elige explícitamente:
    · Practicante  → se busca / crea en colección "practicantes"
    · Líder BCP    → se busca / crea en colección "lideres"

  En login se verifica que el usuario exista en la
  colección correcta para evitar acceso cruzado.
  ──────────────────────────────────────────────────────
*/

function Auth() {
  const navigate = useNavigate();

  // "login-prac" | "registro-prac" | "login-lider"
  const [modo,     setModo]     = useState("login-prac");
  const [nombre,   setNombre]   = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [cargando, setCargando] = useState(false);

  const esLider = modo === "login-lider";

  const reset = (nuevoModo) => {
    setModo(nuevoModo);
    setError("");
    setNombre("");
    setEmail("");
    setPassword("");
  };

  /* ── Garantizar doc en "lideres" ── */
  const asegurarLider = async (u) => {
    const snap = await getDocs(
      query(collection(db, "lideres"), where("uid", "==", u.uid))
    );
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

  /* ── Garantizar doc en "practicantes" ── */
  const asegurarPracticante = async (u, nombreOverride = "") => {
    const snap = await getDocs(
      query(collection(db, "practicantes"), where("uid", "==", u.uid))
    );
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
        rotaciones:     [],
      });
    }
  };

  /* ── Verificar que el uid exista en la colección esperada ── */
  const existeEn = async (coleccion, uid) => {
    const snap = await getDocs(
      query(collection(db, coleccion), where("uid", "==", uid))
    );
    return !snap.empty;
  };

  /* ── REGISTRO practicante ── */
  const handleRegistro = async () => {
    setError("");
    if (!nombre.trim())       { setError("Ingresa tu nombre completo.");                        return; }
    if (!email.trim())        { setError("Ingresa tu correo.");                                 return; }
    if (password.length < 6)  { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setCargando(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await asegurarPracticante(cred.user, nombre.trim());
      navigate("/perfil");
    } catch (e) {
      setError(
        e.code === "auth/email-already-in-use"
          ? "Este correo ya está registrado. Usa Iniciar sesión."
          : "Error al registrarse. Verifica los datos."
      );
    } finally { setCargando(false); }
  };

  /* ── LOGIN ── */
  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password) { setError("Completa todos los campos."); return; }
    setCargando(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid    = result.user.uid;

      if (esLider) {
        /* verificar que sea líder registrado */
        const enLideres = await existeEn("lideres", uid);
        if (!enLideres) {
          /* podría ser su primer login como líder → creamos el doc */
          await asegurarLider(result.user);
        }
        navigate("/dashboard-lider");
      } else {
        /* verificar que sea practicante */
        const enLideres = await existeEn("lideres", uid);
        if (enLideres) {
          setError("Este usuario es un líder BCP. Selecciona la pestaña 'Líder BCP'.");
          await auth.signOut();
          return;
        }
        await asegurarPracticante(result.user);
        navigate("/perfil");
      }
    } catch (e) {
      if (e.code === "auth/user-not-found" || e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setError("Correo o contraseña incorrectos.");
      } else if (!e.code) {
        // error propio (líder en modo practicante)
        setError(e.message || "Error al iniciar sesión.");
      } else {
        setError("Error al iniciar sesión. Intenta de nuevo.");
      }
    } finally { setCargando(false); }
  };

  /* ── GOOGLE ── */
  const handleGoogle = async () => {
    setError("");
    setCargando(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user   = result.user;

      if (esLider) {
        await asegurarLider(user);
        navigate("/dashboard-lider");
      } else {
        /* si ya es líder, no permitir acceso como practicante */
        const enLideres = await existeEn("lideres", user.uid);
        if (enLideres) {
          setError("Este usuario es un líder BCP. Selecciona la pestaña 'Líder BCP'.");
          await auth.signOut();
          return;
        }
        await asegurarPracticante(user);
        navigate("/perfil");
      }
    } catch (e) {
      if (!e.code) setError(e.message || "Error al iniciar sesión.");
      else setError("Error al iniciar sesión con Google.");
    } finally { setCargando(false); }
  };

  const handleSubmit = () =>
    modo === "registro-prac" ? handleRegistro() : handleLogin();

  return (
    <div className="auth-container">

      {/* ── IZQUIERDA ── */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-left-logo">B</div>
          <h2>Talento BCP</h2>
          <p>
            {esLider
              ? "Accede al panel de líderes para gestionar y descubrir el mejor talento interno."
              : modo === "registro-prac"
              ? "Crea tu perfil como practicante y hazte visible para los líderes del banco."
              : "Accede a tu perfil, actualiza tu información y conecta con oportunidades internas."}
          </p>

          <div className="auth-left-cards">
            <div className="auth-left-card">
              <FiUser size={16} className="auth-left-card-icon"/>
              <div>
                <strong>Practicantes</strong>
                <p>Usa la pestaña <em>Practicante</em> para registrarte o iniciar sesión con tu correo.</p>
              </div>
            </div>
            <div className="auth-left-card">
              <HiOutlineOfficeBuilding size={16} className="auth-left-card-icon"/>
              <div>
                <strong>Líderes BCP</strong>
                <p>Usa la pestaña <em>Líder BCP</em>. Las cuentas son creadas por el equipo de TI.</p>
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

          {/* SELECTOR DE ROL */}
          <div className="auth-role-selector">
            <button
              className={`auth-role-btn ${!esLider ? "auth-role-activo" : ""}`}
              onClick={() => reset("login-prac")}
            >
              <FiUser size={15}/> Practicante
            </button>
            <button
              className={`auth-role-btn ${esLider ? "auth-role-activo" : ""}`}
              onClick={() => reset("login-lider")}
            >
              <HiOutlineOfficeBuilding size={15}/> Líder BCP
            </button>
          </div>

          {/* TABS login / registro (solo practicante) */}
          {!esLider && (
            <div className="auth-tabs">
              <button
                className={`auth-tab ${modo === "login-prac" ? "auth-tab-activo" : ""}`}
                onClick={() => reset("login-prac")}
              >
                Iniciar sesión
              </button>
              <button
                className={`auth-tab ${modo === "registro-prac" ? "auth-tab-activo" : ""}`}
                onClick={() => reset("registro-prac")}
              >
                Registrarse
              </button>
            </div>
          )}

          {esLider && (
            <p className="auth-lider-nota">
              <FiInfo size={13}/> Inicia sesión con las credenciales asignadas por TI.
            </p>
          )}

          {/* ERROR */}
          {error && (
            <div className="auth-error">
              <FiInfo size={13}/> {error}
            </div>
          )}

          {/* NOMBRE — solo registro */}
          {modo === "registro-prac" && (
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
              placeholder="Correo electrónico"
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

          <button
            className="auth-btn-primary"
            onClick={handleSubmit}
            disabled={cargando}
          >
            {cargando
              ? "Cargando..."
              : modo === "registro-prac"
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
