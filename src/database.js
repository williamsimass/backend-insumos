require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Cria as tabelas se não existirem
(async () => {
  try {
    // Tabela de insumos
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

    // Tabela de fornecedores
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fornecedores (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        descricao TEXT,
        links TEXT[],
        dataCriacao TEXT,
        ativo BOOLEAN DEFAULT true
      );
    `);
    console.log("Tabela 'fornecedores' criada/verificada com sucesso.");
  } catch (err) {
    console.error("Erro ao criar/verificar tabelas:", err);
    process.exit(1);
  }
})();

module.exports = pool;
