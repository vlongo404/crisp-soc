const PptxGenJS = require('pptxgenjs');
const pptx = new PptxGenJS();

// ── Theme ──────────────────────────────────────────────────────────
const RED      = 'DA291C';   // Fortinet red
const DARK     = '1A1A2E';   // dark navy
const WHITE    = 'FFFFFF';
const GRAY     = 'F5F5F5';
const MUTED    = '9CA3AF';
const BLUE     = '3B82F6';
const GREEN    = '15803D';
const ORANGE   = 'B45309';
const YELLOW   = 'FEF3C7';
const LBLUE    = 'DBEAFE';
const LGREEN   = 'DCFCE7';

pptx.layout  = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches
pptx.author  = 'CRISP NG-SOC';
pptx.subject = 'Pitch Fortinet';
pptx.title   = 'CRISP NG-SOC — Pitch Comercial';

// ── Helper: add slide with dark header bar ─────────────────────────
function slideBase(headerText, headerColor = DARK, subText = '') {
  const slide = pptx.addSlide();
  // Background
  slide.background = { color: WHITE };
  // Top bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.7,
    fill: { color: headerColor },
  });
  // Header text
  slide.addText(headerText, {
    x: 0.3, y: 0, w: 9, h: 0.7,
    fontSize: 20, bold: true, color: WHITE, fontFace: 'Arial', valign: 'middle',
  });
  // Bottom accent line
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.3, w: '100%', h: 0.2,
    fill: { color: RED },
  });
  // Footer
  slide.addText('CRISP NG-SOC Platform  |  Pitch Comercial — Fortinet', {
    x: 0.3, y: 7.3, w: 12, h: 0.2,
    fontSize: 8, color: WHITE, fontFace: 'Arial', valign: 'middle',
  });
  if (subText) {
    slide.addText(subText, {
      x: 10, y: 0, w: 3.1, h: 0.7,
      fontSize: 11, color: 'FFCCCC', fontFace: 'Arial', valign: 'middle', align: 'right',
    });
  }
  return slide;
}

// ══════════════════════════════════════════════════════════════════
// SLIDE 1 — CAPA
// ══════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  slide.background = { color: DARK };

  // Red accent top strip
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.12, fill: { color: RED } });

  // Logo / Title
  slide.addText('CRISP', {
    x: 0.6, y: 1.2, w: 12, h: 1.6,
    fontSize: 96, bold: true, color: RED, fontFace: 'Arial', align: 'left',
  });
  slide.addText('NG-SOC Platform', {
    x: 0.6, y: 2.7, w: 12, h: 0.8,
    fontSize: 36, color: WHITE, fontFace: 'Arial', align: 'left',
  });

  // Divider
  slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 3.65, w: 8, h: 0.06, fill: { color: RED } });

  slide.addText('Pitch Comercial — Representantes Fortinet', {
    x: 0.6, y: 3.85, w: 11, h: 0.5,
    fontSize: 18, color: MUTED, fontFace: 'Arial', italic: true,
  });
  slide.addText('5 minutos  |  2026', {
    x: 0.6, y: 4.4, w: 6, h: 0.4,
    fontSize: 14, color: MUTED, fontFace: 'Arial',
  });

  // Speaker tags bottom
  const tags = [
    { label: 'Pessoa 3 — Negócios', color: ORANGE, bg: 'FEF3C7' },
    { label: 'Marco — Apresentador', color: '1D4ED8', bg: LBLUE },
    { label: 'Pessoa 2 — Técnico', color: GREEN, bg: LGREEN },
  ];
  tags.forEach((t, i) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.6 + i * 3.7, y: 5.8, w: 3.4, h: 0.55,
      fill: { color: t.bg }, line: { color: t.color, width: 1 }, rectRadius: 0.08,
    });
    slide.addText(t.label, {
      x: 0.6 + i * 3.7, y: 5.8, w: 3.4, h: 0.55,
      fontSize: 13, bold: true, color: t.color, fontFace: 'Arial', align: 'center', valign: 'middle',
    });
  });

  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.38, w: '100%', h: 0.12, fill: { color: RED } });
}

