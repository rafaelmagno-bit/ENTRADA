/**
 * DriveService.gs - Leitura, Gravacao de Arquivos no Google Drive e Banco de Dados (Planilha)
 */

/**
 * Funcao auxiliar para salvar qualquer arquivo no Google Drive
 */
function salvarArquivoDrive(fileBase64, mimeType, fileName, subpastaPrefix) {
  const bytes = Utilities.base64Decode(fileBase64.split(',')[1] || fileBase64);
  const blob = Utilities.newBlob(bytes, mimeType || "application/pdf", fileName);
  
  let folder = DriveApp.getRootFolder();
  if (CONFIG.DRIVE_FOLDER_ID) {
    try {
      folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    } catch(e) {
      Logger.log("Pasta nao encontrada no ID fornecido, usando raiz do Drive.");
    }
  }

  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  const cleanPrefix = (subpastaPrefix || "DOC").replace(/[^a-zA-Z0-9]/g, '_');
  file.setName(`[${cleanPrefix}]_${fileName}`);
  
  return {
    id: file.getId(),
    url: file.getUrl()
  };
}

/**
 * Grava uma nova Solicitacao de Tombamento na aba "Solicitacoes_Tombamento"
 */
function salvarSolicitacaoTombamentoServidor(payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let aba = ss.getSheetByName("Solicitacoes_Tombamento");
    
    // Cria a aba e cabecalhos se nao existir
    if (!aba) {
      aba = ss.insertSheet("Solicitacoes_Tombamento");
      aba.appendRow([
        "ID_Solicitacao",
        "Numero_Processo",
        "Tipo_Entrada",
        "Dados_JSON",
        "URL_Arquivo_Drive",
        "Data_Hora",
        "Usuario"
      ]);
    }

    // Upload do arquivo da solicitacao no Drive se enviado
    let urlArquivo = "Sem anexo";
    if (payload.fileData && payload.fileData.base64) {
      const arqSalvo = salvarArquivoDrive(
        payload.fileData.base64,
        payload.fileData.mimeType,
        payload.fileData.fileName,
        "SOLICITACAO_" + payload.numProcesso
      );
      urlArquivo = arqSalvo.url;
    } else if (payload.fileUrl) {
      urlArquivo = payload.fileUrl;
    }

    const idSolicitacao = "SOL-" + new Date().getTime();
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    const usuarioEmail = Session.getActiveUser().getEmail() || "usuario_desconhecido";

    aba.appendRow([
      idSolicitacao,
      payload.numProcesso || "",
      payload.tipoEntrada || "",
      JSON.stringify(payload.dadosExtraidos || {}),
      urlArquivo,
      timestamp,
      usuarioEmail
    ]);

    return { 
      success: true, 
      idSolicitacao: idSolicitacao,
      numProcesso: payload.numProcesso,
      message: "Solicitacao de Tombamento gravada com sucesso!" 
    };

  } catch (err) {
    Logger.log("Erro ao salvar solicitacao: " + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Grava uma Nota Fiscal na aba "Notas_Fiscais" vinculada ao Processo
 */
function salvarNotaFiscalServidor(payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let aba = ss.getSheetByName("Notas_Fiscais");
    
    // Cria a aba e cabecalhos se nao existir
    if (!aba) {
      aba = ss.insertSheet("Notas_Fiscais");
      aba.appendRow([
        "ID_Nota",
        "Numero_Processo",
        "ID_Solicitacao_Vinculada",
        "Dados_NF_JSON",
        "URL_Nota_Drive",
        "Data_Hora",
        "Usuario"
      ]);
    }

    // Upload da Nota Fiscal no Drive se enviado
    let urlNota = "Sem anexo";
    if (payload.notaFiscalFile) {
      const arqSalvo = salvarArquivoDrive(
        payload.notaFiscalFile,
        "application/pdf",
        payload.notaFiscalName || "Nota_Fiscal.pdf",
        "NF_" + payload.numProcesso
      );
      urlNota = arqSalvo.url;
    }

    const idNota = "NF-" + new Date().getTime();
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    const usuarioEmail = Session.getActiveUser().getEmail() || "usuario_desconhecido";

    aba.appendRow([
      idNota,
      payload.numProcesso || "",
      payload.idSolicitacaoVinculada || "Geral",
      JSON.stringify(payload.dadosExtraidos || payload.dadosNF || {}),
      urlNota,
      timestamp,
      usuarioEmail
    ]);

    return { 
      success: true, 
      idNota: idNota,
      numProcesso: payload.numProcesso,
      message: "Nota Fiscal registrada com sucesso!" 
    };

  } catch (err) {
    Logger.log("Erro ao salvar Nota Fiscal: " + err.toString());
    return { success: false, error: err.toString() };
  }
}

