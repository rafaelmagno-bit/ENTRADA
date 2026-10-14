/**
 * EntradaBensService.gs - Serviços e Controladores da Entrada de Bens
 */

/**
 * Consulta e decompõe os dados de uma Nota Fiscal a partir da Chave DANFE (44 dígitos)
 */
function consultarDanfeChave(chaveAcesso) {
  try {
    const chaveLimpa = String(chaveAcesso || '').replace(/\D/g, '');

    if (chaveLimpa.length !== 44) {
      return { success: false, error: "A chave de acesso deve conter exatamente 44 dígitos numéricos." };
    }

    // Decomposição estrutural da Chave NFe (Padrão Nacional)
    const ufCodigo = chaveLimpa.substring(0, 2);
    const aamm = chaveLimpa.substring(2, 6);
    const cnpjBruto = chaveLimpa.substring(6, 20);
    const modelo = chaveLimpa.substring(20, 22);
    const serie = chaveLimpa.substring(22, 25);
    const numeroNotaBruto = chaveLimpa.substring(25, 34);

    // Formatação do CNPJ e Número da Nota
    const cnpjFormatado = cnpjBruto.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    const numeroNotaFormatado = String(parseInt(numeroNotaBruto, 10)); // Remove zeros à esquerda
    const ano = "20" + aamm.substring(0, 2);
    const mes = aamm.substring(2, 4);

    // Estrutura de dados extraídos da Chave DANFE
    const dadosExtraidos = {
      chave_acesso: chaveLimpa,
      numero_nota: numeroNotaFormatado,
      serie_nota: serie,
      cnpj_fornecedor: cnpjFormatado,
      nome_fornecedor: "Fornecedor extraído via DANFE (CNPJ " + cnpjFormatado + ")",
      data_emissao: `${mes}/${ano}`,
      natureza_operacao: "Compra / Aquisição de Bens",
      valor_frete: "0,00",
      valor_desconto: "0,00",
      valor_ipi: "0,00",
      valor_total_nota: "",
      itens: [
        { descricao: "Item conforme Chave DANFE " + chaveLimpa.substring(0, 8) + "...", quantidade: "1", valor_unitario: "", valor_total: "", valor_ipi_item: "0,00" }
      ]
    };

    return {
      success: true,
      extractedData: dadosExtraidos
    };

  } catch (erro) {
    Logger.log("Erro na consulta DANFE: " + erro.toString());
    return { success: false, error: "Falha ao processar a chave DANFE: " + erro.toString() };
  }
}

/**
 * Retorna os dados consolidados para o Dashboard por Tipo de Entrada
 */
