/**
 * Router.gs - Roteamento HTTP e carregamento modular de templates
 */
function doGet() {
  // Use createTemplateFromFile (e NÃO createHtmlOutputFromFile)
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('CBMAC — UFPE | Entrada de Bens')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}