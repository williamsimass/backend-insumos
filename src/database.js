require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Cria a tabela se não existir
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS insumos (
        id TEXT PRIMARY KEY,
        data_solicitacao TEXT,
        data_aprovacao TEXT,
        aprovado_por TEXT,
        solicitante TEXT NOT NULL,
        centro_custo TEXT NOT NULL,
        equipamento TEXT,
        status TEXT,
        numero_chamado TEXT,
        equipamento_quantidade TEXT,
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
