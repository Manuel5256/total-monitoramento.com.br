// ============ CONFIGURAÇÃO FIREBASE ============
const firebaseConfig = {
    apiKey: "AIzaSyDfu8UsXj5QqBoy8ZbITIE4vMnhfXcbHNw",
    authDomain: "sistema-de-o-s.firebaseapp.com",
    databaseURL: "https://sistema-de-o-s-default-rtdb.firebaseio.com",
    projectId: "sistema-de-o-s",
    storageBucket: "sistema-de-o-s.firebasestorage.app",
    messagingSenderId: "139714103845",
    appId: "1:139714103845:web:9457a93e15bab926828dcc"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
console.log('🔥 Firebase conectado - sistema-de-o-s!');

// ============ NOTIFICAÇÕES ============
function mostrarNotificacao(titulo, mensagem, tipo = 'info') {
    if (!document.getElementById('notificacoesContainer')) {
        const container = document.createElement('div');
        container.id = 'notificacoesContainer';
        container.className = 'notificacoes-container';
        document.body.appendChild(container);
    }
    const container = document.getElementById('notificacoesContainer');
    const div = document.createElement('div');
    div.className = `notificacao ${tipo}`;
    const icones = { sucesso: '✅', erro: '❌', alerta: '⚠️', info: 'ℹ️' };
    div.innerHTML = `<div class="notificacao-titulo">${icones[tipo]} ${titulo}</div><div class="notificacao-mensagem">${mensagem}</div>`;
    container.appendChild(div);
    setTimeout(() => div.remove(), 5000);
}

// ============ FUNÇÕES AUXILIARES ============
function gerarProtocolo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatarData(data) {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR');
}

// ============ BANCO DE DADOS FIREBASE ============
function salvarNoFirebase(caminho, dados) {
    const key = database.ref().child(caminho).push().key;
    return database.ref(caminho + '/' + key).set({ ...dados, id: key });
}

function ouvirFirebase(caminho, callback) {
    database.ref(caminho).on('value', (snapshot) => {
        const data = snapshot.val();
        const lista = [];
        if (data) Object.keys(data).forEach(k => lista.push(data[k]));
        callback(lista);
    });
}

function atualizarFirebase(caminho, id, dados) {
    return database.ref(caminho + '/' + id).update(dados);
}

// ============ CLIENTE ============
function cadastrarCliente(event) {
    event.preventDefault();
    const usuario = document.getElementById('usuarioCliente').value;
    const senha = document.getElementById('senhaCliente').value;
    
    database.ref('clientes').once('value', (snapshot) => {
        const data = snapshot.val();
        const existe = data && Object.values(data).some(c => c.usuario === usuario);
        if (existe) {
            mostrarNotificacao('Erro', 'Usuário já cadastrado!', 'erro');
            return;
        }
        salvarNoFirebase('clientes', { usuario, senha, tipo: 'cliente' });
        mostrarNotificacao('Sucesso', 'Cadastro realizado!', 'sucesso');
        setTimeout(() => window.location.href = 'login-cliente.html', 1500);
    });
}

function loginCliente(event) {
    event.preventDefault();
    const usuario = document.getElementById('usuarioCliente').value;
    const senha = document.getElementById('senhaCliente').value;
    
    database.ref('clientes').once('value', (snapshot) => {
        const data = snapshot.val();
        const cliente = data && Object.values(data).find(c => c.usuario === usuario && c.senha === senha);
        if (cliente) {
            sessionStorage.setItem('clienteLogado', JSON.stringify(cliente));
            window.location.href = 'cliente.html';
        } else {
            mostrarNotificacao('Erro', 'Usuário ou senha incorretos!', 'erro');
        }
    });
}

// ============ OPERADOR ============
function cadastrarOperador(event) {
    event.preventDefault();
    const operador = {
        nome: document.getElementById('nomeOperador').value,
        senha: document.getElementById('senhaOperador').value,
        funcao: document.getElementById('funcaoOperador').value,
        turno: document.getElementById('turnoOperador').value,
        tipo: 'operador'
    };
    
    database.ref('operadores').once('value', (snapshot) => {
        const data = snapshot.val();
        const existe = data && Object.values(data).some(o => o.nome === operador.nome);
        if (existe) {
            mostrarNotificacao('Erro', 'Nome já cadastrado!', 'erro');
            return;
        }
        salvarNoFirebase('operadores', operador);
        mostrarNotificacao('Sucesso', 'Cadastro realizado!', 'sucesso');
        setTimeout(() => window.location.href = 'login-operador.html', 1500);
    });
}

function loginOperador(event) {
    event.preventDefault();
    const nome = document.getElementById('nomeOperador').value;
    const senha = document.getElementById('senhaOperador').value;
    
    database.ref('operadores').once('value', (snapshot) => {
        const data = snapshot.val();
        const operador = data && Object.values(data).find(o => o.nome === nome && o.senha === senha);
        if (operador) {
            sessionStorage.setItem('operadorLogado', JSON.stringify(operador));
            window.location.href = 'operador.html';
        } else {
            mostrarNotificacao('Erro', 'Nome ou senha incorretos!', 'erro');
        }
    });
}

// ============ TÉCNICO ============
function solicitarCadastroTecnico(event) {
    event.preventDefault();
    const tecnico = {
        nome: document.getElementById('nomeTecnico').value,
        senha: document.getElementById('senhaTecnico').value,
        funcao: document.getElementById('funcaoTecnico').value,
        tipo: 'tecnico',
        status: 'pendente'
    };
    
    database.ref('solicitacoes').set(tecnico);
    localStorage.setItem('solicitacaoTecnico', JSON.stringify(tecnico));
    localStorage.setItem('timerSolicitacao', Date.now().toString());
    
    window.location.href = 'aguardando-aprovacao.html';
}

function verificarAprovacao() {
    const aprovado = localStorage.getItem('tecnicoAprovado');
    const rejeitado = localStorage.getItem('tecnicoRejeitado');
    const timer = parseInt(localStorage.getItem('timerSolicitacao'));
    
    if (Date.now() - timer > 60000 && !aprovado && !rejeitado) {
        localStorage.setItem('tecnicoRejeitado', 'timeout');
        window.location.href = 'cadastro-rejeitado.html';
        return;
    }
    
    if (aprovado === 'sim') {
        const tecnico = JSON.parse(localStorage.getItem('solicitacaoTecnico'));
        tecnico.status = 'aprovado';
        salvarNoFirebase('tecnicos', tecnico);
        database.ref('solicitacoes').remove();
        localStorage.removeItem('solicitacaoTecnico');
        localStorage.removeItem('timerSolicitacao');
        localStorage.removeItem('tecnicoAprovado');
        mostrarNotificacao('Aprovado!', 'Cadastro concluído!', 'sucesso');
        setTimeout(() => window.location.href = 'login-tecnico.html', 1500);
    } else if (rejeitado) {
        window.location.href = 'cadastro-rejeitado.html';
    } else {
        setTimeout(verificarAprovacao, 1000);
    }
}

function loginTecnico(event) {
    event.preventDefault();
    const nome = document.getElementById('nomeTecnico').value;
    const senha = document.getElementById('senhaTecnico').value;
    
    database.ref('tecnicos').once('value', (snapshot) => {
        const data = snapshot.val();
        const tecnico = data && Object.values(data).find(t => t.nome === nome && t.senha === senha && t.status === 'aprovado');
        if (tecnico) {
            sessionStorage.setItem('tecnicoLogado', JSON.stringify(tecnico));
            window.location.href = 'tecnico.html';
        } else {
            mostrarNotificacao('Erro', 'Acesso negado!', 'erro');
        }
    });
}

// ============ GESTOR ============
function cadastrarGestor(event) {
    event.preventDefault();
    const gestor = {
        nome: document.getElementById('nomeGestor').value,
        senha: document.getElementById('senhaGestor').value,
        cargo: document.getElementById('cargoGestor').value,
        tipo: 'gestor'
    };
    
    database.ref('gestores').once('value', (snapshot) => {
        const data = snapshot.val();
        const existe = data && Object.values(data).some(g => g.nome === gestor.nome);
        if (existe) {
            mostrarNotificacao('Erro', 'Nome já cadastrado!', 'erro');
            return;
        }
        salvarNoFirebase('gestores', gestor);
        mostrarNotificacao('Sucesso', 'Gestor cadastrado!', 'sucesso');
        setTimeout(() => window.location.href = 'login-gestor.html', 1500);
    });
}

function loginGestor(event) {
    event.preventDefault();
    const nome = document.getElementById('nomeGestor').value;
    const senha = document.getElementById('senhaGestor').value;
    
    database.ref('gestores').once('value', (snapshot) => {
        const data = snapshot.val();
        const gestor = data && Object.values(data).find(g => g.nome === nome && g.senha === senha);
        if (gestor) {
            sessionStorage.setItem('gestorLogado', JSON.stringify(gestor));
            window.location.href = 'gestor.html';
        } else {
            mostrarNotificacao('Erro', 'Acesso negado!', 'erro');
        }
    });
}

// ============ OPERADOR - APROVAR TÉCNICO ============
function aprovarTecnico() {
    localStorage.setItem('tecnicoAprovado', 'sim');
    fecharModalAprovacao();
}

function rejeitarTecnico() {
    localStorage.setItem('tecnicoRejeitado', 'nao');
    database.ref('solicitacoes').remove();
    fecharModalAprovacao();
}

function verificarSolicitacaoTecnico() {
    database.ref('solicitacoes').on('value', (snapshot) => {
        const solicitacao = snapshot.val();
        if (solicitacao && solicitacao.status === 'pendente') {
            const timer = parseInt(localStorage.getItem('timerSolicitacao')) || Date.now();
            const tempoRestante = Math.ceil((60000 - (Date.now() - timer)) / 1000);
            if (tempoRestante > 0) {
                mostrarModalAprovacao(solicitacao, tempoRestante);
            }
        }
    });
}

function mostrarModalAprovacao(tecnico, tempo) {
    if (document.getElementById('modalAprovacao')) return;
    
    const modal = document.createElement('div');
    modal.id = 'modalAprovacao';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;justify-content:center;align-items:center;z-index:9999;';
    modal.innerHTML = `
        <div style="background:var(--preto-claro);padding:40px;border-radius:20px;border:2px solid var(--amarelo);text-align:center;max-width:500px;">
            <h3 style="color:var(--amarelo);margin-bottom:20px;">🔔 Nova Solicitação de Cadastro</h3>
            <p style="margin-bottom:10px;"><strong>Nome:</strong> ${tecnico.nome}</p>
            <p style="margin-bottom:10px;"><strong>Função:</strong> ${tecnico.funcao}</p>
            <p style="color:var(--laranja);margin-bottom:20px;">⏱️ Tempo: <span id="timerCount">${tempo}</span>s</p>
            <div style="display:flex;gap:15px;justify-content:center;">
                <button onclick="aprovarTecnico()" style="background:var(--verde);color:white;padding:15px 30px;border:none;border-radius:10px;font-weight:bold;cursor:pointer;">✅ APROVAR</button>
                <button onclick="rejeitarTecnico()" style="background:var(--vermelho);color:white;padding:15px 30px;border:none;border-radius:10px;font-weight:bold;cursor:pointer;">❌ REJEITAR</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    
    const timerInterval = setInterval(() => {
        const timerEl = document.getElementById('timerCount');
        if (timerEl) {
            let t = parseInt(timerEl.textContent);
            t--;
            timerEl.textContent = t;
            if (t <= 0) {
                clearInterval(timerInterval);
                fecharModalAprovacao();
                localStorage.setItem('tecnicoRejeitado', 'timeout');
                database.ref('solicitacoes').remove();
            }
        }
    }, 1000);
}

function fecharModalAprovacao() {
    const modal = document.getElementById('modalAprovacao');
    if (modal) modal.remove();
}

// ============ ORDEM DE SERVIÇO ============
function cadastrarOS(event) {
    event.preventDefault();
    const clienteLogado = JSON.parse(sessionStorage.getItem('clienteLogado'));
    if (!clienteLogado) return;
    
    const os = {
        protocolo: gerarProtocolo(),
        cliente: clienteLogado.usuario,
        dataAbertura: new Date().toISOString(),
        tipoServico: document.getElementById('tipoServico').value,
        descricaoServico: document.getElementById('descricaoServico').value,
        prioridade: document.getElementById('prioridade').value,
        status: 'Aberta',
        dataInicio: null,
        dataFim: null,
        tecnicoResponsavel: null
    };
    
    salvarNoFirebase('ordensServico', os).then(() => {
        document.getElementById('numeroProtocolo').textContent = os.protocolo;
        document.getElementById('protocoloSection').style.display = 'block';
        document.getElementById('formOS').reset();
        mostrarNotificacao('O.S. Aberta!', `Protocolo #${os.protocolo}`, 'sucesso');
    });
}

