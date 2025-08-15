require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./database");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// GET /insumos
app.get("/insumos", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        dataSolicitacao AS "dataSolicitacao",
        dataAprovacao AS "dataAprovacao", 
        aprovadoPor AS "aprovadoPor",
        solicitante,
        centroCusto AS "centroCusto",
        equipamento,
        status,
        numeroChamado AS "numeroChamado",
        equipamentoQuantidade AS "equipamentoQuantidade",
        valor
      FROM insumos 
      ORDER BY dataSolicitacao ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /insumos
app.post("/insumos", async (req, res) => {
  const {
    dataSolicitacao,
    dataAprovacao,
    aprovadoPor,
    solicitante,
    centroCusto,
    equipamento,
    status,
    numeroChamado,
    equipamentoQuantidade,
    valor
  } = req.body;

  if (!solicitante || !centroCusto) {
    return res.status(400).json({ error: "Solicitante e Centro de Custo são obrigatórios." });
  }

  const id = uuidv4();
  try {
    await pool.query(
      `INSERT INTO insumos 
       (id, dataSolicitacao, dataAprovacao, aprovadoPor, solicitante, centroCusto, equipamento, status, numeroChamado, equipamentoQuantidade, valor)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, dataSolicitacao, dataAprovacao, aprovadoPor, solicitante, centroCusto, equipamento, status, numeroChamado, equipamentoQuantidade, valor]
    );
    res.status(201).json({ id, message: "Insumo adicionado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /insumos/import
app.post("/insumos/import", async (req, res) => {
  const insumosToImport = req.body;
  if (!Array.isArray(insumosToImport)) {
    return res.status(400).json({ error: "O corpo da requisição deve ser um array de insumos." });
  }

  try {
    for (const insumo of insumosToImport) {
      const id = insumo.id || uuidv4();
      await pool.query(
        `INSERT INTO insumos
         (id, dataSolicitacao, dataAprovacao, aprovadoPor, solicitante, centroCusto, equipamento, status, numeroChamado, equipamentoQuantidade, valor)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET dataSolicitacao=EXCLUDED.dataSolicitacao, dataAprovacao=EXCLUDED.dataAprovacao, aprovadoPor=EXCLUDED.aprovadoPor, solicitante=EXCLUDED.solicitante, centroCusto=EXCLUDED.centroCusto, equipamento=EXCLUDED.equipamento, status=EXCLUDED.status, numeroChamado=EXCLUDED.numeroChamado, equipamentoQuantidade=EXCLUDED.equipamentoQuantidade, valor=EXCLUDED.valor`,
        [id, insumo.dataSolicitacao, insumo.dataAprovacao, insumo.aprovadoPor, insumo.solicitante, insumo.centroCusto, insumo.equipamento, insumo.status, insumo.numeroChamado, insumo.equipamentoQuantidade, insumo.valor]
      );
    }
    res.status(200).json({ message: "Importação concluída com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /insumos/:id
app.put("/insumos/:id", async (req, res) => {
  const { id } = req.params;
  const {
    dataSolicitacao,
    dataAprovacao,
    aprovadoPor,
    solicitante,
    centroCusto,
    equipamento,
    status,
    numeroChamado,
    equipamentoQuantidade,
    valor
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE insumos
       SET dataSolicitacao=$1, dataAprovacao=$2, aprovadoPor=$3, solicitante=$4, centroCusto=$5, equipamento=$6, status=$7, numeroChamado=$8, equipamentoQuantidade=$9, valor=$10
       WHERE id=$11`,
      [dataSolicitacao, dataAprovacao, aprovadoPor, solicitante, centroCusto, equipamento, status, numeroChamado, equipamentoQuantidade, valor, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "Insumo não encontrado." });
    res.json({ message: "Insumo atualizado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /insumos/:id
app.delete("/insumos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM insumos WHERE id=$1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Insumo não encontrado." });
    res.json({ message: "Insumo deletado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /insumos/clear-all
app.delete("/insumos/clear-all", async (req, res) => {
  try {
    await pool.query("DELETE FROM insumos");
    await pool.query("DELETE FROM fornecedores");
    res.json({ message: "Todos os dados foram removidos com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINTS FORNECEDORES ====================

// GET /fornecedores
app.get("/fornecedores", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        nome,
        descricao,
        links,
        dataCriacao AS "dataCriacao",
        ativo
      FROM fornecedores 
      WHERE ativo = true
      ORDER BY nome ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /fornecedores
app.post("/fornecedores", async (req, res) => {
  const { nome, descricao, links } = req.body;

  if (!nome) {
    return res.status(400).json({ error: "Nome do fornecedor é obrigatório." });
  }

  const id = uuidv4();
  const dataCriacao = new Date().toISOString().split('T')[0];
  
  try {
    await pool.query(
      `INSERT INTO fornecedores 
       (id, nome, descricao, links, dataCriacao, ativo)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, nome, descricao, links || [], dataCriacao, true]
    );
    res.status(201).json({ id, message: "Fornecedor adicionado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /fornecedores/:id
app.put("/fornecedores/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, links, ativo } = req.body;

  try {
    const result = await pool.query(
      `UPDATE fornecedores
       SET nome=$1, descricao=$2, links=$3, ativo=$4
       WHERE id=$5`,
      [nome, descricao, links || [], ativo !== undefined ? ativo : true, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "Fornecedor não encontrado." });
    res.json({ message: "Fornecedor atualizado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /fornecedores/:id (soft delete)
app.delete("/fornecedores/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE fornecedores SET ativo = false WHERE id=$1", 
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "Fornecedor não encontrado." });
    res.json({ message: "Fornecedor removido com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