// ══════════════════════════════════════════════════════════════════
// SLIDE 2 — AGENDA
// ══════════════════════════════════════════════════════════════════
{
  const slide = slideBase('Estrutura — 5 minutos');
  slide.addText('O que vamos apresentar', {
    x: 0.4, y: 0.85, w: 12, h: 0.5,
    fontSize: 22, bold: true, color: DARK, fontFace: 'Arial',
  });

  const items = [
    { time: '0:00 – 1:00', title: 'O Problema',              speaker: 'Pessoa 3', color: ORANGE, bg: YELLOW },
    { time: '1:00 – 2:30', title: 'A Solução',               speaker: 'Marco',    color: '1D4ED8', bg: LBLUE },
    { time: '2:30 – 3:30', title: 'Proposta para a Fortinet', speaker: 'Pessoa 2', color: GREEN,  bg: LGREEN },
    { time: '3:30 – 4:30', title: 'Modelo de Negócio',        speaker: 'Pessoa 3', color: ORANGE, bg: YELLOW },
    { time: '4:30 – 5:00', title: 'Chamada Final',            speaker: 'Marco',    color: '1D4ED8', bg: LBLUE },
  ];

  items.forEach((item, i) => {
    const y = 1.55 + i * 1.0;
    // Time badge
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.4, y, w: 1.6, h: 0.7, fill: { color: DARK },
    });
    slide.addText(item.time, {
      x: 0.4, y, w: 1.6, h: 0.7,
      fontSize: 13, bold: true, color: RED, fontFace: 'Arial', align: 'center', valign: 'middle',
    });
    // Title
    slide.addText(item.title, {
      x: 2.2, y: y + 0.05, w: 7.5, h: 0.6,
      fontSize: 18, bold: true, color: DARK, fontFace: 'Arial', valign: 'middle',
    });
    // Speaker tag
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 10.1, y: y + 0.08, w: 2.8, h: 0.55,
      fill: { color: item.bg }, line: { color: item.color, width: 1 }, rectRadius: 0.07,
    });
    slide.addText(item.speaker, {
      x: 10.1, y: y + 0.08, w: 2.8, h: 0.55,
      fontSize: 13, bold: true, color: item.color, fontFace: 'Arial', align: 'center', valign: 'middle',
    });
    // Divider line
    if (i < items.length - 1) {
      slide.addShape(pptx.ShapeType.line, {
        x: 0.4, y: y + 0.75, w: 12.6, h: 0,
        line: { color: 'E5E7EB', width: 0.5 },
      });
    }
  });
}

// ══════════════════════════════════════════════════════════════════
// SLIDE 3 — O PROBLEMA
// ══════════════════════════════════════════════════════════════════
{
  const slide = slideBase('BLOCO 1 — O Problema', ORANGE, '0:00 – 1:00  |  Pessoa 3');

  slide.addText('70% das PMEs brasileiras não têm SOC', {
    x: 0.4, y: 0.85, w: 12.5, h: 0.65,
    fontSize: 26, bold: true, color: DARK, fontFace: 'Arial',
  });

  // Big stat
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 1.6, w: 3.5, h: 3.2, fill: { color: RED },
  });
  slide.addText('70%', {
    x: 0.4, y: 1.7, w: 3.5, h: 1.8,
    fontSize: 80, bold: true, color: WHITE, fontFace: 'Arial', align: 'center',
  });
  slide.addText('das empresas médias\nsem proteção SOC', {
    x: 0.4, y: 3.4, w: 3.5, h: 1.3,
    fontSize: 15, color: 'FFCCCC', fontFace: 'Arial', align: 'center',
  });

  // Pain points
  const points = [
    { icon: '💰', text: 'Splunk / Sentinel: dezenas de\nmilhares de reais por ano' },
    { icon: '⚡', text: 'Ransomware, movimento lateral e\nexfiltração atingem todos' },
    { icon: '🚪', text: 'Mercado deixou as PMEs\ndesprotegidas' },
  ];
  points.forEach((p, i) => {
    const y = 1.6 + i * 1.1;
    slide.addText(p.icon, { x: 4.3, y, w: 0.7, h: 0.9, fontSize: 28, align: 'center' });
    slide.addText(p.text, {
      x: 5.1, y: y + 0.05, w: 7.9, h: 0.9,
      fontSize: 17, color: DARK, fontFace: 'Arial', valign: 'middle',
    });
    if (i < points.length - 1) {
      slide.addShape(pptx.ShapeType.line, {
        x: 4.3, y: y + 1.0, w: 8.7, h: 0,
        line: { color: 'E5E7EB', width: 0.5 },
      });
    }
  });

  // Quote box
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 5.05, w: 12.6, h: 0.9,
    fill: { color: YELLOW }, line: { color: ORANGE, width: 2 },
  });
  slide.addText('"Existe uma janela de oportunidade enorme aqui. E o CRISP é a resposta."', {
    x: 0.6, y: 5.05, w: 12.2, h: 0.9,
    fontSize: 16, italic: true, color: DARK, fontFace: 'Arial', valign: 'middle', align: 'center',
  });
}