function carregarOSCliente() {
    const clienteLogado = JSON.parse(sessionStorage.getItem('clienteLogado'));
    if (!clienteLogado) return;
    
    ouvirFirebase('ordensServico', (ordens) => {
        const minhas = ordens.filter(os => os.cliente === clienteLogado.usuario);
        document.getElementById('countAbertas').textContent = minhas.filter(o => o.status === 'Aberta').length;
        document.getElementById('countAndamento').textContent = minhas.filter(o => o.status === 'Em Andamento').length;
        document.getElementById('countResolvidas').textContent = minhas.filter(o => o.status === 'Resolvida').length;
        
        ['historicoAbertas', 'historicoAndamento', 'historicoResolvidas'].forEach((id, i) => {
            const container = document.getElementById(id);
            if (!container) return;
            const filtro = ['Aberta', 'Em Andamento', 'Resolvida'][i];
            const lista = minhas.filter(o => o.status === filtro);
            container.innerHTML = lista.length === 0 ? '<div class="empty-state"><div class="empty-icon">📭</div></div>' : '';
            lista.forEach(os => {
                container.innerHTML += `<div class="historico-item ${os.status.toLowerCase().replace(' ','')}"><strong>Protocolo:</strong> ${os.protocolo}<br><strong>Serviço:</strong> ${os.tipoServico}<br><strong>Data:</strong> ${formatarData(os.dataAbertura)}<br><strong>Status:</strong> ${os.status}</div>`;
            });
        });
    });
}

