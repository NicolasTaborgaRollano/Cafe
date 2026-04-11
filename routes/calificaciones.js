const express = require("express");
const router = express.Router();
const db = require("../db");
const { verificarToken } = require("../middleware/auth");

// Obtener calificaciones de un café
router.get("/:cafe_id", (req, res) => {
  const { cafe_id } = req.params;

  const sql = `
    SELECT 
      calificaciones.id,
      calificaciones.puntuacion,
      calificaciones.creado,
      clientes.id AS cliente_id,
      clientes.nombre AS cliente_nombre
    FROM calificaciones
    INNER JOIN clientes ON calificaciones.cliente_id = clientes.id
    WHERE calificaciones.cafe_id = ?
    ORDER BY calificaciones.creado DESC
  `;

  db.query(sql, [cafe_id], (err, results) => {
    if (err) {
      console.error("Error obteniendo calificaciones:", err);
      return res.status(500).json({ error: "Error al obtener calificaciones" });
    }

    return res.json(results);
  });
});

// Obtener mi rating para un café
router.get("/mio/:cafe_id", verificarToken, (req, res) => {
  const { cafe_id } = req.params;
  const cliente_id = req.usuario.id;

  const sql = `
    SELECT puntuacion 
    FROM calificaciones 
    WHERE cafe_id = ? AND cliente_id = ?
  `;

  db.query(sql, [cafe_id, cliente_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error obteniendo rating" });
    }
    res.json({ puntuacion: results[0]?.puntuacion || 0 });
  });
});

// Crear o actualizar calificación
router.post("/", verificarToken, (req, res) => {
  const { cafe_id, puntuacion } = req.body;
  const cliente_id = req.usuario.id;

  if (!cafe_id || !puntuacion) {
    return res.status(400).json({
      error: "Se requiere cafe_id y puntuacion"
    });
  }

  if (puntuacion < 1 || puntuacion > 5) {
    return res.status(400).json({
      error: "La puntuación debe estar entre 1 y 5"
    });
  }

  const upsertSql = `
    INSERT INTO calificaciones (cafe_id, cliente_id, puntuacion, creado)
    VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE puntuacion = VALUES(puntuacion), creado = NOW()
  `;

  db.query(upsertSql, [cafe_id, cliente_id, puntuacion], (err) => {
    if (err) {
      console.error("Error guardando calificación:", err);
      return res.status(500).json({ error: "Error al guardar calificación" });
    }

    const updateRatingSql = `
      UPDATE cafes
      SET rating = (
        SELECT ROUND(AVG(puntuacion), 2)
        FROM calificaciones
        WHERE cafe_id = ?
      )
      WHERE id = ?
    `;

    db.query(updateRatingSql, [cafe_id, cafe_id], (updateErr) => {
      if (updateErr) {
        console.error("Error actualizando rating del café:", updateErr);
        return res.status(500).json({ error: "Calificación guardada, pero falló actualización de rating" });
      }

      return res.json({
        message: "Calificación guardada correctamente"
      });
    });
  });
});

module.exports = router;