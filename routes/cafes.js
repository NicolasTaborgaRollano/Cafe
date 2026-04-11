const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten archivos de imagen"));
    }
    cb(null, true);
  }
});

// Obtener todos los cafés
router.get("/", (req, res) => {
  const sql = "SELECT * FROM cafes ORDER BY creado DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error obteniendo cafés:", err);
      return res.status(500).json({ error: "Error al obtener cafés" });
    }

    return res.json(results);
  });
});

// Buscar cafés por nombre o descripción
router.get("/search/:texto", (req, res) => {
  const texto = `%${req.params.texto}%`;

  const sql = `
    SELECT *
    FROM cafes
    WHERE nombre LIKE ? OR descripcion LIKE ?
    ORDER BY creado DESC
  `;

  db.query(sql, [texto, texto], (err, results) => {
    if (err) {
      console.error("Error buscando cafés:", err);
      return res.status(500).json({ error: "Error al buscar cafés" });
    }

    return res.json(results);
  });
});

// Obtener un café por ID
router.get("/:id", (req, res) => {
  const { id } = req.params;

  const sql = "SELECT * FROM cafes WHERE id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error obteniendo café:", err);
      return res.status(500).json({ error: "Error al obtener el café" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Café no encontrado" });
    }

    return res.json(results[0]);
  });
});

// Insertar un nuevo café con imagen subida
router.post("/", (req, res) => {
  upload.single("imagen")(req, res, (uploadErr) => {
    if (uploadErr) {
      console.error("Error subiendo imagen:", uploadErr);
      return res.status(400).json({
        error: uploadErr.message || "Error al subir la imagen"
      });
    }

    const { nombre, descripcion, precio } = req.body;

    if (!nombre || !descripcion || precio == null || precio === "") {
      return res.status(400).json({
        error: "Faltan datos. Se requiere nombre, descripcion y precio"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Imagen requerida"
      });
    }

    const imagen = `http://localhost:3000/uploads/${req.file.filename}`;

    const sql = `
      INSERT INTO cafes (nombre, descripcion, precio, imagen, rating, creado)
      VALUES (?, ?, ?, ?, 0, NOW())
    `;

    db.query(sql, [nombre, descripcion, precio, imagen], (err, result) => {
      if (err) {
        console.error("Error insertando café:", err);
        return res.status(500).json({
          error: "Error al insertar café",
          detalle: err.message
        });
      }

      return res.status(201).json({
        message: "Café creado correctamente",
        id: result.insertId,
        imagen
      });
    });
  });
});

// Actualizar un café
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, imagen, rating } = req.body;

  const sql = `
    UPDATE cafes
    SET nombre = ?, descripcion = ?, precio = ?, imagen = ?, rating = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [nombre, descripcion, precio, imagen, rating, id],
    (err, result) => {
      if (err) {
        console.error("Error actualizando café:", err);
        return res.status(500).json({ error: "Error al actualizar café" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Café no encontrado" });
      }

      return res.json({ message: "Café actualizado correctamente" });
    }
  );
});

// Eliminar un café
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM cafes WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error eliminando café:", err);
      return res.status(500).json({ error: "Error al eliminar café" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Café no encontrado" });
    }

    return res.json({ message: "Café eliminado correctamente" });
  });
});

module.exports = router;