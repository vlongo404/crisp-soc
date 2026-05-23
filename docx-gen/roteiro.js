const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
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
const SPEAKER3_CLR  = "B45309";  // Pessoa 3 - laranja

// ── Helpers ──────────────────────────────────────────────────────
const border = (color="CCCCCC") => ({ style: BorderStyle.SINGLE, size: 1, color });
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: "FFFFFF" });

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 36, color: WHITE, font: "Arial" })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 360, after: 180 },
    shading: { fill: DARK_BG, type: ShadingType.CLEAR },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: FORTINET_RED } },
    indent: { left: 200, right: 200 },
  });
}

function heading2(text, color=FORTINET_RED) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color, font: "Arial" })],
    spacing: { before: 300, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: MID_GRAY } },
  });
}

function heading3(text, color=ACCENT_BLUE) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color, font: "Arial" })],
    spacing: { before: 200, after: 80 },
  });
}

function normal(text, options={}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Arial", color: TEXT_DARK, ...options })],
    spacing: { before: 60, after: 60 },
  });
}

function muted(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 18, font: "Arial", color: MUTED, italics: true })],
    spacing: { before: 40, after: 40 },
  });
}

function spacer(n=1) {
  return Array.from({length:n}, () => new Paragraph({ children: [new TextRun("")], spacing: { before: 60, after: 60 } }));
}

function speakerBlock(who, color, time, lines) {
  const bs = { style: BorderStyle.SINGLE, size: 1, color };
  const allBorders = { top: bs, bottom: bs, left: bs, right: bs };
  const cellMargins = { top: 100, bottom: 100, left: 160, right: 160 };

  // Header row
  const headerRow = new TableRow({
    children: [
      new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 2, color }, bottom: noBorder(), left: { style: BorderStyle.SINGLE, size: 2, color }, right: noBorder() },
        width: { size: 4500, type: WidthType.DXA },
        shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: who, bold: true, size: 22, color, font: "Arial" })] })],
      }),
      new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 2, color }, bottom: noBorder(), left: noBorder(), right: { style: BorderStyle.SINGLE, size: 2, color } },
        width: { size: 4860, type: WidthType.DXA },
        shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `⏱ ${time}`, size: 20, color: MUTED, font: "Arial" })] })],
      }),
    ]
  });

  // Text rows
  const textRows = lines.map((line, i) => {
    const isLast = i === lines.length - 1;
    return new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          borders: {
            top: noBorder(),
            bottom: isLast ? { style: BorderStyle.SINGLE, size: 2, color } : noBorder(),
            left: { style: BorderStyle.SINGLE, size: 2, color },
            right: { style: BorderStyle.SINGLE, size: 2, color },
          },
          width: { size: 9360, type: WidthType.DXA },
          margins: { top: isLast ? 60 : 40, bottom: isLast ? 100 : 40, left: 200, right: 200 },
          children: [new Paragraph({ children: [new TextRun({ text: line, size: 22, font: "Arial", color: TEXT_DARK })] })],
        }),
      ]
    });
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4500, 4860],
    rows: [headerRow, ...textRows],
  });
}

function infoBox(text, bgColor=LIGHT_GRAY, borderColor=ACCENT_BLUE) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 3, color: borderColor }, bottom: { style: BorderStyle.SINGLE, size: 3, color: borderColor }, left: { style: BorderStyle.SINGLE, size: 8, color: borderColor }, right: { style: BorderStyle.SINGLE, size: 3, color: borderColor } },
        width: { size: 9360, type: WidthType.DXA },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        children: [new Paragraph({ children: [new TextRun({ text, size: 22, font: "Arial", color: TEXT_DARK, italics: true })] })],
      })]
    })]
  });
}