function getDashboardTipoEntradaData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    const abaProc = ss.getSheetByName("Processos");
    const abaSolic = ss.getSheetByName("Solicitacoes_Tombamento");
    const abaNF = ss.getSheetByName("Notas_Fiscais") || ss.getSheetByName("Notas Fiscais");

    const dadosProc = abaProc ? abaProc.getDataRange().getValues() : [];
    const dadosSolic = abaSolic ? abaSolic.getDataRange().getValues() : [];
    const dadosNF = abaNF ? abaNF.getDataRange().getValues() : [];

    const mapSolicitacoes = {};
    for (let i = 1; i < dadosSolic.length; i++) {
      const proc = String(dadosSolic[i][1] || '').trim().toLowerCase();
      if (proc) mapSolicitacoes[proc] = (mapSolicitacoes[proc] || 0) + 1;
    }

    const mapNFs = {};
    for (let i = 1; i < dadosNF.length; i++) {
      const proc = String(dadosNF[i][1] || '').trim().toLowerCase();
      if (proc) mapNFs[proc] = (mapNFs[proc] || 0) + 1;
    }

    const tiposEntrada = [
      "Empenho", "Edital Interno", "FADE / FAD", "CNPq", 
      "FACEPE", "Doação", "Pré-existente", "FAPESP", "Outros Fomentos"
    ];

    const dashboard = {};
    tiposEntrada.forEach(tipo => {
      dashboard[tipo] = {
        tipoEntrada: tipo,
        totalProcessos: 0,
        semSolicitacao: 0,
        semNF: 0,
        comNF: 0,
        processados: 0,
        listaProcessos: []
      };
    });

    for (let i = 1; i < dadosProc.length; i++) {
      const linha = dadosProc[i];
      const numProcStr = String(linha[1] || '').trim();
      const numProcKey = numProcStr.toLowerCase();
      const tipoEntradaRaw = String(linha[3] || '').trim();
      const statusProcessamento = String(linha[6] || 'Pendente').trim();

      if (!numProcStr) continue;

      let tipoChave = tiposEntrada.find(t => t.toLowerCase() === tipoEntradaRaw.toLowerCase()) || tipoEntradaRaw || "Outros Fomentos";
      if (!dashboard[tipoChave]) {
        dashboard[tipoChave] = {
          tipoEntrada: tipoChave, totalProcessos: 0, semSolicitacao: 0, semNF: 0, comNF: 0, processados: 0, listaProcessos: []
        };
      }

      const qtdSolic = mapSolicitacoes[numProcKey] || 0;
      const qtdNF = mapNFs[numProcKey] || 0;
      let categoriaStatus = "";

      if (["concluído", "tombado", "processado"].includes(statusProcessamento.toLowerCase())) {
        categoriaStatus = "processados";
        dashboard[tipoChave].processados++;
      } else if (qtdSolic === 0) {
        categoriaStatus = "semSolicitacao";
        dashboard[tipoChave].semSolicitacao++;
      } else if (qtdNF === 0) {
        categoriaStatus = "semNF";
        dashboard[tipoChave].semNF++;
      } else {
        categoriaStatus = "comNF";
        dashboard[tipoChave].comNF++;
      }

      dashboard[tipoChave].totalProcessos++;
      dashboard[tipoChave].listaProcessos.push({
        numProcesso: numProcStr,
        dataEnvio: linha[2] ? Utilities.formatDate(new Date(linha[2]), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy") : "-",
        tipoEntrada: tipoChave,
        qtdSolicitacoes: qtdSolic,
        qtdNotasFiscais: qtdNF,
        categoriaStatus: categoriaStatus,
        statusTexto: statusProcessamento
      });
    }

    return { success: true, dados: dashboard };
  } catch (erro) {
    return { success: false, error: erro.toString() };
  }
}

function salvarCadastroProcesso(payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let aba = ss.getSheetByName("Processos");

    if (!aba) {
      aba = ss.insertSheet("Processos");
      aba.appendRow(["ID_Processo", "Numero_Processo", "Data_Envio", "Tipo_Entrada", "Data_Cadastro", "Usuario"]);
    }

    const numProcesso = String(payload.numProcesso || '').trim();
    const dataEnvio = payload.dataEnvio || '';
    const tipoEntrada = payload.tipoEntrada || '';
    const usuario = Session.getActiveUser().getEmail() || "usuario@ufpe.br";
    const dataCadastro = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm:ss");

    const dados = aba.getDataRange().getValues();
    let linhaExistente = -1;

    for (let i = 1; i < dados.length; i++) {
      if (String(dados[i][1] || '').trim().toLowerCase() === numProcesso.toLowerCase()) {
        linhaExistente = i + 1;
        break;
      }
    }

    let idProcesso = "";
    if (linhaExistente > 0) {
      idProcesso = dados[linhaExistente - 1][0];
      aba.getRange(linhaExistente, 3, 1, 4).setValues([[dataEnvio, tipoEntrada, dataCadastro, usuario]]);
    } else {
      idProcesso = "PROC_" + new Date().getTime();
      aba.appendRow([idProcesso, numProcesso, dataEnvio, tipoEntrada, dataCadastro, usuario]);
    }

    return { success: true, idProcesso: idProcesso, numProcesso: numProcesso, jaExistia: (linhaExistente > 0) };
  } catch (erro) {
    return { success: false, error: erro.toString() };
  }
}

