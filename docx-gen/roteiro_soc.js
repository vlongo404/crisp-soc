const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  PageNumber, Header, Footer, LevelFormat
} = require('docx');
const fs = require('fs');

// ── Colors ──────────────────────────────────────────────────────
const FORTINET_RED  = "DA291C";
const DARK_BG       = "1A1A2E";
const ACCENT_BLUE   = "3B82F6";
const LIGHT_GRAY    = "F5F5F5";
const MID_GRAY      = "E0E0E0";
const TEXT_DARK     = "1A1A2E";
const MUTED         = "6B7280";
const WHITE         = "FFFFFF";
const SPEAKER1_CLR  = "1D4ED8";  // Marco - azul
const SPEAKER2_CLR  = "15803D";  // Pessoa 2 - verde

// ── Helpers ──────────────────────────────────────────────────────
const border  = (color="CCCCCC") => ({ style: BorderStyle.SINGLE, size: 1, color });
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: "FFFFFF" });

function heading2(text, color=FORTINET_RED) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color, font: "Arial" })],
    spacing: { before: 300, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: MID_GRAY } },
  });
}

function spacer(n=1) {
  return Array.from({length:n}, () =>
    new Paragraph({ children: [new TextRun("")], spacing: { before: 60, after: 60 } })
  );
}

function infoBox(text, bgColor=LIGHT_GRAY, borderColor=ACCENT_BLUE) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: {
          top:    { style: BorderStyle.SINGLE, size: 3, color: borderColor },
          bottom: { style: BorderStyle.SINGLE, size: 3, color: borderColor },
          left:   { style: BorderStyle.SINGLE, size: 8, color: borderColor },
          right:  { style: BorderStyle.SINGLE, size: 3, color: borderColor },
        },
        width: { size: 9360, type: WidthType.DXA },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        children: [new Paragraph({
          children: [new TextRun({ text, size: 22, font: "Arial", color: TEXT_DARK, italics: true })]
        })],
      })]
    })]
  });
}

function speakerBlock(who, color, time, lines) {
  const bs = { style: BorderStyle.SINGLE, size: 1, color };
  const allBorders = { top: bs, bottom: bs, left: bs, right: bs };
  const cellMargins = { top: 100, bottom: 100, left: 160, right: 160 };

  const headerRow = new TableRow({
    children: [
      new TableCell({
        borders: {
          top:    { style: BorderStyle.SINGLE, size: 2, color },
          bottom: noBorder(),
          left:   { style: BorderStyle.SINGLE, size: 2, color },
          right:  noBorder(),
        },
        width: { size: 5000, type: WidthType.DXA },
        shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({
          children: [new TextRun({ text: who, bold: true, size: 22, color, font: "Arial" })]
        })],
      }),
      new TableCell({
        borders: {
          top:   { style: BorderStyle.SINGLE, size: 2, color },
          bottom: noBorder(),
          left:   noBorder(),
          right:  { style: BorderStyle.SINGLE, size: 2, color },
        },
        width: { size: 4360, type: WidthType.DXA },
        shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: `⏱ ${time}`, size: 20, color: MUTED, font: "Arial" })]
        })],
      }),
    ]
  });

  const textRows = lines.map((line, i) => {
    const isLast = i === lines.length - 1;
    return new TableRow({
      children: [new TableCell({
        columnSpan: 2,
        borders: {
          top:    noBorder(),
          bottom: isLast ? { style: BorderStyle.SINGLE, size: 2, color } : noBorder(),
          left:   { style: BorderStyle.SINGLE, size: 2, color },
          right:  { style: BorderStyle.SINGLE, size: 2, color },
        },
        width: { size: 9360, type: WidthType.DXA },
        margins: { top: isLast ? 60 : 40, bottom: isLast ? 100 : 40, left: 200, right: 200 },
        children: [new Paragraph({
          children: [new TextRun({ text: line, size: 22, font: "Arial", color: TEXT_DARK })]
        })],
      })],
    });
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [5000, 4360],
    rows: [headerRow, ...textRows],
  });
}

