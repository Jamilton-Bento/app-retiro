const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// Servir arquivos estáticos da pasta frontend
app.use(express.static(path.join(__dirname, "frontend")));

// Conectar ao banco de dados SQLite
const db = new sqlite3.Database("./database.db", (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err.message);
    } else {
        console.log("Conectado ao banco de dados SQLite.");
    }
});

// Criar tabelas se não existirem
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS cadastros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            sobrenome TEXT,
            whatsapp TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS acompanhantes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            cadastro_id INTEGER,
            FOREIGN KEY(cadastro_id) REFERENCES cadastros(id)
        )
    `);
});

// Rota para cadastrar uma nova pessoa
app.post("/cadastrar", (req, res) => {
    const { nome, sobrenome, whatsapp, acompanhantes } = req.body;

    if (!nome || !sobrenome || !whatsapp) {
        return res.status(400).json({ error: "Preencha todos os campos obrigatórios!" });
    }

    db.run(
        "INSERT INTO cadastros (nome, sobrenome, whatsapp) VALUES (?, ?, ?)",
        [nome, sobrenome, whatsapp],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const cadastroId = this.lastID;

            // Adicionar acompanhantes
            if (acompanhantes && acompanhantes.length > 0) {
                const stmt = db.prepare("INSERT INTO acompanhantes (nome, cadastro_id) VALUES (?, ?)");
                acompanhantes.forEach(acompanhante => {
                    stmt.run(acompanhante, cadastroId);
                });
                stmt.finalize();
            }

            res.json({ message: "Cadastro realizado com sucesso!" });
        }
    );
});

// Rota para listar os cadastros com os acompanhantes
app.get("/cadastros", (req, res) => {
    db.all(
        `SELECT cadastros.id, cadastros.nome, cadastros.sobrenome, cadastros.whatsapp, 
         GROUP_CONCAT(acompanhantes.nome) AS acompanhantes
         FROM cadastros
         LEFT JOIN acompanhantes ON cadastros.id = acompanhantes.cadastro_id
         GROUP BY cadastros.id`,
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
