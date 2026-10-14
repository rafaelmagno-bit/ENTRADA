/**
 * GeminiService.gs - Leitura Inteligente via Gemini REST API
 */

const SCHEMAS_FORMULARIO = {
  "Empenho": {
    "type": "OBJECT",
    "properties": {
      "nome_responsavel": { "type": "string", "description": "Nome completo do servidor responsável pelo bem" },
      "siape_responsavel": { "type": "string", "description": "Matrícula SIAPE do servidor responsável" },
      "cpf_responsavel": { "type": "string", "description": "CPF do servidor responsável" },
      "telefone_responsavel": { "type": "string", "description": "Telefone ou ramal de contato do responsável" },
      "email_responsavel": { "type": "string", "description": "E-mail institucional ou pessoal do responsável" },
      "unidade_responsavel": { "type": "string", "description": "Unidade, setor, departamento ou laboratório do responsável" },
      "contato_etiquetagem": { "type": "string", "description": "Nome, telefone e e-mail da pessoa que pode ser procurada pela equipe de fixação de etiquetas" },
      "descricao_bens": { "type": "string", "description": "Descrição detalhada dos bens constantes no documento de tombamento" },
      "marca": { "type": "string", "description": "Marca do fabricante do bem/equipamento" },
      "modelo": { "type": "string", "description": "Modelo ou versão do equipamento" },
      "garantia": { "type": "string", "description": "Prazo, tempo ou condições de garantia descritas no empenho" },
      "localizacao_bem": { "type": "string", "description": "Local físico exato (sala, bloco, campus) onde o bem ficará alocado" }
    }
  },
  "Edital Interno": {
    "type": "OBJECT",
    "properties": {
      "empenho": "Número do empenho ou nota de empenho",
      "ug_empenho": "UG (Unidade Gestora) responsável pelo empenho",
      "titulo_edital": "Título do edital interno",
      "numero_edital": "Número do edital interno",
      "nome_responsavel": "Nome completo do servidor responsável pelo bem",
      "siape_responsavel": "Número de matrícula SIAPE do responsável",
      "cpf_responsavel": "Número do CPF do responsável",
      "telefone_responsavel": "Telefone de contato do responsável",
      "email_responsavel": "E-mail de contato do responsável",
      "unidade_responsavel": "Unidade / Departamento institucional do responsável",
      "localizacao_bens": "Localização onde os bens serão alocados (Ex: Sala, Bloco, Laboratório)",
      "contato_etiquetagem": { "type": "string", "description": "Nome, telefone e e-mail da pessoa que pode ser procurada pela equipe de fixação de etiquetas" },
      "item_solicitado": "Descrição simplificada do que está sendo solicitado para tombar (Ex: Cadeira, Computador)",
      "marca": "Marca do bem ou 'Sem marca' se não houver",
      "modelo": "Modelo ou versão específica do bem",
      "periodo_garantia": "Período de vigência da garantia do material"
    }
  },
  "CNPQ": {
  "type": "OBJECT",
  "properties": {
    "titulo_edital": { "type": "STRING", "description": "Título do edital interno" },
    "numero_edital": { "type": "STRING", "description": "Número do edital interno" },
    "nome_responsavel": { "type": "STRING", "description": "Nome completo do servidor responsável pelo bem" },
    "siape_responsavel": { "type": "STRING", "description": "Número de matrícula SIAPE do responsável" },
    "cpf_responsavel": { "type": "STRING", "description": "Número do CPF do responsável" },
    "telefone_responsavel": { "type": "STRING", "description": "Telefone de contato do responsável" },
    "email_responsavel": { "type": "STRING", "description": "E-mail de contato do responsável" },
    "unidade_responsavel": { "type": "STRING", "description": "Unidade / Departamento institucional do responsável" },
    "localizacao_bens": { "type": "STRING", "description": "Localização onde os bens serão alocados (Ex: Sala, Bloco, Laboratório)" },
    "contato_etiquetagem": { "type": "STRING", "description": "Nome, telefone e e-mail da pessoa para fixação de etiquetas" },
    "item_solicitado": { "type": "STRING", "description": "Descrição simplificada do item solicitado (Ex: Cadeira, Computador)" },
    "marca": { "type": "STRING", "description": "Marca do bem" },
    "modelo": { "type": "STRING", "description": "Modelo ou versão específica do bem" },
    "periodo_garantia": { "type": "STRING", "description": "Período de vigência da garantia do material" }
  }
},
"FACEPE": {
  "type": "OBJECT",
  "properties": {
    "titulo_edital": { "type": "STRING", "description": "Título do edital interno" },
    "numero_edital": { "type": "STRING", "description": "Número do edital interno" },
    "nome_responsavel": { "type": "STRING", "description": "Nome completo do servidor responsável pelo bem" },
    "siape_responsavel": { "type": "STRING", "description": "Número de matrícula SIAPE do responsável" },
    "cpf_responsavel": { "type": "STRING", "description": "Número do CPF do responsável" },
    "telefone_responsavel": { "type": "STRING", "description": "Telefone de contato do responsável" },
    "email_responsavel": { "type": "STRING", "description": "E-mail de contato do responsável" },
    "unidade_responsavel": { "type": "STRING", "description": "Unidade / Departamento institucional do responsável" },
    "localizacao_bens": { "type": "STRING", "description": "Localização onde os bens serão alocados (Ex: Sala, Bloco, Laboratório)" },
    "contato_etiquetagem": { "type": "STRING", "description": "Nome, telefone e e-mail da pessoa para fixação de etiquetas" },
    "item_solicitado": { "type": "STRING", "description": "Descrição simplificada do item solicitado (Ex: Cadeira, Computador)" },
    "marca": { "type": "STRING", "description": "Marca do bem" },
    "modelo": { "type": "STRING", "description": "Modelo ou versão específica do bem" },
    "periodo_garantia": { "type": "STRING", "description": "Período de vigência da garantia do material" }
  }
},
  "FADE": {
    "type": "ARRAY",
    "items": {
      "type": "OBJECT",
      "properties": {
        "ttp": { "type": "STRING", "description": "Número do Termo de Transferência (TTP)" },
        "fornecedor": { "type": "STRING", "description": "Nome do fornecedor" },
        "descricao": { "type": "STRING", "description": "Descrição resumida do bem" },
        "nome_do_responsavel": { "type": "STRING", "description": "Nome do responsável" },
        "quantidade": { "type": "STRING", "description": "Quantidade total de bens" }
      }
    }
  },
  "Nota Fiscal": {
    "type": "OBJECT",
    "properties": {
      // Bloco 1: Dados da Nota
      "numero_nota": { "type": "STRING", "description": "Número ou série da Nota Fiscal" },
      "nome_fornecedor": { "type": "STRING", "description": "Razão social ou nome do fornecedor/emitente" },
      "cnpj_fornecedor": { "type": "STRING", "description": "CNPJ do fornecedor" },
      "natureza_operacao": { "type": "STRING", "description": "Descrição da Natureza da Operação" },
      "data_emissao": { "type": "STRING", "description": "Data de emissão da Nota Fiscal" },

      // Bloco 2: Valores da Nota Fiscal
      "valor_frete": { "type": "STRING", "description": "Valor total do frete" },
      "valor_desconto": { "type": "STRING", "description": "Valor total do desconto" },
      "valor_ipi": { "type": "STRING", "description": "Valor total do IPI na nota" },
      "valor_total_nota": { "type": "STRING", "description": "Valor total da Nota Fiscal" },

      // Bloco 3: Dados do Produto (Lista de Itens)
      "itens": {
        "type": "ARRAY",
        "description": "Lista de produtos ou serviços da Nota Fiscal",
        "items": {
          "type": "OBJECT",
          "properties": {
            "descricao": { "type": "STRING", "description": "Descrição detalhada do produto/item" },
            "quantidade": { "type": "STRING", "description": "Quantidade do produto" },
            "valor_unitario": { "type": "STRING", "description": "Valor unitário" },
            "valor_total": { "type": "STRING", "description": "Valor total do item" },
            "valor_ipi_item": { "type": "STRING", "description": "Valor do IPI específico deste item" }
          }
        }
      }
    }
  }
};

