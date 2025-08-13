require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./database");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// GET /insumos - lista (ordenado pela data_solicitacao crescente)
app.get("/insumos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM insumos ORDER BY data_solicitacao ASC");
    const insumos = result.rows.map(row => ({
      id: row.id,
      dataSolicitacao: row.data_solicitacao,
      dataAprovacao: row.data_aprovacao,
      aprovadoPor: row.aprovado_por,
      solicitante: row.solicitante,
      centroCusto: row.centro_custo,
      equipamento: row.equipamento,
      status: row.status,
      numeroChamado: row.numero_chamado,
      equipamentoQuantidade: row.equipamento_quantidade,
      valor: row.valor
    }));
    res.json(insumos);
  } catch (err) {
    console.error("Erro ao buscar insumos:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /insumos - cria 1 insumo
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
       (id, data_solicitacao, data_aprovacao, aprovado_por, solicitante, centro_custo, equipamento, status, numero_chamado, equipamento_quantidade, valor)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, dataSolicitacao, dataAprovacao, aprovadoPor, solicitante, centroCusto, equipamento, status, numeroChamado, equipamentoQuantidade, valor]
    );
    res.status(201).json({ id, message: "Insumo adicionado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /insumos/import - importa array de insumos
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
         (id, data_solicitacao, data_aprovacao, aprovado_por, solicitante, centro_custo, equipamento, status, numero_chamado, equipamento_quantidade, valor)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO NOTHING`,
        [
          id,
          insumo.dataSolicitacao,
          insumo.dataAprovacao,
          insumo.aprovadoPor,
          insumo.solicitante,
          insumo.centroCusto,
          insumo.equipamento,
          insumo.status,
          insumo.numeroChamado,
          insumo.equipamentoQuantidade,
          insumo.valor
        ]
      );
    }
    res.status(200).json({ message: "Importação concluída com sucesso!" });
  } catch (err) {
    console.error("Erro ao importar insumos:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /insumos/:id - atualiza
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
       SET data_solicitacao=$1, data_aprovacao=$2, aprovado_por=$3, solicitante=$4, centro_custo=$5, equipamento=$6, status=$7, numero_chamado=$8, equipamento_quantidade=$9, valor=$10
       WHERE id=$11`,
      [dataSolicitacao, dataAprovacao, aprovadoPor, solicitante, centroCusto, equipamento, status, numeroChamado, equipamentoQuantidade, valor, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "Insumo não encontrado." });
    res.json({ message: "Insumo atualizado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /insumos/:id - remove insumo específico
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

// DELETE /insumos - remove todos os insumos
app.delete("/insumos", async (req, res) => {
  try {
    await pool.query("DELETE FROM insumos");
    res.json({ message: "Todos os insumos foram deletados com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
