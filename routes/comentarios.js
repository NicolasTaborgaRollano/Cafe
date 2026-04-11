const express = require("express");
const router = express.Router();
const db = require("../db");
const { verificarToken } = require("../middleware/auth");

// Obtener comentarios de un café
router.get("/:cafe_id", (req, res) => {
  const { cafe_id } = req.params;

  const sql = `
    SELECT 
      comentarios.id,
      comentarios.comentario,
      comentarios.creado,
      clientes.id AS cliente_id,
      clientes.nombre AS cliente_nombre
    FROM comentarios
    INNER JOIN clientes ON comentarios.cliente_id = clientes.id
    WHERE comentarios.cafe_id = ?
    ORDER BY comentarios.creado DESC
  `;

  db.query(sql, [cafe_id], (err, results) => {
    if (err) {
      console.error("Error obteniendo comentarios:", err);
      return res.status(500).json({ error: "Error al obtener comentarios" });
    }

    return res.json(results);
  });
});

// Agregar comentario
router.post("/", verificarToken, (req, res) => {
  const { cafe_id, comentario } = req.body;
  const cliente_id = req.usuario.id;

  if (!cafe_id || !comentario) {
    return res.status(400).json({
      error: "Faltan datos. Se requiere cafe_id y comentario"
    });
  }

  const sql = `
    INSERT INTO comentarios (cafe_id, cliente_id, comentario, creado)
    VALUES (?, ?, ?, NOW())
  `;

  db.query(sql, [cafe_id, cliente_id, comentario], (err, result) => {
    if (err) {
      console.error("Error agregando comentario:", err);
      return res.status(500).json({ error: "Error al agregar comentario" });
    }

    return res.status(201).json({
      message: "Comentario agregado correctamente",
      id: result.insertId
    });
  });
});

// Eliminar comentario
router.delete("/:id", verificarToken, (req, res) => {
  const { id } = req.params;
  const cliente_id = req.usuario.id;

  const sql = "DELETE FROM comentarios WHERE id = ? AND cliente_id = ?";

  db.query(sql, [id, cliente_id], (err, result) => {
    if (err) {
      console.error("Error eliminando comentario:", err);
      return res.status(500).json({ error: "Error al eliminar comentario" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Comentario no encontrado o no autorizado" });
    }

    return res.json({ message: "Comentario eliminado correctamente" });
  });
});

module.exports = router;