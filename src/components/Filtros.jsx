function Filtros({ setFiltro }) {
  return (
    <div style={styles.box}>
      <h4>Filtrar por área</h4>

      <button onClick={() => setFiltro("Frontend")}>Frontend</button>
      <button onClick={() => setFiltro("Backend")}>Backend</button>
      <button onClick={() => setFiltro("")}>Todos</button>
    </div>
  );
}

const styles = {
  box: {
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    background: "white",
  },
};

export default Filtros;