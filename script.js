/**
 * =============================================================================
 * CONTROLE SHOPEE — script.js
 * =============================================================================
 *
 * PARTES PRINCIPAIS DO SISTEMA:
 *
 *   1. CONFIG      → Constantes (chefes, chaves do localStorage)
 *   2. DOM         → Elementos da página
 *   3. ESTADO      → Dados em memória (estoques + retiradas)
 *   4. STORAGE     → Salvar/carregar (temporário até ter banco de dados)
 *   5. UTILS       → Funções auxiliares
 *   6. TELAS       → Trocar entre tela inicial e estoque
 *   7. PRODUTOS    → Cadastrar, listar e editar produtos
 *   8. CODIGOS     → Adicionar e remover códigos no painel de edição
 *   9. RETIRADAS   → Registrar quem pegou qual caixa
 *  10. PESQUISA    → Filtrar lista e mostrar sugestões
 *  11. RELATORIOS  → Estoque atual + quem pegou o quê
 *  12. EVENTOS     → Cliques dos botões
 *  13. INICIO      → Carrega dados ao abrir a página
 *
 * =============================================================================
 */


/* =============================================================================
   1. CONFIG — Constantes do sistema
   ============================================================================= */

const NOMES_CHEFES = ["Oziel", "Xaoxi", "Jack", "Alfredo"];

const CHAVE_ESTOQUES = "controle-shopee-estoques";
const CHAVE_RETIRADAS = "controle-shopee-retiradas";


/* =============================================================================
   2. DOM — Referências aos elementos HTML
   ============================================================================= */

const DOM = {
    // Tela inicial
    botoesChefes: [
        document.getElementById("opcao1"),
        document.getElementById("opcao2"),
        document.getElementById("opcao3"),
        document.getElementById("opcao4"),
    ],
    telaInicial: document.getElementById("telaInicial"),
    telaEstoque: document.getElementById("telaEstoque"),

    // Cabeçalho do estoque
    nomeChefe: document.getElementById("nomeChefe"),
    voltar: document.getElementById("voltar"),
    relatorio: document.getElementById("relatorio"),

    // Pesquisa
    pesquisa: document.getElementById("pesquisa"),
    sugestoes: document.getElementById("sugestoes"),

    // Cadastro de produto
    formularioProduto: document.getElementById("formularioProduto"),
    adicionarProduto: document.getElementById("adicionarProduto"),
    historicoRetiradas: document.getElementById("historicoRetiradas"),
    nomeProduto: document.getElementById("nomeProduto"),
    codigoProduto: document.getElementById("codigoProduto"),
    quantidadeProduto: document.getElementById("quantidadeProduto"),
    salvarProduto: document.getElementById("salvarProduto"),
    cancelarProduto: document.getElementById("cancelarProduto"),

    // Lista
    listaProdutos: document.getElementById("listaProdutos"),
    semProdutos: document.getElementById("semProdutos"),
};


/* =============================================================================
   3. ESTADO — Dados em memória
   ============================================================================= */

let chefeSelecionado = "";

/** Estoque separado por chefe: { "Oziel": [produtos], "Xaoxi": [...] } */
const estoquesPorChefe = Object.fromEntries(
    NOMES_CHEFES.map(function (nome) {
        return [nome, []];
    })
);

/**
 * Histórico de retiradas (futuro: tabela no banco de dados)
 * Cada item: { id, chefe, produto, codigo, responsavel, quantidade, dataHora }
 */
let retiradas = [];


/* =============================================================================
   4. STORAGE — Persistência local (substituir por API/banco depois)
   ============================================================================= */

function persistirEstoques() {
    try {
        localStorage.setItem(CHAVE_ESTOQUES, JSON.stringify(estoquesPorChefe));
    } catch (erro) {
        console.warn("[Storage] Erro ao salvar estoques:", erro);
    }
}

function persistirRetiradas() {
    try {
        localStorage.setItem(CHAVE_RETIRADAS, JSON.stringify(retiradas));
    } catch (erro) {
        console.warn("[Storage] Erro ao salvar retiradas:", erro);
    }
}

