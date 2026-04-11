const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { verificarToken, SECRET_KEY } = require("../middleware/auth");

// =======================
// REGISTRO
// =======================
router.post("/registro", async (req, res) => {
  console.log("BODY QUE LLEGA:", req.body);
    try {
    const { nombre, email, password } = req.body;

    // 🔴 Validación
    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: "Se requiere nombre, email y password"
      });
    }

    // 🔍 Verificar si ya existe
    const checkSql = "SELECT id FROM clientes WHERE email = ?";

    db.query(checkSql, [email], async (err, results) => {
      if (err) {
        console.error("Error verificando email:", err);
        return res.status(500).json({
          error: "Error verificando usuario"
        });
      }

      if (results.length > 0) {
        return res.status(400).json({
          error: "El email ya está registrado"
        });
      }

      try {
        // 🔐 Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const insertSql = `
          INSERT INTO clientes (nombre, email, password, creado)
          VALUES (?, ?, ?, NOW())
        `;

        db.query(insertSql, [nombre, email, hashedPassword], (err, result) => {
          if (err) {
            console.error("Error registrando cliente:", err);
            return res.status(500).json({
              error: "Error registrando cliente"
            });
          }

          return res.status(201).json({
            message: "Cliente registrado correctamente 🔥",
            id: result.insertId
          });
        });

      } catch (hashError) {
        console.error("Error en hash:", hashError);
        return res.status(500).json({
          error: "Error encriptando password"
        });
      }
    });

  } catch (error) {
    console.error("Error en registro:", error);
    return res.status(500).json({
      error: "Error interno en registro"
    });
  }
});


// =======================
// LOGIN
// =======================
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Se requiere email y password"
      });
    }

    const sql = "SELECT * FROM clientes WHERE email = ?";

    db.query(sql, [email], async (err, results) => {
      if (err) {
        console.error("Error en login:", err);
        return res.status(500).json({
          error: "Error en login"
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          error: "Credenciales inválidas"
        });
      }

      const cliente = results[0];

      try {
        // 🔐 Comparar password
        const passwordValida = await bcrypt.compare(password, cliente.password);

        if (!passwordValida) {
          return res.status(401).json({
            error: "Credenciales inválidas"
          });
        }

        // 🔑 Generar token
        const token = jwt.sign(
          {
            id: cliente.id,
            nombre: cliente.nombre,
            email: cliente.email
          },
          SECRET_KEY,
          { expiresIn: "7d" }
        );

        return res.json({
          message: "Login exitoso 🚀",
          token,
          cliente: {
            id: cliente.id,
            nombre: cliente.nombre,
            email: cliente.email
          }
        });

      } catch (compareError) {
        console.error("Error comparando password:", compareError);
        return res.status(500).json({
          error: "Error validando credenciales"
        });
      }
    });

  } catch (error) {
    console.error("Error general login:", error);
    return res.status(500).json({
      error: "Error interno en login"
    });
  }
});


// =======================
// PERFIL (PROTEGIDO)
// =======================
router.get("/perfil", verificarToken, (req, res) => {
  return res.json({
    message: "Perfil obtenido correctamente",
    usuario: req.usuario
  });
});


module.exports = router;