function processarSolicitacaoTombamento(fileData, tipoEntrada, processo, dataProcesso) {
  try {
    const base64Pure = fileData.base64.split(',')[1] || fileData.base64;
    const extractedData = extrairDadosComGemini(base64Pure, fileData.mimeType, tipoEntrada, processo);
    return { success: true, extractedData: extractedData };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function processarNotaFiscal(base64Data, fileName, processo) {
  try {
    const base64Pure = base64Data.split(',')[1] || base64Data;
    const extractedData = extrairDadosComGemini(base64Pure, "application/pdf", "Nota Fiscal", processo);
    return { success: true, extractedData: extractedData };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function salvarSolicitacaoConfirmada(payload) {
  return salvarSolicitacaoTombamentoServidor(payload);
}

function salvarNotaFiscalConfirmada(payload) {
  return salvarNotaFiscalServidor(payload);
}

function obterSolicitacoesDoProcesso(numProcesso) {
  return buscarSolicitacoesPorProcesso(numProcesso);
}

function buscarSolicitacoesPorProcesso(numProcesso) {
  try {
    if (!numProcesso && numProcesso !== 0) return [];
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName("Solicitacoes_Tombamento");
    if (!aba) return [];

    const dados = aba.getDataRange().getValues();
    const resultado = [];

    const procBuscaStr = String(numProcesso).trim().toLowerCase();
    const procBuscaNum = String(numProcesso).replace(/\D/g, '');

    for (let i = 1; i < dados.length; i++) {
      const valorCelulaProc = dados[i][1];
      if (!valorCelulaProc) continue;

      const procRegStr = String(valorCelulaProc).trim().toLowerCase();
      const procRegNum = procRegStr.replace(/\D/g, '');

      if (procRegStr === procBuscaStr || (procBuscaNum !== '' && procRegNum === procBuscaNum)) {
        let dadosExtraidosObj = {};
        try {
          dadosExtraidosObj = typeof dados[i][3] === 'object' ? dados[i][3] : JSON.parse(dados[i][3]);
        } catch (e) { dadosExtraidosObj = {}; }

        resultado.push({
          idSolicitacao: String(dados[i][0] || ''),
          numProcesso: String(dados[i][1] || ''),
          tipoEntrada: String(dados[i][2] || 'Solicitação de Tombamento'),
          dadosExtraidos: dadosExtraidosObj,
          dataHora: String(dados[i][5] || '')
        });
      }
    }
    return resultado;
  } catch (err) {
    return [];
  }
}

function verificarDuplicidadeNotaFiscal(numNota, cnpj, fornecedor) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName('Notas_Fiscais') || ss.getSheetByName('Notas Fiscais');
    if (!aba) return { existe: false };

    const dados = aba.getDataRange().getValues();
    if (dados.length <= 1) return { existe: false };

    const notaBuscaLimpa = String(numNota || '').replace(/\D/g, '').replace(/^0+/, '');
    const cnpjBuscaLimpo = String(cnpj || '').replace(/\D/g, '');
    if (!notaBuscaLimpa) return { existe: false };

    for (let i = 1; i < dados.length; i++) {
      const numProcessoReg = String(dados[i][1] || '').trim();
      const celulaD = dados[i][3];
      if (!celulaD) continue;

      let dadosNFObj = {};
      try { dadosNFObj = typeof celulaD === 'object' ? celulaD : JSON.parse(celulaD); } catch (e) { dadosNFObj = {}; }

      const numNotaReg = String(dadosNFObj.numero_nota || '').replace(/\D/g, '').replace(/^0+/, '');
      const cnpjReg = String(dadosNFObj.cnpj_fornecedor || '').replace(/\D/g, '');

      if (numNotaReg === notaBuscaLimpa && (!cnpjBuscaLimpo || cnpjReg.includes(cnpjBuscaLimpo))) {
        return {
          existe: true,
          numProcesso: numProcessoReg || "Processo sem número",
          mensagem: `A Nota Fiscal nº ${numNota} já está registrada no processo ${numProcessoReg}.`
        };
      }
    }
    return { existe: false };
  } catch (erro) {
    return { existe: false, error: erro.toString() };
  }
}

/**
 * Consulta na planilha se o processo já está cadastrado
 */
function verificarProcessoExistenteGS(numProcesso) {
  try {
    if (!numProcesso) return { existe: false };

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    // Busca a aba "Processos" ou utiliza a primeira aba da planilha
    var aba = ss.getSheetByName("Processos") || ss.getSheetByName("Dados") || ss.getSheets()[0];
    var dados = aba.getDataRange().getValues();

    // Normalizador: remove pontos, traços, barras e espaços
    var normalizar = function(str) {
      return String(str || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    };

    var procBuscado = normalizar(numProcesso);

    // Percorre todas as linhas da planilha (pula o cabeçalho)
    for (var i = 1; i < dados.length; i++) {
      var linha = dados[i];
      var procColuna0 = normalizar(linha[0]); // Primeira coluna
      var procColuna1 = normalizar(linha[1]); // Segunda coluna (caso esteja aí)

      if (procColuna0 === procBuscado || procColuna1 === procBuscado) {
        return {
          existe: true,
          numeroProcesso: linha[0],
          tipoEntrada: linha[2] || ''
        };
      }
    }

    return { existe: false };
  } catch (erro) {
    return { existe: false, erro: erro.toString() };
  }
}

/**
 * Valida se o processo já existe na tabela do Dashboard, no DOM ou na memória do sistema
 */
function verificarProcessoExistente(numProc) {
  const feedback = document.getElementById('feedbackProcesso');
  if (!feedback) return false;

  const procDigitado = numProc ? numProc.trim() : '';

  if (!procDigitado) {
    feedback.className = 'mt-2 small alert alert-warning py-1 px-2 mb-0';
    feedback.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-1"></i> Por favor, informe o número do processo.';
    processoValidoConfirmado = false;
    return false;
  }

  // Remove pontos, barras, hífens e espaços para comparação exata de dígitos
  const normalizar = (txt) => String(txt || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const procLimpo = normalizar(procDigitado);

  let encontrado = false;
  let detalheEncontrado = '';

  // 1. BUSCA NA TABELA DE DETALHAMENTO/DASHBOARD (Se o processo estiver visível na página)
  const linhasTabela = document.querySelectorAll('#tbodyDetalhamentoProcessos tr, .table tr, #gridTiposEntrada .card');
  linhasTabela.forEach(linha => {
    const textoLinha = normalizar(linha.innerText);
    if (textoLinha.includes(procLimpo)) {
      encontrado = true;
      detalheEncontrado = 'Localizado no Dashboard';
    }
  });

  // 2. BUSCA NO TEXTO GERAL DO DOCUMENTO (Caso esteja em outro elemento da tela)
  if (!encontrado) {
    const textoPagina = normalizar(document.body.innerText);
    if (textoPagina.includes(procLimpo)) {
      encontrado = true;
      detalheEncontrado = 'Localizado nos registros da página';
    }
  }

  // 3. BUSCA EM VARIÁVEIS GLOBAIS NO WINDOW (Varre arrays do sistema)
  if (!encontrado) {
    for (let chave in window) {
      try {
        if (Array.isArray(window[chave]) && window[chave].length > 0) {
          const item = window[chave].find(elem => {
            const strElem = normalizar(JSON.stringify(elem));
            return strElem.includes(procLimpo);
          });
          if (item) {
            encontrado = true;
            detalheEncontrado = 'Localizado na memória do sistema';
            break;
          }
        }
      } catch (e) {
        // Ignora objetos com restrição de acesso
      }
    }
  }

  // --- RESULTADO DA VALIDAÇÃO ---
  if (encontrado) {
    processoValidoConfirmado = true;
    feedback.className = 'mt-2 small alert alert-success py-1 px-2 mb-0';
    feedback.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i> <strong>Processo Localizado!</strong> (${detalheEncontrado})`;
    
    // Desativa a obrigatoriedade dos campos da Etapa 1 para não travar o envio
    removerObrigatoriedadeEtapa1();
    return true;
  } else {
    processoValidoConfirmado = false;
    feedback.className = 'mt-2 small alert alert-danger py-1 px-2 mb-0';
    feedback.innerHTML = `<i class="fa-solid fa-circle-xmark me-1"></i> <strong>Processo não localizado!</strong> Verifique o número ou cadastre-o na <strong>Etapa 1</strong>.`;
    return false;
  }
}

/**
 * Remove a exigência dos campos da Etapa 1 quando o anexo for feito diretamente
 */
function removerObrigatoriedadeEtapa1() {
  const inputDataEnvio = document.getElementById('inputDataEnvio');
  const selectTipoEntrada = document.getElementById('selectTipoEntrada');

  if (inputDataEnvio) inputDataEnvio.removeAttribute('required');
  if (selectTipoEntrada) selectTipoEntrada.removeAttribute('required');
}