// ══════════════════════════════════════════════════════════════════
// SLIDE 4 — A SOLUÇÃO
// ══════════════════════════════════════════════════════════════════
{
  const slide = slideBase('BLOCO 2 — A Solução', '1D4ED8', '1:00 – 2:30  |  Marco');

  slide.addText('CRISP + Fortinet = SOC Acessível', {
    x: 0.4, y: 0.85, w: 12.5, h: 0.65,
    fontSize: 26, bold: true, color: DARK, fontFace: 'Arial',
  });

  // Pipeline visualization
  const components = [
    { name: 'FortiGate\n7.6', color: RED },
    { name: 'Zeek\nNDR', color: '0369A1' },
    { name: 'Wazuh\nSIEM', color: '7C3AED' },
    { name: 'Ollama\nIA Local', color: '15803D' },
    { name: 'CRISP\nDashboard', color: DARK },
  ];

  components.forEach((c, i) => {
    const x = 0.4 + i * 2.6;
    slide.addShape(pptx.ShapeType.rect, {
      x, y: 1.65, w: 2.3, h: 1.1, fill: { color: c.color },
    });
    slide.addText(c.name, {
      x, y: 1.65, w: 2.3, h: 1.1,
      fontSize: 15, bold: true, color: WHITE, fontFace: 'Arial', align: 'center', valign: 'middle',
    });
    if (i < components.length - 1) {
      slide.addText('→', {
        x: x + 2.3, y: 1.9, w: 0.3, h: 0.6,
        fontSize: 20, bold: true, color: MUTED, align: 'center',
      });
    }
  });

  // Key points
  const pts = [
    '✅  IA local com Ollama — dados nunca saem da empresa (LGPD)',
    '✅  Detecção de ransomware em 28 segundos, do alerta ao isolamento',
    '✅  Integração nativa com FortiGate via API REST (sessões, políticas, tráfego)',
    '✅  Playbook automatizado: detectar → analisar → isolar → bloquear C2',
    '✅  MITRE ATT&CK: técnica identificada + nível de risco + ação recomendada',
  ];
  pts.forEach((pt, i) => {
    slide.addText(pt, {
      x: 0.4, y: 3.0 + i * 0.75,
      w: 12.6, h: 0.65,
      fontSize: 16, color: DARK, fontFace: 'Arial', valign: 'middle',
      line: i < pts.length - 1 ? undefined : undefined,
    });
    if (i < pts.length - 1) {
      slide.addShape(pptx.ShapeType.line, {
        x: 0.4, y: 3.62 + i * 0.75, w: 12.6, h: 0,
        line: { color: 'E5E7EB', width: 0.5 },
      });
    }
  });
}