function carregarDados() {
    try {
        const estoquesSalvos = localStorage.getItem(CHAVE_ESTOQUES);
        if (estoquesSalvos) {
            const parsed = JSON.parse(estoquesSalvos);
            NOMES_CHEFES.forEach(function (nome) {
                if (Array.isArray(parsed[nome])) {
                    estoquesPorChefe[nome] = parsed[nome];
                }
            });
        }

        const retiradasSalvas = localStorage.getItem(CHAVE_RETIRADAS);
        if (retiradasSalvas) {
            const parsed = JSON.parse(retiradasSalvas);
            if (Array.isArray(parsed)) {
                retiradas = parsed;
            }
        }
    } catch (erro) {
        console.warn("[Storage] Erro ao carregar dados:", erro);
    }
}

function getProdutosAtuais() {
    return estoquesPorChefe[chefeSelecionado] || [];
}

function getRetiradasDoChefe(chefe) {
    return retiradas
        .filter(function (r) { return r.chefe === chefe; })
        .sort(function (a, b) {
            return new Date(b.dataHora) - new Date(a.dataHora);
        });
}


/* =============================================================================
   5. UTILS — Funções auxiliares
   ============================================================================= */

function escaparHtml(texto) {
    const el = document.createElement("div");
    el.textContent = texto;
    return el.innerHTML;
}

function validarQuantidade(valor, minimo) {
    const qtd = Number(valor);
    const min = minimo === undefined ? 0 : minimo;
    if (!Number.isInteger(qtd) || qtd < min) return null;
    return qtd;
}

