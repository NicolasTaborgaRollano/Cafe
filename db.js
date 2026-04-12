const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "mainline.proxy.rlwy.net",
  user: "root",
  password: "GbkpNUwkfIgdmhDhYIaFGteoHkkBealy",
  database: "railway",
  port: 25325
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error conectando a DB:", err);
  } else {
    console.log("🔥 Conectado a Railway MySQL");
  }D
});

module.exports = db;