// ============ OPERADOR - O.S. ============
function cadastrarOSOperador(event) {
    event.preventDefault();
    const os = {
        protocolo: gerarProtocolo(),
        cliente: document.getElementById('nomeCliente').value,
        dataAbertura: new Date().toISOString(),
        tipoServico: document.getElementById('tipoServico').value,
        descricaoServico: document.getElementById('descricaoServico').value,
        prioridade: document.getElementById('prioridade').value,
        status: 'Aberta',
        dataInicio: null,
        dataFim: null,
        tecnicoResponsavel: null
    };
    
    salvarNoFirebase('ordensServico', os).then(() => {
        document.getElementById('formOS').reset();
        mostrarNotificacao('O.S. Aberta!', `Protocolo #${os.protocolo} para ${os.cliente}`, 'sucesso');
        atualizarStatsOperador();
    });
}

function carregarCentralOperador() {
    ouvirFirebase('ordensServico', (ordens) => {
        const tbody = document.getElementById('corpoCentral');
        if (!tbody) return;
        tbody.innerHTML = ordens.length === 0 ? '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📭</div></div></td></tr>' : '';
        ordens.forEach(os => {
            tbody.innerHTML += `<tr><td><strong style="color:var(--amarelo)">#${os.protocolo}</strong></td><td>${os.cliente}</td><td>${os.tipoServico}</td><td><span class="badge badge-prioridade-${os.prioridade.toLowerCase()}">${os.prioridade}</span></td><td><span class="badge badge-status-${os.status.toLowerCase().replace(' ','')}">${os.status}</span></td><td>${os.tecnicoResponsavel || '-'}</td><td><button class="btn btn-sm btn-primary" onclick="editarOSOperador('${os.id}')">✏️</button></td></tr>`;
        });
    });
}

