require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./database");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rota para obter todos os insumos
app.get("/insumos", (req, res) => {
  db.all("SELECT * FROM insumos", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Rota para adicionar um novo insumo
app.post("/insumos", (req, res) => {
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
  
  const id = uuidv4();

  if (!solicitante || !centroCusto) {
    return res.status(400).json({ error: "Solicitante e Centro de Custo são obrigatórios." });
  }

  const stmt = db.prepare(
    "INSERT INTO insumos (id, dataSolicitacao, dataAprovacao, aprovadoPor, solicitante, centroCusto, equipamento, status, numeroChamado, equipamentoQuantidade, valor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  
  stmt.run(
    id,
    dataSolicitacao,
    dataAprovacao,
    aprovadoPor,
    solicitante,
    centroCusto,
    equipamento,
    status,
    numeroChamado,
    equipamentoQuantidade,
    valor,
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id: id, message: "Insumo adicionado com sucesso!" });
    }
  );
  
  stmt.finalize();
});

// Rota para atualizar um insumo existente
app.put("/insumos/:id", (req, res) => {
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

  if (!solicitante || !centroCusto) {
    return res.status(400).json({ error: "Solicitante e Centro de Custo são obrigatórios." });
  }

  const stmt = db.prepare(
    "UPDATE insumos SET dataSolicitacao = ?, dataAprovacao = ?, aprovadoPor = ?, solicitante = ?, centroCusto = ?, equipamento = ?, status = ?, numeroChamado = ?, equipamentoQuantidade = ?, valor = ? WHERE id = ?"
  );
  
  stmt.run(
    dataSolicitacao,
    dataAprovacao,
    aprovadoPor,
    solicitante,
    centroCusto,
    equipamento,
    status,
    numeroChamado,
    equipamentoQuantidade,
    valor,
    id,
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ message: "Insumo não encontrado." });
      } else {
        res.json({ message: "Insumo atualizado com sucesso!" });
      }
    }
  );
  
  stmt.finalize();
});

// Rota para deletar um insumo
app.delete("/insumos/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM insumos WHERE id = ?", id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ message: "Insumo não encontrado." });
    } else {
      res.json({ message: "Insumo deletado com sucesso!" });
    }
  });
});

// Rota leve para monitoramento do UptimeRobot
app.get("/ping", (req, res) => {
  res.send("pong");
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