function timelineRow(time, activity, speaker, color) {
  const bs = (c) => ({ style: BorderStyle.SINGLE, size: 1, color: c });
  return new TableRow({
    children: [
      new TableCell({
        borders: { top: bs("CCCCCC"), bottom: bs("CCCCCC"), left: bs("CCCCCC"), right: bs("CCCCCC") },
        width: { size: 1200, type: WidthType.DXA },
        shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: time, bold: true, size: 20, font: "Arial", color: FORTINET_RED })] })],
      }),
      new TableCell({
        borders: { top: bs("CCCCCC"), bottom: bs("CCCCCC"), left: bs("CCCCCC"), right: bs("CCCCCC") },
        width: { size: 5760, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: activity, size: 22, font: "Arial", color: TEXT_DARK })] })],
      }),
      new TableCell({
        borders: { top: bs("CCCCCC"), bottom: bs("CCCCCC"), left: bs("CCCCCC"), right: bs("CCCCCC") },
        width: { size: 2400, type: WidthType.DXA },
        shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: speaker, bold: true, size: 20, font: "Arial", color })] })],
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
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
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
            new TextRun({ text: "Roteiro de Apresentação  |  Fortinet", size: 18, font: "Arial", color: MUTED }),
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

      // ─────────────────────────────────────────────────────────
      // CAPA
      // ─────────────────────────────────────────────────────────
      ...spacer(2),
      new Paragraph({
        children: [new TextRun({ text: "CRISP NG-SOC Platform", bold: true, size: 72, font: "Arial", color: FORTINET_RED })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 480, after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Roteiro Completo de Apresentação", size: 36, font: "Arial", color: TEXT_DARK })],
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
        children: [new TextRun({ text: "Apresentação para Representantes Fortinet", size: 24, font: "Arial", color: MUTED, italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
      }),
      ...spacer(1),
      // Legenda de cores
      new Table({
        width: { size: 7200, type: WidthType.DXA },
        columnWidths: [2400, 2400, 2400],
        rows: [new TableRow({
          children: [
            new TableCell({
              borders: { top: border(), bottom: border(), left: border(), right: border() },
              width: { size: 2400, type: WidthType.DXA },
              shading: { fill: "DBEAFE", type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Marco (Apresentador)", bold: true, size: 20, font: "Arial", color: SPEAKER1_CLR })] })],
            }),
            new TableCell({
              borders: { top: border(), bottom: border(), left: border(), right: border() },
              width: { size: 2400, type: WidthType.DXA },
              shading: { fill: "DCFCE7", type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Pessoa 2 (Técnico)", bold: true, size: 20, font: "Arial", color: SPEAKER2_CLR })] })],
            }),
            new TableCell({
              borders: { top: border(), bottom: border(), left: border(), right: border() },
              width: { size: 2400, type: WidthType.DXA },
              shading: { fill: "FEF3C7", type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Pessoa 3 (Negócios)", bold: true, size: 20, font: "Arial", color: SPEAKER3_CLR })] })],
            }),
          ]
        })]
      }),
      ...spacer(2),

      // ─────────────────────────────────────────────────────────
      // VÍDEO 1 — DEMONSTRAÇÃO TÉCNICA (10 MIN)
      // ─────────────────────────────────────────────────────────
      new Paragraph({ children: [new TextRun({ text: "\n" })], pageBreakBefore: true }),
      new Paragraph({
        shading: { fill: DARK_BG, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "  VÍDEO 1 — DEMONSTRAÇÃO TÉCNICA  |  10 MINUTOS", bold: true, size: 40, font: "Arial", color: WHITE })],
        spacing: { before: 240, after: 240 },
      }),
      ...spacer(1),

      // Timeline
      heading2("Estrutura de Tempo"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1200, 5760, 2400],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: { top: border(DARK_BG), bottom: border(DARK_BG), left: border(DARK_BG), right: border(DARK_BG) }, width: { size: 1200, type: WidthType.DXA }, shading: { fill: DARK_BG, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tempo", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
            new TableCell({ borders: { top: border(DARK_BG), bottom: border(DARK_BG), left: border(DARK_BG), right: border(DARK_BG) }, width: { size: 5760, type: WidthType.DXA }, shading: { fill: DARK_BG, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Conteúdo", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
            new TableCell({ borders: { top: border(DARK_BG), bottom: border(DARK_BG), left: border(DARK_BG), right: border(DARK_BG) }, width: { size: 2400, type: WidthType.DXA }, shading: { fill: DARK_BG, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Quem Fala", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
          ]}),
          timelineRow("0:00–1:30", "Abertura: o problema e apresentação do CRISP", "Marco", SPEAKER1_CLR),
          timelineRow("1:30–3:30", "Arquitetura técnica: como o pipeline funciona", "Pessoa 2", SPEAKER2_CLR),
          timelineRow("3:30–6:00", "Demo ao vivo: dashboard + FortiGate + IA", "Marco", SPEAKER1_CLR),
          timelineRow("6:00–8:00", "Demo ao vivo: cenário de ataque (Ransomware)", "Marco", SPEAKER1_CLR),
          timelineRow("8:00–9:30", "Diferenciais e stack de tecnologia", "Pessoa 3", SPEAKER3_CLR),
          timelineRow("9:30–10:00", "Encerramento e chamada para o pitch", "Marco", SPEAKER1_CLR),
        ]
      }),
      ...spacer(1),

      // ── BLOCO 1: ABERTURA ──
      heading2("BLOCO 1 — Abertura  (0:00 – 1:30)"),
      infoBox("Câmera ligada. Dashboard CRISP aberto no navegador em segundo plano. Todos os três aparecem brevemente."),
      ...spacer(1),
      speakerBlock("Marco — Abertura", SPEAKER1_CLR, "0:00 – 1:30", [
        "Olá! Somos o grupo CRISP, e nos próximos 10 minutos vamos mostrar uma plataforma de SOC",
        "de próxima geração que construímos do zero — integrando FortiGate, Wazuh, Zeek, CrowdStrike",
        "Falcon e Inteligência Artificial local com Ollama.",
        "",
        "O problema que resolvemos é simples de explicar: as empresas têm dados de segurança em",
        "dezenas de ferramentas diferentes — e ninguém consegue ver o panorama completo em tempo real.",
        "",
        "O CRISP muda isso. É um painel único que une todos os dados, analisa com IA e recomenda",
        "ações em segundos. Vou passar para a [Pessoa 2] explicar como isso funciona por dentro.",
      ]),
      ...spacer(2),

      // ── BLOCO 2: ARQUITETURA ──
      heading2("BLOCO 2 — Arquitetura Técnica  (1:30 – 3:30)"),
      infoBox("Pessoa 2 compartilha tela com um diagrama simples ou aponta para o flow bar do dashboard."),
      ...spacer(1),
      speakerBlock("Pessoa 2 — Arquitetura", SPEAKER2_CLR, "1:30 – 3:30", [
        "O pipeline do CRISP tem cinco camadas:",
        "",
        "Primeiro, o FortiGate — nosso firewall de borda. Ele captura sessões, políticas e tráfego",
        "em tempo real via API REST. Nos conectamos a ele usando um token de autenticação seguro.",
        "",
        "Segundo, o Zeek — nosso sistema de detecção de intrusão de rede. Ele analisa o tráfego",
        "e gera logs estruturados de conexões, DNS, HTTP e SSH.",
        "",
        "Terceiro, o Wazuh SIEM — que correlaciona alertas do FortiGate, Zeek e dos agentes",
        "instalados nos endpoints Windows. Temos regras customizadas para ameaças específicas.",
        "",
        "Quarto, o Ollama com modelo LLaMA 3.1 — nossa IA local. Ela recebe os eventos, analisa",
        "e responde com prioridade, técnica MITRE ATT&CK e ação recomendada. Tudo na empresa,",
        "sem enviar dados para a nuvem — o que é fundamental para conformidade com a LGPD.",
        "",
        "E quinto: o dashboard CRISP, que une tudo isso visualmente. Passo de volta pro Marco.",
      ]),
      ...spacer(2),

      // ── BLOCO 3: DEMO DASHBOARD ──
      heading2("BLOCO 3 — Demo ao Vivo: Dashboard + FortiGate  (3:30 – 6:00)"),
      infoBox("Marco compartilha tela com o dashboard aberto. Chip FortiGate verde, chip AI verde."),
      ...spacer(1),
      speakerBlock("Marco — Demo Dashboard", SPEAKER1_CLR, "3:30 – 6:00", [
        "Aqui está o dashboard CRISP rodando ao vivo. Reparem que os dois chips no topo estão verdes:",
        "FortiGate Proxy e AI Pipeline — ambos conectados e respondendo.",
        "",
        "[aponta para o card FortiGate]",
        "Esses dados são reais: estamos vendo o tráfego da VM FortiGate 7.6.6 em tempo real —",
        "IP 192.168.174.129, bytes recebidos e enviados, throughput calculado a cada 15 segundos.",
        "",
        "[aponta para o feed de eventos]",
        "O feed de eventos central agrega tudo — FortiGate, Wazuh, Zeek e Falcon — em ordem",
        "cronológica. Qualquer analista abre isso e sabe exatamente o que está acontecendo.",
        "",
        "[clica no botão 'API FortiGate']",
        "Aqui forçamos uma atualização manual. O sistema sincroniza automaticamente a cada 15 segundos,",
        "mas em um incidente o analista pode atualizar na hora.",
        "",
        "Agora vou mostrar o que acontece quando um ataque real é simulado.",
      ]),
      ...spacer(2),

      // ── BLOCO 4: DEMO ATAQUE ──
      heading2("BLOCO 4 — Demo ao Vivo: Cenário Ransomware  (6:00 – 8:00)"),
      infoBox("Marco clica no botão 'Ransomware' no demo bar e narra enquanto o sistema responde."),
      ...spacer(1),
      speakerBlock("Marco — Demo Ataque", SPEAKER1_CLR, "6:00 – 8:00", [
        "[clica no botão 'Ransomware']",
        "",
        "Estamos simulando uma infecção por ransomware na máquina WS-004.",
        "Vejam o feed: o FortiGate detecta tráfego anômalo, o Wazuh correlaciona mudanças",
        "em massa de extensões de arquivo — 847 arquivos alterados em 23 segundos.",
        "",
        "[aponta para o banner vermelho que aparece]",
        "O banner de incidente ativo dispara automaticamente. O timer começa a contar.",
        "",
        "[aponta para o painel de IA]",
        "A IA está analisando... ela recebe os eventos reais do Wazuh, monta o prompt,",
        "envia para o Ollama localmente e retorna a análise.",
        "",
        "[quando a IA responder — badge 'OLLAMA REAL']",
        "Vejam o badge: OLLAMA REAL. Não é simulação — é o modelo LLaMA rodando aqui.",
        "Ele identificou LockBit 3.0, técnica T1486, confiança alta, e recomenda isolamento imediato.",
        "",
        "[aponta para o playbook]",
        "Enquanto isso, o playbook automatizado executa: detectar, alertar, analisar com IA,",
        "isolar via FortiNAC, bloquear C2 no FortiGate e salvar o relatório.",
        "Tudo isso em menos de 30 segundos após a detecção.",
      ]),
      ...spacer(2),

      // ── BLOCO 5: DIFERENCIAIS ──
      heading2("BLOCO 5 — Diferenciais e Stack  (8:00 – 9:30)"),
      infoBox("Pessoa 3 fala diretamente para câmera. Dashboard visível em segundo plano."),
      ...spacer(1),
      speakerBlock("Pessoa 3 — Diferenciais", SPEAKER3_CLR, "8:00 – 9:30", [
        "O que diferencia o CRISP de outras soluções no mercado são três pontos principais:",
        "",
        "Primeiro: IA local com Ollama. Os dados de segurança da empresa nunca saem da empresa.",
        "Isso é conformidade com LGPD e reduz risco de exposição de informações sensíveis.",
        "",
        "Segundo: integração nativa com o ecossistema Fortinet. FortiGate, FortiNAC, FortiSIEM —",
        "o CRISP foi construído para falar a língua da Fortinet via API REST.",
        "",
        "Terceiro: custo zero em licenças de software. Todo o stack é open source —",
        "Wazuh, Zeek, Ollama, PostgreSQL — exceto o FortiGate, que a empresa já possui.",
        "O investimento é em integração e conhecimento, não em licenças caras.",
        "",
        "O resultado: uma empresa de médio porte pode ter um SOC profissional por uma fração",
        "do custo de soluções como Splunk ou Microsoft Sentinel. Volto pro Marco para fechar.",
      ]),
      ...spacer(2),

      // ── BLOCO 6: ENCERRAMENTO ──
      heading2("BLOCO 6 — Encerramento  (9:30 – 10:00)"),
      ...spacer(1),
      speakerBlock("Marco — Encerramento", SPEAKER1_CLR, "9:30 – 10:00", [
        "Em 10 minutos vocês viram: FortiGate integrado via API, Wazuh correlacionando alertas,",
        "Zeek monitorando a rede, IA local analisando ameaças e um playbook executando respostas",
        "automatizadas — tudo em um dashboard unificado.",
        "",
        "No próximo vídeo vamos apresentar como a Fortinet pode se beneficiar dessa solução",
        "e o que estamos propondo. Obrigado.",
      ]),
      ...spacer(3),

      // ─────────────────────────────────────────────────────────
      // VÍDEO 2 — PITCH (5 MIN)
      // ─────────────────────────────────────────────────────────
      new Paragraph({ children: [new TextRun({ text: "\n" })], pageBreakBefore: true }),
      new Paragraph({
        shading: { fill: FORTINET_RED, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "  VÍDEO 2 — PITCH COMERCIAL  |  5 MINUTOS", bold: true, size: 40, font: "Arial", color: WHITE })],
        spacing: { before: 240, after: 240 },
      }),
      ...spacer(1),

      // Timeline pitch
      heading2("Estrutura de Tempo"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1200, 5760, 2400],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: { top: border(FORTINET_RED), bottom: border(FORTINET_RED), left: border(FORTINET_RED), right: border(FORTINET_RED) }, width: { size: 1200, type: WidthType.DXA }, shading: { fill: FORTINET_RED, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tempo", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
            new TableCell({ borders: { top: border(FORTINET_RED), bottom: border(FORTINET_RED), left: border(FORTINET_RED), right: border(FORTINET_RED) }, width: { size: 5760, type: WidthType.DXA }, shading: { fill: FORTINET_RED, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Conteúdo", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
            new TableCell({ borders: { top: border(FORTINET_RED), bottom: border(FORTINET_RED), left: border(FORTINET_RED), right: border(FORTINET_RED) }, width: { size: 2400, type: WidthType.DXA }, shading: { fill: FORTINET_RED, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Quem Fala", bold: true, size: 20, font: "Arial", color: WHITE })] })] }),
          ]}),
          timelineRow("0:00–1:00", "O problema: mercado de cibersegurança para PMEs", "Pessoa 3", SPEAKER3_CLR),
          timelineRow("1:00–2:30", "A solução: CRISP + Fortinet = SOC acessível", "Marco", SPEAKER1_CLR),
          timelineRow("2:30–3:30", "Proposta para a Fortinet: parceria e oportunidade", "Pessoa 2", SPEAKER2_CLR),
          timelineRow("3:30–4:30", "Modelo de negócio e próximos passos", "Pessoa 3", SPEAKER3_CLR),
          timelineRow("4:30–5:00", "Chamada final e contato", "Marco", SPEAKER1_CLR),
        ]
      }),
      ...spacer(1),

      // ── PITCH BLOCO 1 ──
      heading2("BLOCO 1 — O Problema  (0:00 – 1:00)", SPEAKER3_CLR),
      infoBox("Pessoa 3 fala para câmera, confiante. Tom executivo, não técnico."),
      ...spacer(1),
      speakerBlock("Pessoa 3 — O Problema", SPEAKER3_CLR, "0:00 – 1:00", [
        "70% das empresas de médio porte no Brasil não possuem um SOC — Centro de Operações",
        "de Segurança. Não porque não querem, mas porque custa caro demais.",
        "",
        "Soluções como Splunk e Microsoft Sentinel custam dezenas de milhares de reais por ano.",
        "O mercado deixou essas empresas desprotegidas.",
        "",
        "Ao mesmo tempo, os ataques estão crescendo: ransomware, movimento lateral, exfiltração",
        "de dados — ameaças que antes eram problema de grandes corporações agora atingem todo mundo.",
        "",
        "Existe uma janela de oportunidade enorme aqui. E o CRISP é a resposta.",
      ]),
      ...spacer(2),

      // ── PITCH BLOCO 2 ──
      heading2("BLOCO 2 — A Solução  (1:00 – 2:30)", SPEAKER1_CLR),
      infoBox("Marco apresenta com entusiasmo. Pode mostrar brevemente o dashboard no fundo."),
      ...spacer(1),
      speakerBlock("Marco — A Solução", SPEAKER1_CLR, "1:00 – 2:30", [
        "O CRISP é uma plataforma de SOC de próxima geração — construída sobre o ecossistema Fortinet",
        "e tecnologias open source, que entrega capacidade de detecção e resposta de nível enterprise",
        "a um custo que PMEs conseguem pagar.",
        "",
        "O coração do sistema é a integração entre FortiGate e Inteligência Artificial local.",
        "Cada evento de segurança — seja do FortiGate, Wazuh ou CrowdStrike Falcon —",
        "é automaticamente analisado por um modelo de IA rodando dentro da empresa.",
        "",
        "Em segundos, o analista recebe: a técnica MITRE ATT&CK identificada, o nível de risco",
        "e a ação recomendada. O playbook executa automaticamente.",
        "",
        "Já vimos isso funcionando ao vivo. Detecção de ransomware em 28 segundos,",
        "do alerta ao isolamento completo do host comprometido.",
      ]),
      ...spacer(2),

      // ── PITCH BLOCO 3 ──
      heading2("BLOCO 3 — Proposta para a Fortinet  (2:30 – 3:30)", SPEAKER2_CLR),
      speakerBlock("Pessoa 2 — Proposta", SPEAKER2_CLR, "2:30 – 3:30", [
        "Nossa proposta para a Fortinet é clara: o CRISP amplia o valor dos produtos Fortinet",
        "para um mercado que hoje não consegue usufruir do ecossistema completo.",
        "",
        "Tecnicamente, o CRISP já consome a API REST do FortiGate para dados de sessões,",
        "interfaces e políticas em tempo real. A integração está funcionando com FortiGate 7.6.",
        "",
        "O que propomos é uma parceria em três níveis:",
        "Primeiro: suporte técnico da Fortinet para expandir as integrações — FortiAnalyzer,",
        "FortiManager, FortiNAC — diretamente via API oficial.",
        "",
        "Segundo: colocar o CRISP como solução de referência para o programa Fortinet MSSP —",
        "provedores de serviços gerenciados que atendem PMEs.",
        "",
        "Terceiro: co-desenvolvimento — a Fortinet ganha uma plataforma de SOC com IA local,",
        "alinhada à LGPD e ao mercado brasileiro.",
      ]),
      ...spacer(2),

      // ── PITCH BLOCO 4 ──
      heading2("BLOCO 4 — Modelo de Negócio  (3:30 – 4:30)", SPEAKER3_CLR),
      speakerBlock("Pessoa 3 — Modelo de Negócio", SPEAKER3_CLR, "3:30 – 4:30", [
        "O modelo de negócio é baseado em recorrência mensal por cliente:",
        "",
        "Implantação e customização: R$ 15.000 a R$ 50.000 por projeto,",
        "dependendo da complexidade do ambiente do cliente.",
        "",
        "Monitoramento gerenciado mensal: R$ 3.000 a R$ 15.000 por empresa —",
        "o que chamamos de SOC as a Service.",
        "",
        "Com 10 clientes ativos, o modelo já gera receita recorrente suficiente para sustentar",
        "uma operação profissional com equipe dedicada.",
        "",
        "O custo de licenças de software é praticamente zero — o stack open source elimina",
        "a dependência de fornecedores caros e permite margens saudáveis.",
        "",
        "A Fortinet se beneficia diretamente: mais empresas comprando e usando FortiGate,",
        "com um caso de uso de alto valor agregado para o ecossistema.",
      ]),
      ...spacer(2),

      // ── PITCH BLOCO 5 ──
      heading2("BLOCO 5 — Chamada Final  (4:30 – 5:00)", SPEAKER1_CLR),
      speakerBlock("Marco — Encerramento do Pitch", SPEAKER1_CLR, "4:30 – 5:00", [
        "Construímos o CRISP do zero. O pipeline está rodando, os dados são reais,",
        "a IA está integrada e o FortiGate está conectado.",
        "",
        "Não estamos vendendo uma ideia — estamos mostrando um produto funcionando.",
        "",
        "A pergunta que deixamos para vocês da Fortinet é:",
        "quantas PMEs brasileiras poderiam ter um SOC profissional amanhã",
        "se tivessem acesso a uma solução como essa?",
        "",
        "Estamos prontos para conversar. Obrigado.",
      ]),
      ...spacer(3),

      // ─────────────────────────────────────────────────────────
      // DICAS FINAIS
      // ─────────────────────────────────────────────────────────
      new Paragraph({ children: [new TextRun({ text: "\n" })], pageBreakBefore: true }),
      new Paragraph({
        shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "  DICAS DE GRAVAÇÃO", bold: true, size: 36, font: "Arial", color: WHITE })],
        spacing: { before: 240, after: 240 },
      }),
      ...spacer(1),
      heading2("Vídeo 1 — Técnico"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Grave com o stack completo rodando: FortiGate, proxy, FastAPI, Wazuh e Zeek ativos", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Mostre os chips do header verdes antes de começar a demo", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Clique em 'Ransomware' e aguarde a resposta real da IA — não corte esse momento", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Fundo: dashboard visível em tela cheia. Use resolução 1920x1080", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      ...spacer(1),
      heading2("Vídeo 2 — Pitch"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Tom executivo: confiante, direto, sem jargão técnico excessivo", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Cada pessoa fala direto para câmera — não para o lado", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Fundo limpo e profissional — preferencialmente fundo neutro ou com o dashboard desfocado", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Ensaiem juntos pelo menos 2 vezes antes de gravar — os números precisam ser fluentes", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Coloquem seus nomes reais no lugar de Marco / Pessoa 2 / Pessoa 3", size: 22, font: "Arial" })], spacing: { before: 40, after: 40 } }),
      ...spacer(2),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("D:\\marco\\crisp-soc\\Roteiro_CRISP_Fortinet.docx", buffer);
  console.log("Documento criado com sucesso!");
});