function formatarData(iso) {
    return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function produtoCombinaBusca(produto, texto) {
    const termo = texto.toLowerCase();
    return (
        produto.nome.toLowerCase().includes(termo) ||
        produto.codigos.join(" ").toLowerCase().includes(termo)
    );
}

function fecharPainel(card, seletor) {
    const painel = card.querySelector(seletor);
    if (painel) painel.style.display = "none";
}

function fecharOutrosPaineis(cardAtual) {
    DOM.listaProdutos.querySelectorAll(".produto").forEach(function (card) {
        if (card === cardAtual) return;
        fecharPainel(card, ".painel-edicao");
        fecharPainel(card, ".painel-retirada");
    });
}


/* =============================================================================
   6. TELAS — Navegação entre telas
   ============================================================================= */

function transicionarTela(saida, entrada) {
    saida.classList.add("oculta");

    setTimeout(function () {
        saida.style.display = "none";
        entrada.style.display = "block";
        entrada.classList.add("oculta");

        setTimeout(function () {
            entrada.classList.remove("oculta");
        }, 10);
    }, 200);
}

function alternarFormularioCadastro(aberto) {
    DOM.formularioProduto.style.display = aberto ? "block" : "none";
    DOM.pesquisa.classList.toggle("oculta", aberto);
    DOM.listaProdutos.classList.toggle("oculta", aberto);
    DOM.adicionarProduto.style.display = aberto ? "none" : "block";
    DOM.historicoRetiradas.style.display = aberto ? "none" : "block";
    DOM.voltar.style.display = aberto ? "none" : "block";
}

function limparFormularioCadastro() {
    DOM.nomeProduto.value = "";
    DOM.codigoProduto.value = "";
    DOM.quantidadeProduto.value = "";
}

function limparPesquisa() {
    DOM.pesquisa.value = "";
    DOM.sugestoes.innerHTML = "";
}

function selecionarChefe(nome) {
    chefeSelecionado = nome;
    DOM.nomeChefe.textContent = "Chefe: " + nome;

    limparPesquisa();
    limparFormularioCadastro();
    alternarFormularioCadastro(false);
    renderizarLista();

    transicionarTela(DOM.telaInicial, DOM.telaEstoque);
}

function voltarParaInicial() {
    chefeSelecionado = "";
    limparPesquisa();
    limparFormularioCadastro();
    alternarFormularioCadastro(false);
    transicionarTela(DOM.telaEstoque, DOM.telaInicial);
}


/* =============================================================================
   7. PRODUTOS — Cadastro, listagem e edição
   ============================================================================= */

function atualizarMensagemVazia() {
    DOM.semProdutos.style.display =
        getProdutosAtuais().length === 0 ? "block" : "none";
}

function renderizarLista() {
    DOM.listaProdutos.querySelectorAll(".produto").forEach(function (c) {
        c.remove();
    });

    getProdutosAtuais().forEach(function (produto, i) {
        DOM.listaProdutos.appendChild(criarCardProduto(produto, i));
    });

    atualizarMensagemVazia();
    pesquisarProduto();
}

function atualizarCard(card, produto) {
    card.querySelector(".nome-produto").textContent = produto.nome;
    card.querySelector(".codigos-produto").textContent = produto.codigos.join(" | ");
    card.querySelector(".qtd-produto").textContent = String(produto.quantidade);
    card.querySelector(".editar-quantidade").value = String(produto.quantidade);
}

function cadastrarProduto() {
    const nome = DOM.nomeProduto.value.trim();
    const codigo = DOM.codigoProduto.value.trim();
    const quantidade = validarQuantidade(DOM.quantidadeProduto.value);

    if (!nome || !codigo) {
        alert("Preencha o nome e o código do produto.");
        return;
    }
    if (quantidade === null) {
        alert("Informe uma quantidade válida (inteiro ≥ 0).");
        return;
    }
    if (!confirm("Cadastrar este produto?")) return;

    getProdutosAtuais().push({ nome, codigos: [codigo], quantidade });
    persistirEstoques();

    renderizarLista();
    limparFormularioCadastro();
    alternarFormularioCadastro(false);
}

function cancelarCadastro() {
    limparFormularioCadastro();
    alternarFormularioCadastro(false);
}

function salvarEdicao(card, produto) {
    const nome = card.querySelector(".editar-nome").value.trim();
    const quantidade = validarQuantidade(card.querySelector(".editar-quantidade").value);

    if (!nome) {
        alert("O nome não pode ficar vazio.");
        return false;
    }
    if (quantidade === null) {
        alert("Informe uma quantidade válida (inteiro ≥ 0).");
        return false;
    }

    produto.nome = nome;
    produto.quantidade = quantidade;
    atualizarCard(card, produto);
    persistirEstoques();
    pesquisarProduto();
    return true;
}

function criarCardProduto(produto, indice) {
    const card = document.createElement("article");
    card.className = "produto";
    card.dataset.indice = String(indice);

    card.innerHTML =
        '<h3 class="nome-produto">' + escaparHtml(produto.nome) + '</h3>' +
        '<p>Códigos: <span class="codigos-produto">' + escaparHtml(produto.codigos.join(" | ")) + '</span></p>' +
        '<p>Quantidade: <span class="qtd-produto">' + escaparHtml(String(produto.quantidade)) + '</span></p>' +
        '<div class="acoes-produto">' +
        '<button type="button" class="btn-excluir">🗑️ Excluir Produto</button>' +
            '<button type="button" class="btn-editar">✏️ Editar</button>' +
            '<button type="button" class="btn-retirar">📦 Retirar Caixa</button>' +
        '</div>' +
        '<div class="painel-edicao" hidden>' +
            '<p class="titulo-painel">Editar produto</p>' +
            '<input type="text" class="editar-nome" value="' + escaparHtml(produto.nome) + '">' +
            '<input type="number" class="editar-quantidade" value="' + escaparHtml(String(produto.quantidade)) + '" min="0" step="1">' +
            '<input type="text" class="novo-codigo" placeholder="Novo código">' +
            '<button type="button" class="btn-add-codigo">+ Adicionar Código</button>' +
            '<p class="rotulo-lista">Códigos cadastrados:</p>' +
            '<div class="lista-codigos"></div>' +
            '<button type="button" class="btn-salvar-edicao">Salvar Alterações</button>' +
        '</div>' +
        '<div class="painel-retirada" hidden>' +
            '<p class="titulo-painel">Registrar retirada</p>' +
            '<input type="text" class="nome-responsavel" placeholder="Quem pegou a caixa?">' +
            '<label class="rotulo-campo">Código da caixa</label>' +
            '<select class="codigo-retirada"></select>' +
            '<input type="number" class="qtd-retirada" value="1" min="1" step="1">' +
            '<div class="botoes-painel">' +
                '<button type="button" class="btn-confirmar-retirada">Confirmar Retirada</button>' +
                '<button type="button" class="btn-cancelar-retirada">Cancelar</button>' +
            '</div>' +
        '</div>';

    const painelEdicao = card.querySelector(".painel-edicao");
    const painelRetirada = card.querySelector(".painel-retirada");
    const listaCodigos = card.querySelector(".lista-codigos");
    const selectCodigo = card.querySelector(".codigo-retirada");

    renderizarListaCodigos(listaCodigos, produto, card);
    preencherSelectCodigos(selectCodigo, produto.codigos);

    // Abrir/fechar painel de edição
    card.querySelector(".btn-editar").addEventListener("click", function () {
        const abrir = painelEdicao.hidden;
        fecharOutrosPaineis(card);
        painelRetirada.hidden = true;
        painelEdicao.hidden = !abrir;
        if (abrir) renderizarListaCodigos(listaCodigos, produto, card);
    });

    // Abrir/fechar painel de retirada
    card.querySelector(".btn-retirar").addEventListener("click", function () {
        if (produto.quantidade <= 0) {
            alert("Produto sem estoque.");
            return;
        }
        const abrir = painelRetirada.hidden;
        fecharOutrosPaineis(card);
        painelEdicao.hidden = true;
        painelRetirada.hidden = !abrir;
        if (abrir) {
            preencherSelectCodigos(selectCodigo, produto.codigos);
            card.querySelector(".nome-responsavel").value = "";
            card.querySelector(".qtd-retirada").value = "1";
        }
    });

    // Adicionar código
    card.querySelector(".btn-add-codigo").addEventListener("click", function () {
        adicionarCodigo(card, produto, listaCodigos, selectCodigo);
    });

    // Salvar edição
    card.querySelector(".btn-salvar-edicao").addEventListener("click", function () {
        if (salvarEdicao(card, produto)) {
            painelEdicao.hidden = true;
        }
    });

    // Confirmar retirada
    card.querySelector(".btn-confirmar-retirada").addEventListener("click", function () {
        if (registrarRetirada(card, produto)) {
            painelRetirada.hidden = true;
        }
    });

    card.querySelector(".btn-cancelar-retirada").addEventListener("click", function () {
        painelRetirada.hidden = true;
    });

    return card;
}


/* =============================================================================
   8. CODIGOS — Adicionar e remover códigos
   ============================================================================= */

function renderizarListaCodigos(container, produto, card) {
    container.innerHTML = "";

    if (produto.codigos.length === 0) {
        container.textContent = "Nenhum código cadastrado.";
        return;
    }

    produto.codigos.forEach(function (codigo, i) {
        const item = document.createElement("div");
        item.className = "item-codigo";

        const texto = document.createElement("span");
        texto.className = "texto-codigo";
        texto.textContent = codigo;

        const btnRemover = document.createElement("button");
        btnRemover.type = "button";
        btnRemover.className = "btn-remover-codigo";
        btnRemover.textContent = "Remover";

        btnRemover.addEventListener("click", function () {
            if (produto.codigos.length <= 1) {
                alert("O produto precisa ter pelo menos um código.");
                return;
            }
            if (!confirm('Remover o código "' + codigo + '"?')) return;

            produto.codigos.splice(i, 1);
            atualizarCard(card, produto);
            renderizarListaCodigos(container, produto, card);
            preencherSelectCodigos(card.querySelector(".codigo-retirada"), produto.codigos);
            persistirEstoques();
            pesquisarProduto();
        });

        item.appendChild(texto);
        item.appendChild(btnRemover);
        container.appendChild(item);
    });
}

function adicionarCodigo(card, produto, listaCodigos, selectCodigo) {
    const campo = card.querySelector(".novo-codigo");
    const codigo = campo.value.trim();

    if (!codigo) {
        alert("Digite um código.");
        return;
    }
    if (produto.codigos.includes(codigo)) {
        alert("Código já cadastrado neste produto.");
        return;
    }

    produto.codigos.push(codigo);
    atualizarCard(card, produto);
    renderizarListaCodigos(listaCodigos, produto, card);
    preencherSelectCodigos(selectCodigo, produto.codigos, codigo);
    campo.value = "";
    persistirEstoques();
    pesquisarProduto();
}

function preencherSelectCodigos(select, codigos, selecionado) {
    select.innerHTML = "";
    codigos.forEach(function (codigo) {
        const opt = document.createElement("option");
        opt.value = codigo;
        opt.textContent = codigo;
        select.appendChild(opt);
    });
    if (selecionado) select.value = selecionado;
}


/* =============================================================================
   9. RETIRADAS — Quem pegou qual caixa
   ============================================================================= */

function registrarRetirada(card, produto) {
    const responsavel = card.querySelector(".nome-responsavel").value.trim();
    const codigo = card.querySelector(".codigo-retirada").value;
    const quantidade = validarQuantidade(card.querySelector(".qtd-retirada").value, 1);

    if (!responsavel) {
        alert("Informe quem pegou a caixa.");
        return false;
    }
    if (!codigo) {
        alert("Selecione o código da caixa.");
        return false;
    }
    if (quantidade === null) {
        alert("Quantidade inválida (mínimo 1).");
        return false;
    }
    if (quantidade > produto.quantidade) {
        alert("Estoque insuficiente. Disponível: " + produto.quantidade);
        return false;
    }
    if (!confirm(
        responsavel + " retira " + quantidade + ' caixa(s) de "' +
        produto.nome + '" (cód. ' + codigo + ")?"
    )) {
        return false;
    }

    retiradas.push({
        id: gerarId(),
        chefe: chefeSelecionado,
        produto: produto.nome,
        codigo: codigo,
        responsavel: responsavel,
        quantidade: quantidade,
        dataHora: new Date().toISOString(),
    });

    produto.quantidade -= quantidade;

    persistirRetiradas();
    persistirEstoques();
    atualizarCard(card, produto);

    alert("Retirada registrada.");
    return true;
}


/* =============================================================================
   10. PESQUISA — Filtro e sugestões
   ============================================================================= */

function pesquisarProduto() {
    const texto = DOM.pesquisa.value.trim().toLowerCase();
    const cards = DOM.listaProdutos.querySelectorAll(".produto");

    // Filtra cards na lista
    cards.forEach(function (card) {
        const produto = getProdutosAtuais()[Number(card.dataset.indice)];
        const visivel = !texto || produtoCombinaBusca(produto, texto);
        card.style.display = visivel ? "block" : "none";
    });

    // Monta sugestões
    DOM.sugestoes.innerHTML = "";
    if (!texto) return;

    getProdutosAtuais().forEach(function (produto, i) {
        if (!produtoCombinaBusca(produto, texto)) return;

        const item = document.createElement("div");
        item.className = "sugestao";
        item.textContent = produto.nome + " (" + produto.codigos.join(", ") + ")";

        item.addEventListener("click", function () {
            DOM.pesquisa.value = produto.nome;
            DOM.sugestoes.innerHTML = "";

            cards.forEach(function (card) {
                card.style.display = card.dataset.indice === String(i) ? "block" : "none";
            });

            const alvo = DOM.listaProdutos.querySelector('[data-indice="' + i + '"]');
            if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });

        DOM.sugestoes.appendChild(item);
    });
}


/* =============================================================================
   11. RELATORIOS — Estoque + retiradas
   ============================================================================= */

function textoEstoque(produtos) {
    if (!produtos.length) return "Nenhum produto cadastrado.";

    const total = produtos.reduce(function (s, p) { return s + p.quantidade; }, 0);
    const linhas = produtos.map(function (p) {
        return "• " + p.nome + " | Qtd: " + p.quantidade + " | Códigos: " + p.codigos.join(", ");
    });

    return (
        "Produtos: " + produtos.length + "\n" +
        "Total em estoque: " + total + " caixa(s)\n\n" +
        linhas.join("\n")
    );
}

function textoRetiradas(lista) {
    if (!lista.length) return "Nenhuma retirada registrada.";

    const total = lista.reduce(function (s, r) { return s + r.quantidade; }, 0);
    const linhas = lista.map(function (r) {
        return (
            "• " + formatarData(r.dataHora) +
            " | " + r.responsavel +
            " pegou " + r.quantidade + " caixa(s)" +
            " | " + r.produto +
            " (cód. " + r.codigo + ")"
        );
    });

    return (
        "Retiradas: " + lista.length + "\n" +
        "Caixas retiradas: " + total + "\n\n" +
        linhas.join("\n")
    );
}

function abrirOverlay(titulo, secoes) {
    document.getElementById("overlayRelatorio")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "overlayRelatorio";
    overlay.className = "overlay-relatorio";

    const painel = document.createElement("div");
    painel.className = "painel-relatorio";

    const h3 = document.createElement("h3");
    h3.textContent = titulo;
    painel.appendChild(h3);

    secoes.forEach(function (secao) {
        const bloco = document.createElement("section");
        bloco.className = "secao-relatorio";

        const h4 = document.createElement("h4");
        h4.textContent = secao.titulo;

        const pre = document.createElement("pre");
        pre.textContent = secao.texto;

        bloco.appendChild(h4);
        bloco.appendChild(pre);
        painel.appendChild(bloco);
    });

    const btnFechar = document.createElement("button");
    btnFechar.type = "button";
    btnFechar.className = "fechar-relatorio";
    btnFechar.textContent = "Fechar";

    btnFechar.addEventListener("click", function () { overlay.remove(); });
    overlay.addEventListener("click", function (e) {
        if (e.target === overlay) overlay.remove();
    });

    painel.appendChild(btnFechar);
    overlay.appendChild(painel);
    document.body.appendChild(overlay);
}

function abrirRelatorio() {
    abrirOverlay("Relatório — " + chefeSelecionado, [
        { titulo: "📦 Estoque atual", texto: textoEstoque(getProdutosAtuais()) },
        { titulo: "📋 Quem pegou qual caixa", texto: textoRetiradas(getRetiradasDoChefe(chefeSelecionado)) },
    ]);
}

function abrirHistoricoRetiradas() {
    abrirOverlay("Histórico — " + chefeSelecionado, [
        { titulo: "📋 Movimentações", texto: textoRetiradas(getRetiradasDoChefe(chefeSelecionado)) },
    ]);
}


/* =============================================================================
   12. EVENTOS — Listeners dos botões
   ============================================================================= */

DOM.botoesChefes.forEach(function (btn, i) {
    btn.addEventListener("click", function () {
        selecionarChefe(NOMES_CHEFES[i]);
    });
});

DOM.salvarProduto.addEventListener("click", cadastrarProduto);
DOM.cancelarProduto.addEventListener("click", cancelarCadastro);
DOM.adicionarProduto.addEventListener("click", function () {
    alternarFormularioCadastro(true);
});
DOM.voltar.addEventListener("click", voltarParaInicial);
DOM.relatorio.addEventListener("click", abrirRelatorio);
DOM.historicoRetiradas.addEventListener("click", abrirHistoricoRetiradas);
DOM.pesquisa.addEventListener("input", pesquisarProduto);


/* =============================================================================
   13. INICIO — Carrega dados ao abrir
   ============================================================================= */

carregarDados();
