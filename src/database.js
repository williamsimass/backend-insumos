// database.js
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Em produção (Render), geralmente precisa de SSL:
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Cria a tabela se não existir
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS insumos (
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
      );
    `);
    console.log("Tabela 'insumos' criada/verificada com sucesso.");
  } catch (err) {
    console.error("Erro ao criar/verificar tabela:", err);
    process.exit(1);
  }
})();

module.exports = pool;