/**
 * Função principal consumida pelo EntradaBensService.gs
 */
function extrairDadosComGemini(base64Data, mimeType, tipoEntrada, processo) {
  return analisarDocumentoComGemini(base64Data, tipoEntrada, processo, mimeType);
}

/**
 * Envia o PDF em Base64 usando parsing de prompt e extração adaptativa por Regex,
 * priorizando os modelos mais recentes da série Gemini 3.x (Fallback).
 */
function analisarDocumentoComGemini(base64Data, tipoSolicitacao, processo, mimeType) {
  // Lista dos modelos Gemini 3.x em ordem de prioridade
  const modelosParaTestar = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash"
  ];

  const schemaKey = SCHEMAS_FORMULARIO[tipoSolicitacao] ? tipoSolicitacao : "Empenho";
  const schema = SCHEMAS_FORMULARIO[schemaKey];

  // Limpa o cabeçalho base64 do frontend
  let base64Limpo = base64Data || "";
  if (base64Limpo.includes(",")) {
    base64Limpo = base64Limpo.split(",")[1];
  }

  // Trata as variáveis com antecedência
  const procTexto = processo ? "Processo " + processo + " - " : "";
  const tipoTexto = tipoSolicitacao ? tipoSolicitacao : "Documento";

  const ehArray = schema.type === "ARRAY";
  let promptTexto = "";

  if (ehArray) {
    const chavesItem = Object.keys(schema.items.properties);
    promptTexto = "Você é um leitor de documentos institucional profissional. Analise o arquivo PDF anexado (" + procTexto + "documento de " + tipoTexto + ") e extraia a lista de itens mapeados.\n" +
      "Sua resposta DEVE conter estritamente e apenas o formato de uma LISTA/ARRAY JSON válido: [ { ... }, { ... } ] (sem qualquer texto adicional, introdução ou blocos markdown de código).\n\n" +
      "Para CADA ITEM ou sub-item identificado no documento, crie um objeto dentro da lista mapeando as informações usando exatamente estas chaves:\n" +
      JSON.stringify(chavesItem, null, 2) + "\n\n" +
      "Atenção: O campo \"ttp\" é global do documento e deve ser repetido em todos os itens da lista. Baseie-se unicamente no conteúdo factual visível no PDF.";
  } else {
    promptTexto = "Você é um leitor de documentos institucional profissional. Analise o arquivo anexado (" + procTexto + "documento de " + tipoTexto + "), extraia as informações e monte um objeto JSON estruturado.\n" +
      "Sua resposta DEVE conter estritamente e apenas o formato de um objeto JSON válido (sem qualquer texto adicional, introdução ou blocos markdown de código).\n\n" +
      "Mapeie as informações respeitando exatamente esta estrutura e sub-estruturas:\n" +
      JSON.stringify(schema.properties, null, 2) + "\n\n" +
      "Regra: Quando o esquema incluir uma lista/array (como 'itens'), extraia TODOS os produtos/serviços listados na Nota Fiscal para dentro desse array. Baseie-se unicamente no conteúdo factual visível no arquivo.";
  }

  const payload = {
    "contents": [{
      "parts": [
        {
          "inlineData": {
            "mimeType": mimeType || "application/pdf",
            "data": base64Limpo
          }
        },
        {
          "text": promptTexto
        }
      ]
    }],
    "generationConfig": {
      "temperature": 0.1
    }
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  // Função interna de sanitização de metadados
  const limparValoresBrutos = (obj) => {
    const novoObj = {};
    for (let chave in obj) {
      if (obj.hasOwnProperty(chave)) {
        let valor = obj[chave];
        if (Array.isArray(valor)) {
          novoObj[chave] = valor.map(item => typeof item === 'object' ? limparValoresBrutos(item) : String(item));
        } else if (valor && typeof valor === 'object') {
          novoObj[chave] = valor.value || valor.text || "Não informado";
        } else {
          novoObj[chave] = valor !== undefined && valor !== null ? String(valor) : "Não informado";
        }
      }
    }
    return novoObj;
  };

  let ultimoErro = "";

  // Loop de Fallback testando os modelos Gemini 3.x em ordem
  for (let i = 0; i < modelosParaTestar.length; i++) {
    const modelName = modelosParaTestar[i];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

    Logger.log(`[Gemini API] Tentando análise (${i + 1}/${modelosParaTestar.length}) com modelo: ${modelName}`);

    try {
      const response = UrlFetchApp.fetch(url, options);
      const responseText = response.getContentText();
      const jsonResponse = JSON.parse(responseText);

      // Se a API retornou um erro
      if (jsonResponse.error) {
        ultimoErro = "API Gemini [" + (jsonResponse.error.code || 400) + "]: " + jsonResponse.error.message;
        Logger.log(`[Gemini API] Falha no modelo ${modelName}: ${ultimoErro}`);
        continue; // Tenta o próximo modelo da lista
      }

      // Se retornou conteúdo com texto
      if (jsonResponse.candidates && jsonResponse.candidates[0] && jsonResponse.candidates[0].content && jsonResponse.candidates[0].content.parts && jsonResponse.candidates[0].content.parts[0].text) {
        let textoLimpo = jsonResponse.candidates[0].content.parts[0].text.trim();

        // Isolamento adaptativo de Objetos { ... } ou Arrays [ ... ]
        const regexIsolar = ehArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
        const matchJson = textoLimpo.match(regexIsolar);
        if (matchJson) {
          textoLimpo = matchJson[0];
        }

        const objetoIA = JSON.parse(textoLimpo);

        if (ehArray && Array.isArray(objetoIA)) {
          Logger.log(`[Gemini API] Sucesso na leitura usando o modelo: ${modelName}`);
          return objetoIA.map(item => limparValoresBrutos(item));
        } else if (!ehArray) {
          Logger.log(`[Gemini API] Sucesso na leitura usando o modelo: ${modelName}`);
          return limparValoresBrutos(objetoIA);
        } else {
          ultimoErro = "O modelo " + modelName + " não retornou o formato estruturado esperado.";
          Logger.log(`[Gemini API] ${ultimoErro}`);
          continue;
        }
      } else {
        ultimoErro = "O modelo " + modelName + " não retornou bloco de texto legível.";
        Logger.log(`[Gemini API] ${ultimoErro}`);
        continue;
      }
    } catch (error) {
      ultimoErro = error.message || error.toString();
      Logger.log(`[Gemini API] Exceção ao executar modelo ${modelName}: ${ultimoErro}`);
    }
  }

  Logger.log("Erro crítico na API do Gemini: Todos os modelos falharam.");
  throw new Error("Não foi possível analisar o documento. " + (ultimoErro ? "Motivo: " + ultimoErro : ""));
}