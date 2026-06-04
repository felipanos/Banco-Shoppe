/* =========================
   BOTÕES DOS CHEFES
========================= */

const opcao1 = document.getElementById("opcao1");
const opcao2 = document.getElementById("opcao2");
const opcao3 = document.getElementById("opcao3");
const opcao4 = document.getElementById("opcao4");

/* =========================
   TELAS
========================= */

const telaInicial = document.getElementById("telaInicial");
const telaEstoque = document.getElementById("telaEstoque");

/* =========================
   ELEMENTOS DA TELA ESTOQUE
========================= */

const nomeChefe = document.getElementById("nomeChefe");
const voltar = document.getElementById("voltar");

/* =========================
   PESQUISA
========================= */

const pesquisa = document.getElementById("pesquisa");
const sugestoes = document.getElementById("sugestoes");

/* =========================
   FORMULÁRIO
========================= */

const formularioProduto =
document.getElementById("formularioProduto");

const adicionarProduto =
document.getElementById("adicionarProduto");

const nomeProduto =
document.getElementById("nomeProduto");

const codigoProduto =
document.getElementById("codigoProduto");

const quantidadeProduto =
document.getElementById("quantidadeProduto");

const salvarProduto =
document.getElementById("salvarProduto");

const cancelarCadastro =
document.getElementById("cancelarProduto");

/* =========================
   LISTA
========================= */

const listaProdutos =
document.getElementById("listaProdutos");

const semProdutos =
document.getElementById("semProdutos");

/* =========================
   VARIÁVEIS
========================= */

let chefeSelecionado = "";

let produtos = [];

/* =========================
   TROCA DE TELA
========================= */

function selecionarChefe(nome){

    chefeSelecionado = nome;

    nomeChefe.textContent =
    "Chefe: " + chefeSelecionado;

    telaInicial.classList.add("oculta");

    setTimeout(function(){

        telaInicial.style.display = "none";

        telaEstoque.style.display = "block";

        telaEstoque.classList.add("oculta");

        setTimeout(function(){

            telaEstoque.classList.remove("oculta");

        }, 10);

    }, 200);

}

/* =========================
   CANCELAR PRODUTO
========================= */

function cancelarProduto(){

    formularioProduto.style.display = "none";

    pesquisa.classList.remove("oculta");

    listaProdutos.classList.remove("oculta");

    adicionarProduto.style.display = "block";

    voltar.style.display = "block";

    nomeProduto.value = "";
    codigoProduto.value = "";
    quantidadeProduto.value = "";

}

/* =========================
   CADASTRAR PRODUTO
========================= */

function cadastrarProduto(){

    const nome = nomeProduto.value;
    const codigo = codigoProduto.value;
    const quantidade = quantidadeProduto.value;

    if(
        nome === "" ||
        codigo === "" ||
        quantidade === ""
    ){

        alert("Preencha todos os campos!");
        return;

    }

    const confirmar = confirm(
        "Tem certeza que deseja cadastrar este produto?"
    );

    if(!confirmar){

        return;

    }

    const produto = {

        nome: nome,
        codigo: codigo,
        quantidade: quantidade

    };

    produtos.push(produto);

    semProdutos.style.display = "none";

    const novoProduto =
    document.createElement("div");

    novoProduto.classList.add("produto");

    novoProduto.innerHTML =

    `
    <h3>${nome}</h3>
    <p>Código: ${codigo}</p>
    <p>Quantidade: ${quantidade}</p>
    `;

    listaProdutos.appendChild(
        novoProduto
    );

    nomeProduto.value = "";
    codigoProduto.value = "";
    quantidadeProduto.value = "";

    formularioProduto.style.display = "none";

    pesquisa.classList.remove("oculta");

    listaProdutos.classList.remove("oculta");

    adicionarProduto.style.display = "block";

    voltar.style.display = "block";

}

/* =========================
   CLIQUES DOS CHEFES
========================= */

opcao1.addEventListener("click", function(){

    selecionarChefe("Oziel");

});

opcao2.addEventListener("click", function(){

    selecionarChefe("Xaoxi");

});

opcao3.addEventListener("click", function(){

    selecionarChefe("Jack");

});

opcao4.addEventListener("click", function(){

    selecionarChefe("Alfredo");

});

/* =========================
   BOTÃO SALVAR
========================= */

if(salvarProduto){

    salvarProduto.addEventListener(
        "click",
        cadastrarProduto
    );

}

/* =========================
   BOTÃO CANCELAR
========================= */

if(cancelarCadastro){

    cancelarCadastro.addEventListener(
        "click",
        cancelarProduto
    );

}

/* =========================
   BOTÃO ADICIONAR PRODUTO
========================= */

if(adicionarProduto){

    adicionarProduto.addEventListener(
        "click",
        function(){

            formularioProduto.style.display = "block";

            pesquisa.classList.add("oculta");

            listaProdutos.classList.add("oculta");

            adicionarProduto.style.display = "none";

            voltar.style.display = "none";

        }
    );

}

/* =========================
   VOLTAR
========================= */

voltar.addEventListener("click", function(){

    telaEstoque.classList.add("oculta");

    setTimeout(function(){

        telaEstoque.style.display = "none";

        telaInicial.style.display = "block";

        telaInicial.classList.add("oculta");

        setTimeout(function(){

            telaInicial.classList.remove("oculta");

        }, 10);

    }, 200);

});

//pesquisa agora busca os itens

pesquisa.addEventListener(
    "input",
    pesquisarProduto
);

function pesquisarProduto(){

    const texto =
    pesquisa.value.toLowerCase();

    const produtosTela =
    document.querySelectorAll(".produto");

    produtosTela.forEach(function(produto){

        const conteudo =
        produto.textContent.toLowerCase();

        if(conteudo.includes(texto)){

            produto.style.display = "block";

        }

        else{

            produto.style.display = "none";

        }

    });

}

function pesquisarProduto(){

    const texto =
    pesquisa.value.toLowerCase();

    sugestoes.innerHTML = "";

    if(texto === ""){
        return;
    }

    produtos.forEach(function(produto){

        if(
            produto.nome.toLowerCase().includes(texto) ||
            produto.codigo.toLowerCase().includes(texto)
        ){

            const item =
            document.createElement("div");

            item.classList.add("sugestao");

            item.textContent =
            produto.nome + " (" + produto.codigo + ")";

            sugestoes.appendChild(item);

        }

    });

}