function timelineRow(time, activity, speaker, color) {
  const bs = (c) => ({ style: BorderStyle.SINGLE, size: 1, color: c });
  return new TableRow({
    children: [
      new TableCell({
        borders: { top: bs("CCCCCC"), bottom: bs("CCCCCC"), left: bs("CCCCCC"), right: bs("CCCCCC") },
        width: { size: 1400, type: WidthType.DXA },
        shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: time, bold: true, size: 20, font: "Arial", color: FORTINET_RED })]
        })],
      }),
      new TableCell({
        borders: { top: bs("CCCCCC"), bottom: bs("CCCCCC"), left: bs("CCCCCC"), right: bs("CCCCCC") },
        width: { size: 5560, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          children: [new TextRun({ text: activity, size: 22, font: "Arial", color: TEXT_DARK })]
        })],
      }),
      new TableCell({
        borders: { top: bs("CCCCCC"), bottom: bs("CCCCCC"), left: bs("CCCCCC"), right: bs("CCCCCC") },
        width: { size: 2400, type: WidthType.DXA },
        shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: speaker, bold: true, size: 20, font: "Arial", color })]
        })],
      }),
    ]
  });
}

// ═══════════════════════════════════════════════════════════════
// DOCUMENT
// ═══════════════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: FORTINET_RED } },
          children: [
            new TextRun({ text: "CRISP NG-SOC Platform  |  ", bold: true, size: 18, font: "Arial", color: FORTINET_RED }),
            new TextRun({ text: "Roteiro — Demo Técnica 10 min  |  Fortinet", size: 18, font: "Arial", color: MUTED }),
          ],
          alignment: AlignmentType.LEFT,
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: MID_GRAY } },
          children: [
            new TextRun({ text: "Confidencial — Uso Interno  |  Página ", size: 16, font: "Arial", color: MUTED }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: MUTED }),
          ],
          alignment: AlignmentType.CENTER,
        })]
      })
    },
    children: [

      // ── CAPA ──────────────────────────────────────────────────
      ...spacer(2),
      new Paragraph({
        children: [new TextRun({ text: "CRISP NG-SOC Platform", bold: true, size: 72, font: "Arial", color: FORTINET_RED })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 480, after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Roteiro — Demonstração Técnica (10 min)", size: 36, font: "Arial", color: TEXT_DARK })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: FORTINET_RED } },
        children: [new TextRun("")],
        spacing: { before: 60, after: 60 },
      }),
      ...spacer(1),
      new Paragraph({
        children: [new TextRun({ text: "Apresentação para Representantes Fortinet  —  2 Apresentadores", size: 24, font: "Arial", color: MUTED, italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
      }),
      ...spacer(1),
      // Legenda locutores
      new Table({
        width: { size: 6000, type: WidthType.DXA },
        columnWidths: [3000, 3000],
        rows: [new TableRow({
          children: [
            new TableCell({
              borders: { top: border(), bottom: border(), left: border(), right: border() },
              width: { size: 3000, type: WidthType.DXA },
              shading: { fill: "DBEAFE", type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Marco — Apresentador Principal", bold: true, size: 20, font: "Arial", color: SPEAKER1_CLR })]
              })],
            }),
            new TableCell({
              borders: { top: border(), bottom: border(), left: border(), right: border() },
              width: { size: 3000, type: WidthType.DXA },
              shading: { fill: "DCFCE7", type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Pessoa 2 — Técnico / Arquitetura", bold: true, size: 20, font: "Arial", color: SPEAKER2_CLR })]
              })],
            }),
          ]
        })]
      }),
      ...spacer(3),

      // ── VÍDEO 1 HEADER ────────────────────────────────────────
      new Paragraph({
        shading: { fill: DARK_BG, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "  VÍDEO 1 — DEMONSTRAÇÃO TÉCNICA  |  10 MINUTOS  |  2 APRESENTADORES", bold: true, size: 36, font: "Arial", color: WHITE })],
        spacing: { before: 240, after: 240 },
      }),
      ...spacer(1),

      // ── TIMELINE ──────────────────────────────────────────────
      heading2("Estrutura de Tempo"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1400, 5560, 2400],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: { top: border(DARK_BG), bottom: border(DARK_BG), left: border(DARK_BG), right: border(DARK_BG) }, width: { size: 1400, type: WidthType.DXA }, shading: { fill: DARK_BG, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tempo", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
            new TableCell({ borders: { top: border(DARK_BG), bottom: border(DARK_BG), left: border(DARK_BG), right: border(DARK_BG) }, width: { size: 5560, type: WidthType.DXA }, shading: { fill: DARK_BG, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Conteúdo", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
            new TableCell({ borders: { top: border(DARK_BG), bottom: border(DARK_BG), left: border(DARK_BG), right: border(DARK_BG) }, width: { size: 2400, type: WidthType.DXA }, shading: { fill: DARK_BG, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Quem Fala", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
          ]}),
          timelineRow("0:00 – 1:00", "Abertura: o problema, apresentação do CRISP e da dupla", "Marco", SPEAKER1_CLR),
          timelineRow("1:00 – 3:30", "Arquitetura técnica: como o pipeline funciona por dentro", "Pessoa 2", SPEAKER2_CLR),
          timelineRow("3:30 – 5:30", "Demo ao vivo: dashboard + FortiGate em tempo real", "Marco", SPEAKER1_CLR),
          timelineRow("5:30 – 7:30", "Demo ao vivo: cenário de ataque — Ransomware", "Marco", SPEAKER1_CLR),
          timelineRow("7:30 – 9:00", "Diferenciais técnicos, stack e custo zero de licenças", "Pessoa 2", SPEAKER2_CLR),
          timelineRow("9:00 – 10:00", "Encerramento conjunto: convite para o pitch", "Marco + P2", SPEAKER1_CLR),
        ]
      }),
      ...spacer(2),

      // ── BLOCO 1: ABERTURA ─────────────────────────────────────
      heading2("BLOCO 1 — Abertura  (0:00 – 1:00)"),
      infoBox("Câmera dos dois ligada. Dashboard CRISP aberto em segundo plano. Marco apresenta a dupla rapidamente e entra no tema."),
      ...spacer(1),
      speakerBlock("Marco — Abertura", SPEAKER1_CLR, "0:00 – 1:00", [
        "Olá! Eu sou o [Marco] e esse é o [Pessoa 2]. Juntos desenvolvemos o CRISP —",
        "uma plataforma de SOC de próxima geração que vamos mostrar nos próximos 10 minutos.",
        "",
        "O problema que motivou esse projeto: empresas de médio porte têm dados de segurança",
        "espalhados em dezenas de ferramentas — firewall, endpoints, rede — e ninguém",
        "consegue ver o panorama completo em tempo real.",
        "",
        "O CRISP resolve isso: um painel único que une FortiGate, Wazuh, Zeek e",
        "CrowdStrike Falcon, analisa tudo com IA local e recomenda ações em segundos.",
        "",
        "Passa pra [Pessoa 2] explicar como isso funciona por dentro.",
      ]),
      ...spacer(2),

      // ── BLOCO 2: ARQUITETURA ──────────────────────────────────
      heading2("BLOCO 2 — Arquitetura Técnica  (1:00 – 3:30)"),
      infoBox("Pessoa 2 assume. Pode compartilhar tela com um diagrama ou apontar para o flow bar do dashboard. Fala com naturalidade técnica."),
      ...spacer(1),
      speakerBlock("Pessoa 2 — Arquitetura", SPEAKER2_CLR, "1:00 – 3:30", [
        "O CRISP tem cinco camadas integradas:",
        "",
        "Primeiro — o FortiGate. É o nosso firewall de borda. Capturamos sessões, políticas",
        "e tráfego em tempo real via API REST com autenticação por token Bearer.",
        "Os dados chegam a cada 15 segundos no dashboard automaticamente.",
        "",
        "Segundo — o Zeek NDR. Ele monitora o tráfego de rede e gera logs estruturados",
        "de conexões, DNS, HTTP, SSL e SSH. Esses logs fluem direto para o Wazuh via Filebeat.",
        "",
        "Terceiro — o Wazuh SIEM. Centraliza os alertas do FortiGate, Zeek e dos agentes",
        "instalados nos endpoints Windows. Nós escrevemos regras customizadas para ameaças",
        "específicas do ambiente — inclusive para detectar ransomware por padrão de arquivo.",
        "",
        "Quarto — o Ollama com LLaMA 3.1. Nossa IA roda 100% local — sem enviar nada para",
        "a nuvem. Ela recebe os eventos, identifica a técnica MITRE ATT&CK, classifica o risco",
        "e devolve a ação recomendada. Isso é fundamental para conformidade com a LGPD.",
        "",
        "Quinto — o dashboard CRISP. Interface unificada em tempo real que une tudo isso.",
        "Vou devolver pro Marco mostrar ao vivo.",
      ]),
      ...spacer(2),

      // ── BLOCO 3: DEMO DASHBOARD ───────────────────────────────
      heading2("BLOCO 3 — Demo ao Vivo: Dashboard + FortiGate  (3:30 – 5:30)"),
      infoBox("Marco compartilha tela com o dashboard aberto. Chips do header verdes: FortiGate Proxy e AI Pipeline ativos."),
      ...spacer(1),
      speakerBlock("Marco — Demo Dashboard", SPEAKER1_CLR, "3:30 – 5:30", [
        "Aqui está o dashboard CRISP rodando ao vivo agora.",
        "Notem os dois chips no topo: FortiGate Proxy — verde. AI Pipeline — verde.",
        "Tudo conectado e respondendo.",
        "",
        "[aponta para o card FortiGate]",
        "Dados reais do FortiGate 7.6.6 — IP 192.168.174.129.",
        "Estamos vendo os bytes recebidos e enviados acumulados, o throughput calculado",
        "a cada 15 segundos, e o status do link da interface port1.",
        "",
        "[aponta para o feed de eventos central]",
        "Aqui está o feed de eventos. Tudo que acontece na rede aparece aqui em ordem",
        "cronológica — FortiGate, Wazuh, Zeek e Falcon numa única linha do tempo.",
        "Qualquer analista abre isso e em segundos entende o estado da segurança da empresa.",
        "",
        "[clica no botão 'API FortiGate' ou aguarda atualização automática]",
        "O sistema sincroniza sozinho, mas podemos forçar uma atualização manual aqui.",
        "Em um incidente real, o analista quer dados frescos imediatamente.",
        "",
        "Agora vou mostrar o que acontece quando a [Pessoa 2] e eu simulamos um ataque real.",
      ]),
      ...spacer(2),

      // ── BLOCO 4: DEMO ATAQUE ──────────────────────────────────
      heading2("BLOCO 4 — Demo ao Vivo: Cenário Ransomware  (5:30 – 7:30)"),
      infoBox("Marco narra enquanto clica no botão Ransomware. Pessoa 2 pode comentar brevemente os detalhes técnicos que aparecerem no feed."),
      ...spacer(1),
      speakerBlock("Marco — Demo Ataque", SPEAKER1_CLR, "5:30 – 7:30", [
        "[clica no botão 'Ransomware' no demo bar]",
        "",
        "Estamos simulando uma infecção por ransomware na máquina WS-004.",
        "",
        "[aponta para o feed]",
        "Vejam o feed: o FortiGate detecta tráfego anômalo para IPs externos desconhecidos.",
        "O Wazuh correlaciona: 847 arquivos com extensão modificada em 23 segundos.",
        "",
        "[aponta para o banner vermelho]",
        "O banner de incidente ativo dispara automaticamente. O timer começa.",
        "",
        "[aponta para o painel de IA]",
        "A IA está processando... ela recebe os eventos reais do Wazuh,",
        "monta o prompt e envia para o Ollama rodando localmente aqui.",
        "",
        "[quando a resposta chegar — badge 'OLLAMA REAL']",
        "Vejam o badge: OLLAMA REAL. Não é simulação.",
        "O modelo identificou: LockBit 3.0, técnica T1486 — Data Encrypted for Impact,",
        "confiança alta. Recomendação: isolamento imediato do host via FortiNAC.",
      ]),
      ...spacer(1),
      speakerBlock("Pessoa 2 — Complemento Técnico", SPEAKER2_CLR, "7:00 – 7:30", [
        "O que acontece por baixo é: o Wazuh dispara a regra customizada de ransomware",
        "que escrevemos — baseada no padrão de rename em massa de arquivos.",
        "Isso aciona o playbook automatizado: detectar, alertar, análise de IA,",
        "isolamento via FortiNAC e bloqueio do C2 no FortiGate.",
        "Tudo isso em menos de 30 segundos após a primeira detecção.",
      ]),
      ...spacer(2),

      // ── BLOCO 5: DIFERENCIAIS ─────────────────────────────────
      heading2("BLOCO 5 — Diferenciais e Stack  (7:30 – 9:00)"),
      infoBox("Pessoa 2 fala para câmera. Dashboard visível ao fundo. Tom técnico mas acessível."),
      ...spacer(1),
      speakerBlock("Pessoa 2 — Diferenciais", SPEAKER2_CLR, "7:30 – 9:00", [
        "Três diferenciais principais do CRISP:",
        "",
        "Primeiro: IA local com Ollama. Os dados de segurança da empresa nunca saem da empresa.",
        "Conformidade total com LGPD. Nenhum dado enviado para APIs externas.",
        "",
        "Segundo: integração nativa com o ecossistema Fortinet.",
        "FortiGate, FortiNAC, FortiAnalyzer — o CRISP fala a língua da Fortinet via API REST.",
        "Já validamos com FortiGate 7.6.6 em ambiente real, não só em lab.",
        "",
        "Terceiro: custo zero em licenças de software.",
        "Wazuh, Zeek, Ollama, PostgreSQL — todo o stack é open source.",
        "Uma empresa de médio porte tem um SOC profissional pelo custo de infraestrutura,",
        "sem pagar dezenas de milhares por ano em licenças de Splunk ou Sentinel.",
        "",
        "O resultado é uma plataforma que entrega capacidade de SOC enterprise",
        "para quem até hoje não tinha acesso a isso. Volto pro Marco para fechar.",
      ]),
      ...spacer(2),

      // ── BLOCO 6: ENCERRAMENTO ─────────────────────────────────
      heading2("BLOCO 6 — Encerramento Conjunto  (9:00 – 10:00)"),
      infoBox("Ambos aparecem na câmera se possível. Tom direto e confiante. Marco abre, Pessoa 2 complementa, Marco fecha."),
      ...spacer(1),
      speakerBlock("Marco — Encerramento", SPEAKER1_CLR, "9:00 – 9:35", [
        "Em menos de 10 minutos vocês viram:",
        "FortiGate integrado via API, Wazuh correlacionando alertas, Zeek monitorando a rede,",
        "IA local analisando ameaças e um playbook executando resposta automatizada —",
        "tudo em um dashboard unificado.",
        "",
        "Não é um protótipo. É um sistema funcionando com dados reais.",
      ]),
      ...spacer(1),
      speakerBlock("Pessoa 2 — Complemento Final", SPEAKER2_CLR, "9:35 – 9:50", [
        "E o mais importante: construímos isso do zero.",
        "Cada linha de integração, cada regra do Wazuh, cada endpoint do proxy FortiGate —",
        "desenvolvido e validado por nós.",
      ]),
      ...spacer(1),
      speakerBlock("Marco — Chamada para o Pitch", SPEAKER1_CLR, "9:50 – 10:00", [
        "No próximo vídeo vamos mostrar como a Fortinet pode se beneficiar dessa solução",
        "e o que estamos propondo como parceria. Obrigado.",
      ]),
      ...spacer(3),

      // ── DICAS DE GRAVAÇÃO ─────────────────────────────────────
      new Paragraph({ children: [new TextRun({ text: "\n" })], pageBreakBefore: true }),
      new Paragraph({
        shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "  DICAS DE GRAVAÇÃO — 2 APRESENTADORES", bold: true, size: 36, font: "Arial", color: WHITE })],
        spacing: { before: 240, after: 240 },
      }),
      ...spacer(1),
      heading2("Divisão de trabalho"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Marco grava: blocos 1, 3, 4 e 6 — totalizando ~6 min de fala", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Pessoa 2 grava: blocos 2, 4 (complemento) e 5 — totalizando ~4 min de fala", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Bloco 6 pode ser gravado juntos (mesma chamada) ou editado em corte alternado", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      ...spacer(1),
      heading2("Antes de gravar"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Rode o start-crisp.bat e confirme: chips FortiGate e AI Pipeline verdes no dashboard", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Abra o dashboard em tela cheia — resolução 1920x1080", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Confirme que o botão Ransomware está funcionando e a IA responde (badge OLLAMA REAL)", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Configure o OBS: captura de tela principal + webcam PiP no canto inferior direito (~25%)", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      ...spacer(1),
      heading2("Durante a gravação"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Fale pausado — o espectador precisa ler o dashboard e ouvir ao mesmo tempo", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Pause naturalmente entre os blocos — facilita o corte na edição", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Não clique em Ransomware antes de narrar a introdução — aguarde o momento certo do roteiro", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Se a IA demorar, não corte — o tempo de resposta real é parte do impacto", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      ...spacer(1),
      heading2("Edição (DaVinci Resolve)"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Sequencie os clipes na ordem dos blocos — não precisa ser contínuo", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Adicione o nome de cada apresentador como lower-third quando entrar na câmera", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Coloquem os nomes reais no lugar de Marco / Pessoa 2 nos títulos", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      ...spacer(2),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const out = "D:\\marco\\crisp-soc\\Roteiro_SOC_Demo_2pessoas.docx";
  fs.writeFileSync(out, buffer);
  console.log(`Documento criado: ${out}`);
});