function editarOSOperador(id) {
    database.ref('ordensServico/' + id).once('value', (snapshot) => {
        const os = snapshot.val();
        const novoStatus = prompt(`Editar OS #${os.protocolo}\n\nStatus atual: ${os.status}\n\nNovo status:\n• Aberta\n• Em Andamento\n• Resolvida`, os.status);
        if (novoStatus && ['Aberta', 'Em Andamento', 'Resolvida'].includes(novoStatus)) {
            const att = { status: novoStatus };
            if (novoStatus === 'Resolvida') att.dataFim = new Date().toISOString();
            atualizarFirebase('ordensServico', id, att);
        }
    });
}

function carregarTecnicosOperador() {
    ouvirFirebase('tecnicos', (tecnicos) => {
        const tbody = document.getElementById('corpoTecnicos');
        if (!tbody) return;
        tbody.innerHTML = tecnicos.length === 0 ? '<tr><td colspan="3"><div class="empty-state"><div class="empty-icon">📭</div></div></td></tr>' : '';
        tecnicos.forEach(t => {
            tbody.innerHTML += `<tr><td>${t.nome}</td><td>${t.funcao}</td><td><span class="badge badge-status-resolvida">✅ Ativo</span></td></tr>`;
        });
    });
}

function atualizarStatsOperador() {
    database.ref('ordensServico').once('value', (snapshot) => {
        const data = snapshot.val();
        const ordens = data ? Object.values(data) : [];
        document.getElementById('countAbertas').textContent = ordens.filter(o => o.status === 'Aberta').length;
        document.getElementById('countAndamento').textContent = ordens.filter(o => o.status === 'Em Andamento').length;
        document.getElementById('countResolvidas').textContent = ordens.filter(o => o.status === 'Resolvida').length;
    });
    database.ref('tecnicos').once('value', (snapshot) => {
        document.getElementById('countTecnicos').textContent = snapshot.val() ? Object.keys(snapshot.val()).length : 0;
    });
}