// ══════════════════════════════════════════════════════════════════
// SLIDE 5 — PROPOSTA PARA A FORTINET
// ══════════════════════════════════════════════════════════════════
{
  const slide = slideBase('BLOCO 3 — Proposta para a Fortinet', GREEN, '2:30 – 3:30  |  Pessoa 2');

  slide.addText('Parceria em 3 níveis', {
    x: 0.4, y: 0.85, w: 12.5, h: 0.65,
    fontSize: 26, bold: true, color: DARK, fontFace: 'Arial',
  });

  const levels = [
    {
      num: '1', title: 'Expansão Técnica',
      text: 'Suporte Fortinet para integrar FortiAnalyzer,\nFortiManager e FortiNAC via API oficial',
      color: '0369A1', bg: LBLUE,
    },
    {
      num: '2', title: 'Programa MSSP',
      text: 'CRISP como solução de referência para\nprovedores de serviços gerenciados (PMEs)',
      color: GREEN, bg: LGREEN,
    },
    {
      num: '3', title: 'Co-desenvolvimento',
      text: 'Plataforma SOC com IA local, alinhada à LGPD\ne ao mercado brasileiro — com a Fortinet',
      color: ORANGE, bg: YELLOW,
    },
  ];

  levels.forEach((l, i) => {
    const x = 0.4 + i * 4.4;
    // Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.65, w: 4.1, h: 4.4,
      fill: { color: l.bg }, line: { color: l.color, width: 2 }, rectRadius: 0.1,
    });
    // Number circle
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 1.5, y: 1.75, w: 1.1, h: 1.1, fill: { color: l.color },
    });
    slide.addText(l.num, {
      x: x + 1.5, y: 1.75, w: 1.1, h: 1.1,
      fontSize: 32, bold: true, color: WHITE, fontFace: 'Arial', align: 'center', valign: 'middle',
    });
    slide.addText(l.title, {
      x: x + 0.15, y: 3.0, w: 3.8, h: 0.65,
      fontSize: 18, bold: true, color: l.color, fontFace: 'Arial', align: 'center',
    });
    slide.addText(l.text, {
      x: x + 0.2, y: 3.75, w: 3.7, h: 1.8,
      fontSize: 15, color: DARK, fontFace: 'Arial', align: 'center', valign: 'top',
    });
  });

  // Status bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 6.2, w: 12.6, h: 0.75, fill: { color: DARK },
  });
  slide.addText('✓  Integração FortiGate 7.6 já funcionando  |  API REST  |  Token Bearer  |  Dados em tempo real', {
    x: 0.6, y: 6.2, w: 12.2, h: 0.75,
    fontSize: 15, color: WHITE, fontFace: 'Arial', valign: 'middle', align: 'center',
  });
}

// ══════════════════════════════════════════════════════════════════
// SLIDE 6 — MODELO DE NEGÓCIO
// ══════════════════════════════════════════════════════════════════
{
  const slide = slideBase('BLOCO 4 — Modelo de Negócio', ORANGE, '3:30 – 4:30  |  Pessoa 3');

  slide.addText('SOC as a Service — Receita Recorrente', {
    x: 0.4, y: 0.85, w: 12.5, h: 0.65,
    fontSize: 26, bold: true, color: DARK, fontFace: 'Arial',
  });

  // Revenue cards
  const cards = [
    { label: 'Implantação', value: 'R$ 15k – 50k', sub: 'por projeto', color: RED },
    { label: 'Monitoramento\nMensal', value: 'R$ 3k – 15k', sub: 'por empresa/mês', color: '1D4ED8' },
    { label: '10 Clientes', value: 'R$ 30k – 150k', sub: 'receita mensal recorrente', color: GREEN },
  ];
  cards.forEach((c, i) => {
    const x = 0.4 + i * 4.4;
    slide.addShape(pptx.ShapeType.rect, {
      x, y: 1.65, w: 4.1, h: 2.4, fill: { color: c.color },
    });
    slide.addText(c.label, {
      x, y: 1.75, w: 4.1, h: 0.7,
      fontSize: 16, bold: true, color: WHITE, fontFace: 'Arial', align: 'center',
    });
    slide.addText(c.value, {
      x, y: 2.3, w: 4.1, h: 0.9,
      fontSize: 28, bold: true, color: WHITE, fontFace: 'Arial', align: 'center',
    });
    slide.addText(c.sub, {
      x, y: 3.1, w: 4.1, h: 0.5,
      fontSize: 13, color: 'FFFFFF99', fontFace: 'Arial', align: 'center', italic: true,
    });
  });

  // Advantages
  const adv = [
    '💡  Custo de licenças = zero  (Wazuh + Zeek + Ollama + PostgreSQL são open source)',
    '🔒  Dados do cliente ficam na empresa — diferencial competitivo real',
    '📈  Fortinet: mais PMEs comprando FortiGate com caso de uso de alto valor',
    '🤝  Modelo MSSP: revendedores Fortinet podem oferecer CRISP como serviço',
  ];
  adv.forEach((a, i) => {
    slide.addText(a, {
      x: 0.4, y: 4.3 + i * 0.63,
      w: 12.6, h: 0.55,
      fontSize: 16, color: DARK, fontFace: 'Arial', valign: 'middle',
    });
    if (i < adv.length - 1) {
      slide.addShape(pptx.ShapeType.line, {
        x: 0.4, y: 4.83 + i * 0.63, w: 12.6, h: 0,
        line: { color: 'E5E7EB', width: 0.5 },
      });
    }
  });
}

