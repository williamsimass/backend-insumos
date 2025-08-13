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
    const result = await pool.query("SELECT * FROM insumos ORDER BY dataSolicitacao ASC");
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
         ON CONFLICT (id) DO NOTHING`,
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

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
