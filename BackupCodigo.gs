/**
 * Atualiza automaticamente a aba 'CODIGO_APPSCRIPT' com todos os arquivos do projeto
 * utilizando a Google Drive API (disponível por padrão sem bloqueios do GCP).
 */
function atualizarAbaCodigo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaNome = "CODIGO_APPSCRIPT";
  var aba = ss.getSheetByName(abaNome);
  
  // Cria a aba se não existir
  if (!aba) {
    aba = ss.insertSheet(abaNome);
  } else {
    aba.clearContents();
  }
  
  // Cabeçalho da tabela
  aba.getRange("A1:D1").setValues([["Nome_Arquivo", "Tipo", "Conteudo", "Ultima_Atualizacao"]]);
  aba.getRange("A1:D1").setFontWeight("bold").setBackground("#D9EAD3");
  
  var scriptId = ScriptApp.getScriptId();
  var options = {
    method: "get",
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  };
  
  // 1. Consulta metadados do projeto no Google Drive (API v2)
  var urlMeta = "https://www.googleapis.com/drive/v2/files/" + scriptId;
  var resMeta = UrlFetchApp.fetch(urlMeta, options);
  var metaData = JSON.parse(resMeta.getContentText());
  
  if (metaData.error) {
    SpreadsheetApp.getUi().alert("Erro no Drive: " + metaData.error.message);
    return;
  }
  
  // 2. Obtém a URL de exportação do código em JSON
  var exportUrl = metaData.exportLinks ? metaData.exportLinks["application/vnd.google-apps.script+json"] : null;
  if (!exportUrl) {
    exportUrl = "https://www.googleapis.com/drive/v2/files/" + scriptId + "?alt=media";
  }
  
  // 3. Baixa o código-fonte de todos os arquivos
  var resContent = UrlFetchApp.fetch(exportUrl, options);
  var json = JSON.parse(resContent.getContentText());
  
  if (json.error) {
    SpreadsheetApp.getUi().alert("Erro ao ler código: " + json.error.message);
    return;
  }
  
  var files = json.files || [];
  var rows = [];
  var agora = new Date();
  
  files.forEach(function(file) {
    var tipo = file.type ? file.type.toUpperCase() : "SERVER_JS";
    var extensao = (tipo === "SERVER_JS" || tipo === "JS") ? ".gs" : ".html";
    var nomeComExtensao = file.name.indexOf(".") === -1 ? file.name + extensao : file.name;
    
    rows.push([nomeComExtensao, tipo, file.source || "", agora]);
  });
  
  if (rows.length > 0) {
    aba.getRange(2, 1, rows.length, 4).setValues(rows);
    SpreadsheetApp.getUi().alert("✅ Sucesso! " + rows.length + " arquivos foram salvos na aba '" + abaNome + "'.");
  } else {
    SpreadsheetApp.getUi().alert("Nenhum arquivo retornado.");
  }
}

/**
 * Cria um menu na própria planilha para atualizar com 1 clique
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🔄 Backup Código")
    .addItem("Atualizar aba CODIGO_APPSCRIPT", "atualizarAbaCodigo")
    .addToUi();
}