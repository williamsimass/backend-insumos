from flask import Blueprint, request, jsonify
from src.models.insumo import db, Insumo, Solicitante
from datetime import datetime, date
from sqlalchemy import func, extract

insumo_bp = Blueprint('insumo', __name__)

@insumo_bp.route('/insumos', methods=['GET'])
def get_insumos():
    """Obter todos os insumos com filtros opcionais"""
    try:
        # Parâmetros de filtro
        centro_custo = request.args.get('centroCusto')
        status = request.args.get('status')
        solicitante = request.args.get('solicitante')
        data_inicio = request.args.get('dataInicio')
        data_fim = request.args.get('dataFim')
        
        query = Insumo.query
        
        # Aplicar filtros
        if centro_custo:
            query = query.filter(Insumo.centro_custo == centro_custo)
        if status:
            query = query.filter(Insumo.status == status)
        if solicitante:
            query = query.filter(Insumo.solicitante == solicitante)
        if data_inicio:
            query = query.filter(Insumo.data_solicitacao >= datetime.fromisoformat(data_inicio).date())
        if data_fim:
            query = query.filter(Insumo.data_solicitacao <= datetime.fromisoformat(data_fim).date())
        
        insumos = query.order_by(Insumo.data_solicitacao.desc()).all()
        return jsonify([insumo.to_dict() for insumo in insumos])
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@insumo_bp.route('/insumos', methods=['POST'])
def create_insumo():
    """Criar novo insumo"""
    try:
        data = request.get_json()
        
        if not data.get('solicitante') or not data.get('centroCusto') or not data.get('dataSolicitacao'):
            return jsonify({'error': 'Campos obrigatórios: solicitante, centroCusto, dataSolicitacao'}), 400
        
        insumo = Insumo.from_dict(data)
        db.session.add(insumo)
        
        # Adicionar solicitante à lista se não existir
        solicitante_nome = data.get('solicitante')
        if solicitante_nome:
            existing_solicitante = Solicitante.query.filter_by(nome=solicitante_nome).first()
            if not existing_solicitante:
                novo_solicitante = Solicitante(nome=solicitante_nome)
                db.session.add(novo_solicitante)
        
        db.session.commit()
        return jsonify(insumo.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@insumo_bp.route('/insumos/<int:insumo_id>', methods=['PUT'])
def update_insumo(insumo_id):
    """Atualizar insumo existente"""
    try:
        insumo = Insumo.query.get_or_404(insumo_id)
        data = request.get_json()
        
        # Atualizar campos
        if data.get('dataSolicitacao'):
            insumo.data_solicitacao = datetime.fromisoformat(data['dataSolicitacao']).date()
        if data.get('dataAprovacao'):
            insumo.data_aprovacao = datetime.fromisoformat(data['dataAprovacao']).date()
        if 'aprovadoPor' in data:
            insumo.aprovado_por = data['aprovadoPor']
        if 'solicitante' in data:
            insumo.solicitante = data['solicitante']
        if 'centroCusto' in data:
            insumo.centro_custo = data['centroCusto']
        if 'equipamento' in data:
            insumo.equipamento = data['equipamento']
        if 'status' in data:
            insumo.status = data['status']
        if 'numeroChamado' in data:
            insumo.numero_chamado = data['numeroChamado']
        if 'equipamentoQuantidade' in data:
            insumo.equipamento_quantidade = data['equipamentoQuantidade']
        if 'valor' in data:
            insumo.valor = float(data['valor'])
        
        insumo.data_updated = datetime.utcnow()
        
        db.session.commit()
        return jsonify(insumo.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@insumo_bp.route('/insumos/<int:insumo_id>', methods=['DELETE'])
def delete_insumo(insumo_id):
    """Deletar insumo"""
    try:
        insumo = Insumo.query.get_or_404(insumo_id)
        db.session.delete(insumo)
        db.session.commit()
        return jsonify({'message': 'Insumo deletado com sucesso'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@insumo_bp.route('/solicitantes', methods=['GET'])
def get_solicitantes():
    """Obter lista de solicitantes"""
    try:
        solicitantes = Solicitante.query.order_by(Solicitante.nome).all()
        return jsonify([s.nome for s in solicitantes])
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@insumo_bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Obter estatísticas para o dashboard"""
    try:
        # Parâmetros de filtro
        data_inicio = request.args.get('dataInicio')
        data_fim = request.args.get('dataFim')
        
        query = Insumo.query
        
        # Aplicar filtros de data
        if data_inicio:
            query = query.filter(Insumo.data_solicitacao >= datetime.fromisoformat(data_inicio).date())
        if data_fim:
            query = query.filter(Insumo.data_solicitacao <= datetime.fromisoformat(data_fim).date())
        
        insumos = query.all()
        
        # Calcular estatísticas
        total_insumos = len(insumos)
        total_valor = sum(insumo.valor for insumo in insumos)
        total_quantidade = sum(insumo.equipamento_quantidade for insumo in insumos)
        
        # Gastos por centro de custo
        gastos_por_centro = {}
        quantidade_por_centro = {}
        for insumo in insumos:
            centro = insumo.centro_custo or 'Não informado'
            gastos_por_centro[centro] = gastos_por_centro.get(centro, 0) + insumo.valor
            quantidade_por_centro[centro] = quantidade_por_centro.get(centro, 0) + insumo.equipamento_quantidade
        
        # Gastos por status
        gastos_por_status = {}
        quantidade_por_status = {}
        for insumo in insumos:
            status = insumo.status or 'Sem status'
            gastos_por_status[status] = gastos_por_status.get(status, 0) + insumo.valor
            quantidade_por_status[status] = quantidade_por_status.get(status, 0) + insumo.equipamento_quantidade
        
        # Gastos por mês (últimos 12 meses)
        gastos_por_mes = {}
        quantidade_por_mes = {}
        
        # Obter dados agrupados por mês
        monthly_data = db.session.query(
            extract('year', Insumo.data_solicitacao).label('ano'),
            extract('month', Insumo.data_solicitacao).label('mes'),
            func.sum(Insumo.valor).label('total_valor'),
            func.sum(Insumo.equipamento_quantidade).label('total_quantidade')
        ).group_by(
            extract('year', Insumo.data_solicitacao),
            extract('month', Insumo.data_solicitacao)
        ).all()
        
        for row in monthly_data:
            mes_key = f"{int(row.mes):02d}/{int(row.ano)}"
            gastos_por_mes[mes_key] = float(row.total_valor or 0)
            quantidade_por_mes[mes_key] = int(row.total_quantidade or 0)
        
        return jsonify({
            'totalInsumos': total_insumos,
            'totalValor': total_valor,
            'totalQuantidade': total_quantidade,
            'gastosPorCentro': gastos_por_centro,
            'quantidadePorCentro': quantidade_por_centro,
            'gastosPorStatus': gastos_por_status,
            'quantidadePorStatus': quantidade_por_status,
            'gastosPorMes': gastos_por_mes,
            'quantidadePorMes': quantidade_por_mes
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@insumo_bp.route('/export', methods=['GET'])
def export_data():
    """Exportar todos os dados"""
    try:
        insumos = Insumo.query.all()
        solicitantes = Solicitante.query.all()
        
        export_data = {
            'insumos': [insumo.to_dict() for insumo in insumos],
            'solicitantes': [s.nome for s in solicitantes],
            'exportDate': datetime.utcnow().isoformat(),
            'version': '2.0'
        }
        
        return jsonify(export_data)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@insumo_bp.route('/import', methods=['POST'])
def import_data():
    """Importar dados"""
    try:
        data = request.get_json()
        
        if not data or 'insumos' not in data:
            return jsonify({'error': 'Dados inválidos'}), 400
        
        # Importar insumos
        for insumo_data in data['insumos']:
            # Verificar se já existe (por ID ou criar novo)
            if 'id' in insumo_data:
                existing = Insumo.query.get(insumo_data['id'])
                if existing:
                    continue  # Pular se já existe
            
            insumo = Insumo.from_dict(insumo_data)
            db.session.add(insumo)
        
        # Importar solicitantes
        if 'solicitantes' in data:
            for nome in data['solicitantes']:
                existing = Solicitante.query.filter_by(nome=nome).first()
                if not existing:
                    solicitante = Solicitante(nome=nome)
                    db.session.add(solicitante)
        
        db.session.commit()
        return jsonify({'message': 'Dados importados com sucesso'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

