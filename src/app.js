require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./database");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Helpers para mapear camelCase <-> snake_case ---
const toSnakeCase = (obj) => ({
  data_solicitacao: obj.dataSolicitacao,
  data_aprovacao: obj.dataAprovacao,
  aprovado_por: obj.aprovadoPor,
  solicitante: obj.solicitante,
  centro_custo: obj.centroCusto,
  equipamento: obj.equipamento,
  status: obj.status,
  numero_chamado: obj.numeroChamado,
  equipamento_quantidade: obj.equipamentoQuantidade,
  valor: obj.valor
});

const toCamelCase = (obj) => ({
  id: obj.id,
  dataSolicitacao: obj.data_solicitacao,
  dataAprovacao: obj.data_aprovacao,
  aprovadoPor: obj.aprovado_por,
  solicitante: obj.solicitante,
  centroCusto: obj.centro_custo,
  equipamento: obj.equipamento,
  status: obj.status,
  numeroChamado: obj.numero_chamado,
  equipamentoQuantidade: obj.equipamento_quantidade,
  valor: obj.valor
});

// GET /insumos
app.get("/insumos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM insumos ORDER BY data_solicitacao ASC");
    res.json(result.rows.map(toCamelCase));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /insumos
app.post("/insumos", async (req, res) => {
  const insumo = req.body;

  if (!insumo.solicitante || !insumo.centroCusto) {
    return res.status(400).json({ error: "Solicitante e Centro de Custo são obrigatórios." });
  }

  const id = uuidv4();
  const data = toSnakeCase(insumo);

  try {
    await pool.query(
      `INSERT INTO insumos 
       (id, data_solicitacao, data_aprovacao, aprovado_por, solicitante, centro_custo, equipamento, status, numero_chamado, equipamento_quantidade, valor)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, data.data_solicitacao, data.data_aprovacao, data.aprovado_por, data.solicitante, data.centro_custo, data.equipamento, data.status, data.numero_chamado, data.equipamento_quantidade, data.valor]
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
      const data = toSnakeCase(insumo);

      await pool.query(
        `INSERT INTO insumos
         (id, data_solicitacao, data_aprovacao, aprovado_por, solicitante, centro_custo, equipamento, status, numero_chamado, equipamento_quantidade, valor)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO NOTHING`,
        [id, data.data_solicitacao, data.data_aprovacao, data.aprovado_por, data.solicitante, data.centro_custo, data.equipamento, data.status, data.numero_chamado, data.equipamento_quantidade, data.valor]
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
  const data = toSnakeCase(req.body);

  try {
    const result = await pool.query(
      `UPDATE insumos
       SET data_solicitacao=$1, data_aprovacao=$2, aprovado_por=$3, solicitante=$4, centro_custo=$5, equipamento=$6, status=$7, numero_chamado=$8, equipamento_quantidade=$9, valor=$10
       WHERE id=$11`,
      [data.data_solicitacao, data.data_aprovacao, data.aprovado_por, data.solicitante, data.centro_custo, data.equipamento, data.status, data.numero_chamado, data.equipamento_quantidade, data.valor, id]
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
