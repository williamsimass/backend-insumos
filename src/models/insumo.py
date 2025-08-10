from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Insumo(db.Model):
    __tablename__ = 'insumos'
    
    id = db.Column(db.Integer, primary_key=True)
    data_solicitacao = db.Column(db.Date, nullable=False)
    data_aprovacao = db.Column(db.Date)
    aprovado_por = db.Column(db.String(100))
    solicitante = db.Column(db.String(100), nullable=False)
    centro_custo = db.Column(db.String(100), nullable=False)
    equipamento = db.Column(db.String(200))
    status = db.Column(db.String(50))
    numero_chamado = db.Column(db.String(50))
    equipamento_quantidade = db.Column(db.Integer, default=1)
    valor = db.Column(db.Float, default=0.0)
    data_created = db.Column(db.DateTime, default=datetime.utcnow)
    data_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'dataSolicitacao': self.data_solicitacao.isoformat() if self.data_solicitacao else None,
            'dataAprovacao': self.data_aprovacao.isoformat() if self.data_aprovacao else None,
            'aprovadoPor': self.aprovado_por,
            'solicitante': self.solicitante,
            'centroCusto': self.centro_custo,
            'equipamento': self.equipamento,
            'status': self.status,
            'numeroChamado': self.numero_chamado,
            'equipamentoQuantidade': self.equipamento_quantidade,
            'valor': self.valor,
            'dataCreated': self.data_created.isoformat() if self.data_created else None,
            'dataUpdated': self.data_updated.isoformat() if self.data_updated else None
        }
    
    @staticmethod
    def from_dict(data):
        insumo = Insumo()
        
        # Converter datas de string para date
        if data.get('dataSolicitacao'):
            insumo.data_solicitacao = datetime.fromisoformat(data['dataSolicitacao']).date()
        if data.get('dataAprovacao'):
            insumo.data_aprovacao = datetime.fromisoformat(data['dataAprovacao']).date()
            
        insumo.aprovado_por = data.get('aprovadoPor')
        insumo.solicitante = data.get('solicitante')
        insumo.centro_custo = data.get('centroCusto')
        insumo.equipamento = data.get('equipamento')
        insumo.status = data.get('status')
        insumo.numero_chamado = data.get('numeroChamado')
        insumo.equipamento_quantidade = data.get('equipamentoQuantidade', 1)
        insumo.valor = float(data.get('valor', 0))
        
        return insumo

class Solicitante(db.Model):
    __tablename__ = 'solicitantes'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), unique=True, nullable=False)
    data_created = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'dataCreated': self.data_created.isoformat() if self.data_created else None
        }

