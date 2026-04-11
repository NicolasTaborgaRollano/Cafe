const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");

const cafesRoutes = require("./routes/cafes");
const comentariosRoutes = require("./routes/comentarios");
const clientesRoutes = require("./routes/clientes");
const calificacionesRoutes = require("./routes/calificaciones");

const app = express();
const PORT = 3000;

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
console.log("cafesRoutes:", typeof cafesRoutes);
console.log("comentariosRoutes:", typeof comentariosRoutes);
console.log("clientesRoutes:", typeof clientesRoutes);
console.log("calificacionesRoutes:", typeof calificacionesRoutes);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(uploadsDir));

app.get("/", (req, res) => {
  res.send("☕ API de cafés funcionando correctamente");
});

app.use("/cafes", cafesRoutes);
app.use("/comentarios", comentariosRoutes);
app.use("/clientes", clientesRoutes);
app.use("/calificaciones", calificacionesRoutes);

app.use((err, req, res, next) => {
  console.error("Error global del servidor:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    detalle: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Uploads en: ${uploadsDir}`);
});