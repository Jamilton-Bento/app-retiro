const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./backend/database.db");

db.run(`CREATE TABLE IF NOT EXISTS cadastros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    sobrenome TEXT,
    whatsapp TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS acompanhantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cadastro_id INTEGER,
    nome TEXT,
    FOREIGN KEY (cadastro_id) REFERENCES cadastros(id)
)`);

module.exports = db;