// ============ TÉCNICO - O.S. ============
function carregarOSTecnico() {
    const tecnicoLogado = JSON.parse(sessionStorage.getItem('tecnicoLogado'));
    if (!tecnicoLogado) return;
    
    document.getElementById('nomeTecnicoLogado').textContent = tecnicoLogado.nome;
    document.getElementById('funcaoTecnicoLogado').textContent = tecnicoLogado.funcao;
    
    ouvirFirebase('ordensServico', (ordens) => {
        const abertas = ordens.filter(o => o.status === 'Aberta');
        const andamento = ordens.filter(o => o.status === 'Em Andamento' && o.tecnicoResponsavel === tecnicoLogado.nome);
        const resolvidas = ordens.filter(o => o.status === 'Resolvida' && o.tecnicoResponsavel === tecnicoLogado.nome);
        
        document.getElementById('countAbertasTec').textContent = abertas.length;
        document.getElementById('countAndamentoTec').textContent = andamento.length;
        document.getElementById('countResolvidasTec').textContent = resolvidas.length;
        
        renderizarTabelaTecnico('corpoOSAbertas', abertas, false);
        renderizarTabelaTecnico('corpoOSAndamento', andamento, false);
        renderizarTabelaTecnico('corpoOSResolvidas', resolvidas, true);
    });
}

function renderizarTabelaTecnico(tbodyId, ordens, mostrarProtocolo) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = ordens.length === 0 ? '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📭</div></div></td></tr>' : '';
    ordens.forEach(os => {
        tbody.innerHTML += `<tr>
            <td>${mostrarProtocolo ? os.protocolo : '***'}</td>
            <td>${formatarData(os.dataAbertura)}</td>
            <td>${os.cliente}</td>
            <td>${os.tipoServico}</td>
            <td><span class="badge badge-prioridade-${os.prioridade.toLowerCase()}">${os.prioridade}</span></td>
            <td>
                ${os.status === 'Aberta' ? `<button class="btn btn-primary btn-sm" onclick="iniciarAtendimento('${os.id}')">▶ Iniciar</button>` : ''}
                ${os.status === 'Em Andamento' ? `<button class="btn btn-primary btn-sm" onclick="mostrarFinalizarOS('${os.id}', '${os.protocolo}')">✓ Finalizar</button>` : ''}
                ${os.status === 'Resolvida' ? '<span class="badge badge-status-resolvida">Concluída</span>' : ''}
            </td></tr>`;
    });
}

function iniciarAtendimento(id) {
    const tecnicoLogado = JSON.parse(sessionStorage.getItem('tecnicoLogado'));
    if (!tecnicoLogado) return;
    atualizarFirebase('ordensServico', id, {
        status: 'Em Andamento',
        dataInicio: new Date().toISOString(),
        tecnicoResponsavel: tecnicoLogado.nome
    });
}

function mostrarFinalizarOS(id, protocolo) {
    const digitado = prompt('Digite o número do protocolo (fornecido pelo cliente):');
    if (digitado === protocolo) {
        atualizarFirebase('ordensServico', id, {
            status: 'Resolvida',
            dataFim: new Date().toISOString()
        });
        mostrarNotificacao('Finalizado!', `O.S. #${protocolo} concluída!`, 'sucesso');
    } else {
        mostrarNotificacao('Erro', 'Protocolo incorreto!', 'erro');
    }
}

// ============ LOGOUT ============
function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// ============ VERIFICAR LOGIN ============
function verificarLogin(tipo) {
    const logado = sessionStorage.getItem(tipo);
    if (!logado) {
        window.location.href = 'login-' + tipo.replace('Logado', '') + '.html';
        return null;
    }
    return JSON.parse(logado);
}
