const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_PATH = path.resolve(__dirname, "../database.sqlite");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Erro ao abrir o banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco de dados SQLite.");
    db.run(
      `CREATE TABLE IF NOT EXISTS insumos (
        id TEXT PRIMARY KEY,
        dataSolicitacao TEXT,
        dataAprovacao TEXT,
        aprovadoPor TEXT,
        solicitante TEXT NOT NULL,
        centroCusto TEXT NOT NULL,
        equipamento TEXT,
        status TEXT,
        numeroChamado TEXT,
        equipamentoQuantidade TEXT,
        valor REAL
      )`,
      (err) => {
        if (err) {
          console.error("Erro ao criar a tabela insumos:", err.message);
        } else {
          console.log("Tabela 'insumos' criada ou já existe.");
        }
      }
    );
  }
});

module.exports = db;

