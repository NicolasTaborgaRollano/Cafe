const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST || "mainline.proxy.rlwy.net",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "GbkpNUwkfIgdmhDhYIaFGteoHkkBealy",
  database: process.env.DB_NAME || "railway",
  port: process.env.DB_PORT || 25325,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// manejar errores globales
db.on("error", (err) => {
  console.error("❌ Error en DB:", err);
});

module.exports = db;