// ══════════════════════════════════════════════════════════════════
// SLIDE 7 — CHAMADA FINAL / CTA
// ══════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  slide.background = { color: DARK };

  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.12, fill: { color: RED } });

  slide.addText('Construímos o CRISP do zero.', {
    x: 0.6, y: 0.7, w: 12, h: 0.65,
    fontSize: 28, bold: true, color: WHITE, fontFace: 'Arial',
  });
  slide.addText('O pipeline está rodando. Os dados são reais. A IA está integrada.', {
    x: 0.6, y: 1.4, w: 12, h: 0.55,
    fontSize: 20, color: MUTED, fontFace: 'Arial',
  });

  // Divider
  slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 2.1, w: 10, h: 0.05, fill: { color: RED } });

  // Big question
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 2.4, w: 12.1, h: 2.0,
    fill: { color: RED }, rectRadius: 0.1,
  });
  slide.addText(
    'Quantas PMEs brasileiras poderiam ter um\nSOC profissional amanhã com uma solução como essa?',
    {
      x: 0.8, y: 2.45, w: 11.7, h: 1.9,
      fontSize: 24, bold: true, color: WHITE, fontFace: 'Arial', align: 'center', valign: 'middle',
    }
  );

  slide.addText('Estamos prontos para conversar.', {
    x: 0.6, y: 4.7, w: 12, h: 0.6,
    fontSize: 22, bold: true, color: WHITE, fontFace: 'Arial', align: 'center',
  });

  // Tags
  const tags2 = [
    { label: 'Fortinet MSSP Ready', color: RED },
    { label: 'LGPD Compliant', color: '15803D' },
    { label: 'Open Source Stack', color: '1D4ED8' },
    { label: 'IA Local — Ollama', color: '7C3AED' },
  ];
  tags2.forEach((t, i) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.6 + i * 3.3, y: 5.5, w: 3.0, h: 0.55,
      fill: { color: DARK }, line: { color: t.color, width: 1.5 }, rectRadius: 0.07,
    });
    slide.addText(t.label, {
      x: 0.6 + i * 3.3, y: 5.5, w: 3.0, h: 0.55,
      fontSize: 13, bold: true, color: t.color, fontFace: 'Arial', align: 'center', valign: 'middle',
    });
  });

  slide.addText('Obrigado.', {
    x: 0.6, y: 6.3, w: 12, h: 0.7,
    fontSize: 18, color: MUTED, fontFace: 'Arial', align: 'center', italic: true,
  });

  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.38, w: '100%', h: 0.12, fill: { color: RED } });
}

// ══════════════════════════════════════════════════════════════════
// SAVE
// ══════════════════════════════════════════════════════════════════
pptx.writeFile({ fileName: 'D:\\marco\\crisp-soc\\Pitch_CRISP_Fortinet.pptx' })
  .then(() => console.log('Apresentação criada: D:\\marco\\crisp-soc\\Pitch_CRISP_Fortinet.pptx'))
  .catch(e => console.error(e));
