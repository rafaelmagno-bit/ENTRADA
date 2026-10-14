/**
 * Obtém métricas e lista detalhada de processos agrupados por Tipo de Entrada e Status de NF
 */
function obterDadosDashboardEntradas() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const abaSolicitacoes = ss.getSheetByName("Solicitacoes_Tombamento") || ss.getSheetByName("Solicitacoes");
    const abaNFs = ss.getSheetByName("Notas_Fiscais");
    const abaProcessados = ss.getSheetByName("Processados") || ss.getSheetByName("Bens_Processados");

    // Lista oficial atualizada dos 9 Tipos de Entrada
    const listaTiposOficiais = [
      "Empenho",
      "Edital Interno",
      "FAD",
      "CNPq",
      "FASEP",
      "Doação",
      "Pré-existente",
      "FAPESP",
      "Outros Fomentos"
    ];

    // Estruturas de métricas e coleções de itens para a modal
    const metricas = {};
    const detalhesPorTipo = {};

    listaTiposOficiais.forEach(tipo => {
      metricas[tipo] = { totalProcessos: 0, semNF: 0, comNF: 0, processados: 0 };
      detalhesPorTipo[tipo] = { SEM_NF: [], COM_NF: [], PROCESSADOS: [] };
    });

    if (!abaSolicitacoes) {
      Logger.log("ERRO: Aba 'Solicitacoes_Tombamento' não foi encontrada.");
      return { metricasPorTipo: metricas, detalhesPorTipo: detalhesPorTipo, entradasRecentes: [] };
    }

    // 1. Mapear Notas Fiscais Existentes
    const processosComNF = new Set();
    const idsSolicitacaoComNF = new Set();

    if (abaNFs) {
      const dadosNFs = abaNFs.getDataRange().getValues();
      for (let i = 1; i < dadosNFs.length; i++) {
        const procNF = String(dadosNFs[i][1] || '').trim();
        const idSolVinculada = String(dadosNFs[i][2] || '').trim();

        if (procNF) processosComNF.add(normalizarTextoProcesso(procNF));
        if (idSolVinculada) idsSolicitacaoComNF.add(idSolVinculada);
      }
    }

    // 2. Mapear Processos Concluídos/Processados
    const processosConcluidos = new Set();
    if (abaProcessados) {
      const dadosProc = abaProcessados.getDataRange().getValues();
      for (let i = 1; i < dadosProc.length; i++) {
        const procDone = String(dadosProc[i][1] || '').trim();
        if (procDone) processosConcluidos.add(normalizarTextoProcesso(procDone));
      }
    }

    // 3. Processar Solicitações de Tombamento
    const dadosSol = abaSolicitacoes.getDataRange().getValues();
    const entradasRecentes = [];

    for (let i = dadosSol.length - 1; i >= 1; i--) {
      const linha = dadosSol[i];
      const idSolicitacao = String(linha[0] || '').trim();
      const numProcesso = String(linha[1] || '').trim();
      const tipoEntradaBruto = String(linha[2] || '').trim();
      const dataHora = linha[5] ? Utilities.formatDate(new Date(linha[5]), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm") : "-";

      if (!idSolicitacao && !numProcesso) continue;

      const tipoCategoria = identificarTipoEntrada(tipoEntradaBruto, listaTiposOficiais);
      const procLimpo = normalizarTextoProcesso(numProcesso);
      const temNF = idsSolicitacaoComNF.has(idSolicitacao) || (procLimpo && processosComNF.has(procLimpo));
      const estaProcessado = procLimpo && processosConcluidos.has(procLimpo);

      metricas[tipoCategoria].totalProcessos++;

      let statusChave = "SEM_NF";
      let statusTexto = "Sem Nota Fiscal";
      let statusBadge = "bg-danger";

      if (estaProcessado) {
        statusChave = "PROCESSADOS";
        statusTexto = "Processado";
        statusBadge = "bg-success";
        metricas[tipoCategoria].processados++;
      } else if (temNF) {
        statusChave = "COM_NF";
        statusTexto = "Com Nota Fiscal";
        statusBadge = "bg-warning text-dark";
        metricas[tipoCategoria].comNF++;
      } else {
        metricas[tipoCategoria].semNF++;
      }

      // Adiciona o item ao grupo correspondente para exibição na modal
      const itemDetalhe = {
        idSolicitacao: idSolicitacao,
        processo: numProcesso || "S/N",
        tipoEntrada: tipoCategoria,
        dataHora: dataHora,
        statusTexto: statusTexto,
        statusBadge: statusBadge
      };

      detalhesPorTipo[tipoCategoria][statusChave].push(itemDetalhe);

      if (entradasRecentes.length < 10) {
        entradasRecentes.push(itemDetalhe);
      }
    }

    return {
      metricasPorTipo: metricas,
      detalhesPorTipo: detalhesPorTipo,
      entradasRecentes: entradasRecentes
    };

  } catch (erro) {
    Logger.log("Erro ao obter dados do Dashboard: " + erro.toString());
    throw new Error("Erro na consolidação do Dashboard: " + erro.message);
  }
}

/**
 * Mapeia e identifica com precisão o tipo de entrada oficial
 */
function identificarTipoEntrada(tipoBruto, listaOficial) {
  if (!tipoBruto) return "Outros Fomentos";

  const tLimpo = tipoBruto.toLowerCase().trim();

  if (tLimpo.includes("cnpq")) return "CNPq";
  if (tLimpo.includes("edital interno")) return "Edital Interno";
  if (tLimpo.includes("facepe")) return "FACEPE";
  if (tLimpo.includes("fapesp")) return "FAPESP";
  if (tLimpo.includes("doacao") || tLimpo.includes("doação")) return "Doação";
  if (tLimpo.includes("pre-existente") || tLimpo.includes("pré-existente") || tLimpo.includes("preexistente")) return "Pré-existente";
  if (tLimpo.includes("fade") || tLimpo.includes("fade")) return "FADE";
  if (tLimpo.includes("empenho")) return "Empenho";

  return "Outros Fomentos";
}

function normalizarTextoProcesso(proc) {
  return String(proc || '').replace(/\D/g, '');
}