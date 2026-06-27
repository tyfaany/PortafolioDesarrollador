import jsPDF from 'jspdf';
import api from '../services/api';

const PAGE = {
  width: 210,
  height: 297,
  marginX: 14,
  marginTop: 14,
  marginBottom: 14,
};

const THEME = {
  text: [43, 52, 64],
  muted: [108, 122, 137],
  border: [233, 222, 211],
  primary: [230, 126, 34],
  primarySoft: [253, 242, 230],
  accent: [230, 126, 34],
  background: [255, 255, 255],
  chip: [248, 244, 239],
};

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

const MONTH_LABELS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateLabel(value) {
  const date = parseDateValue(value);
  if (!date) {
    return '';
  }

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = MONTH_LABELS[date.getUTCMonth()] || '';
  const year = date.getUTCFullYear();

  return month ? `${day} ${month} ${year}` : `${day} ${year}`;
}

function getMonthLabel(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const numericMonth = Number.parseInt(String(value), 10);
  if (!Number.isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
    return MONTH_LABELS[numericMonth - 1];
  }

  const normalized = String(value).trim().toLowerCase();
  const monthNames = {
    enero: 'ENE',
    february: 'FEB',
    febrero: 'FEB',
    march: 'MAR',
    marzo: 'MAR',
    april: 'ABR',
    abril: 'ABR',
    may: 'MAY',
    mayo: 'MAY',
    june: 'JUN',
    junio: 'JUN',
    july: 'JUL',
    julio: 'JUL',
    august: 'AGO',
    agosto: 'AGO',
    september: 'SEP',
    septiembre: 'SEP',
    setiembre: 'SEP',
    october: 'OCT',
    octubre: 'OCT',
    november: 'NOV',
    noviembre: 'NOV',
    december: 'DIC',
    diciembre: 'DIC',
  };

  return monthNames[normalized] || '';
}

function formatMonthYear(valueMonth, valueYear) {
  const monthLabel = getMonthLabel(valueMonth);
  const year = String(valueYear || '').trim();

  if (monthLabel && year) {
    return `${monthLabel} ${year}`;
  }

  if (year) {
    return year;
  }

  return monthLabel;
}

function formatDateRange(startValue, endValue, presentLabel = 'PRESENTE') {
  const start = formatDateLabel(startValue);
  const end = endValue ? formatDateLabel(endValue) : presentLabel;

  if (!start && !end) {
    return '';
  }

  if (!start) {
    return end;
  }

  if (!end) {
    return start;
  }

  return `${start} - ${end}`;
}

function formatJobRange(job) {
  const start = formatMonthYear(job?.start_month, job?.start_year);
  const end = job?.is_current_job
    ? 'PRESENTE'
    : formatMonthYear(job?.end_month, job?.end_year);

  if (!start && !end) {
    return '';
  }

  if (!start) {
    return end;
  }

  if (!end) {
    return start;
  }

  return `${start} - ${end}`;
}

function resolveProjectImageUrl(rawUrl) {
  if (!rawUrl) {
    return '';
  }

  if (/^https?:\/\//i.test(rawUrl) || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return rawUrl;
  }

  const apiBase = import.meta.env.VITE_LARAVEL_API_URL;
  if (!apiBase) {
    return rawUrl;
  }

  let backendOrigin = '';
  try {
    backendOrigin = new URL(apiBase).origin;
  } catch {
    return rawUrl;
  }

  if (rawUrl.startsWith('/storage/')) {
    return `${backendOrigin}${rawUrl}`;
  }

  if (rawUrl.startsWith('storage/')) {
    return `${backendOrigin}/${rawUrl}`;
  }

  if (rawUrl.startsWith('projects/')) {
    return `${backendOrigin}/storage/${rawUrl}`;
  }

  return `${backendOrigin}/${rawUrl.replace(/^\/+/, '')}`;
}

async function resolvePublicImageDataUrl(rawUrl) {
  const imageUrl = resolveProjectImageUrl(rawUrl);
  if (!imageUrl) {
    return '';
  }

  if (String(imageUrl).startsWith('data:')) {
    return imageUrl;
  }

  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (!response.ok) {
      return '';
    }

    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('No se pudo leer la imagen del proyecto.'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

function getProjectImageSource(project) {
  return (
    project?.image_url ||
    project?.image_path ||
    project?.currentImagePreview ||
    ''
  );
}

async function resolveProjectImageDataUrl(project) {
  const imageSource = getProjectImageSource(project);
  if (!imageSource) {
    return '';
  }

  if (String(imageSource).startsWith('data:')) {
    return imageSource;
  }

  if (project?.id) {
    try {
      const response = await api.get(`/projects/${project.id}/image`, {
        responseType: 'blob',
      });

      const blob = response?.data;
      if (blob instanceof Blob && blob.size > 0) {
        return await blobToDataUrl(blob);
      }
    } catch {
      // Intentamos la URL pública como respaldo.
    }
  }

  return await resolvePublicImageDataUrl(imageSource);
}

function stripHtml(value) {
  const raw = String(value || '');
  if (!raw) {
    return '';
  }

  const normalized = raw
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|ul|ol)>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n• ');

  if (typeof document === 'undefined') {
    return normalized
      .replace(/<[^>]*>/g, ' ')
      .replace(/\r/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = normalized;
  return String(wrapper.textContent || wrapper.innerText || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitLines(doc, text, maxWidth) {
  const content = String(text || '').replace(/\r/g, '').trim();
  if (!content) {
    return [];
  }

  const paragraphs = content.split(/\n+/);
  const lines = [];

  paragraphs.forEach((paragraph, index) => {
    const normalized = cleanText(paragraph);

    if (normalized) {
      lines.push(...doc.splitTextToSize(normalized, maxWidth));
    }

    if (index < paragraphs.length - 1) {
      lines.push('');
    }
  });

  return lines;
}

const RICH_BLOCK_TAGS = new Set(['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']);

const RICH_LIST_TAGS = new Set(['ul', 'ol']);

const RICH_INLINE_TAGS = new Set(['span', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'sub', 'sup']);

function cloneRichStyle(style = {}) {
  return {
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    script: '',
    size: 9.2,
    ...style,
  };
}

function resolveRichFontSize(value, fallback = 9.2) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const text = String(value).toLowerCase();

  if (text.includes('small')) return 8.1;
  if (text.includes('large')) return 10.6;
  if (text.includes('huge')) return 12.2;

  const parsed = Number.parseFloat(text);
  if (Number.isFinite(parsed) && parsed > 0) {
    if (text.includes('em') || text.includes('rem')) {
      return fallback * parsed;
    }

    if (text.includes('px')) {
      return parsed * 0.75;
    }

    if (text.includes('pt')) {
      return parsed * 0.3528;
    }

    if (text.includes('%')) {
      return fallback * (parsed / 100);
    }

    return parsed;
  }

  return fallback;
}

function resolveRichFontStyle(style = {}) {
  if (style.bold && style.italic) return 'bolditalic';
  if (style.bold) return 'bold';
  if (style.italic) return 'italic';
  return 'normal';
}

function applyRichStyleFromElement(element, inherited = {}) {
  const next = cloneRichStyle(inherited);
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'strong' || tagName === 'b') {
    next.bold = true;
  }

  if (tagName === 'em' || tagName === 'i') {
    next.italic = true;
  }

  if (tagName === 'u') {
    next.underline = true;
  }

  if (tagName === 's' || tagName === 'strike' || tagName === 'del') {
    next.strike = true;
  }

  if (tagName === 'sub') {
    next.script = 'sub';
    next.size = Math.max(6.2, next.size * 0.78);
  }

  if (tagName === 'sup') {
    next.script = 'super';
    next.size = Math.max(6.2, next.size * 0.78);
  }

  if (tagName === 'h1') {
    next.bold = true;
    next.size = Math.max(next.size, 13.5);
  } else if (tagName === 'h2') {
    next.bold = true;
    next.size = Math.max(next.size, 12.6);
  } else if (tagName === 'h3') {
    next.bold = true;
    next.size = Math.max(next.size, 11.6);
  } else if (tagName === 'h4') {
    next.bold = true;
    next.size = Math.max(next.size, 10.7);
  } else if (tagName === 'h5' || tagName === 'h6') {
    next.bold = true;
    next.size = Math.max(next.size, 10.1);
  }

  const classNames = Array.from(element.classList || []);
  classNames.forEach((className) => {
    if (className === 'ql-size-small') {
      next.size = 8.1;
    }
    if (className === 'ql-size-large') {
      next.size = Math.max(next.size, 10.6);
    }
    if (className === 'ql-size-huge') {
      next.size = Math.max(next.size, 12.2);
    }
  });

  const inlineFontWeight = String(element.style?.fontWeight || '').toLowerCase();
  if (inlineFontWeight === 'bold' || Number.parseInt(inlineFontWeight, 10) >= 600) {
    next.bold = true;
  }

  const inlineFontStyle = String(element.style?.fontStyle || '').toLowerCase();
  if (inlineFontStyle === 'italic' || inlineFontStyle === 'oblique') {
    next.italic = true;
  }

  const inlineDecoration = String(element.style?.textDecoration || '').toLowerCase();
  if (inlineDecoration.includes('underline')) {
    next.underline = true;
  }
  if (inlineDecoration.includes('line-through')) {
    next.strike = true;
  }

  const inlineFontSize = resolveRichFontSize(element.style?.fontSize, next.size);
  if (inlineFontSize) {
    next.size = inlineFontSize;
  }

  return next;
}

function collectRichRuns(node, inheritedStyle = cloneRichStyle(), runs = []) {
  Array.from(node.childNodes || []).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = String(child.textContent || '').replace(/\r/g, '');
      if (text) {
        const parts = text.split('\n');
        parts.forEach((part, index) => {
          const normalized = part.replace(/\u00A0/g, ' ').replace(/[ \t]+/g, ' ');
          if (normalized.trim()) {
            runs.push({
              text: normalized,
              style: cloneRichStyle(inheritedStyle),
            });
          }

          if (index < parts.length - 1) {
            runs.push({ text: '\n', style: cloneRichStyle(inheritedStyle) });
          }
        });
      }
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = child;
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'br') {
      runs.push({ text: '\n', style: cloneRichStyle(inheritedStyle) });
      return;
    }

    const nextStyle = applyRichStyleFromElement(element, inheritedStyle);
    collectRichRuns(element, nextStyle, runs);
  });

  return runs;
}

function parseRichBlocks(value) {
  const raw = String(value || '');
  if (!raw.trim()) {
    return [];
  }

  if (typeof document === 'undefined') {
    return [{
      type: 'paragraph',
      runs: [{ text: stripHtml(raw), style: cloneRichStyle() }],
      indent: 0,
      marker: '',
      baseSize: 9.2,
    }];
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<div>${raw}</div>`, 'text/html');
  const root = parsed.body.firstElementChild;

  if (!root) {
    return [];
  }

  const blocks = [];
  const inlineBuffer = [];

  const flushInlineBuffer = () => {
    if (!inlineBuffer.length) {
      return;
    }

    const runs = inlineBuffer.map((entry) => ({
      text: entry.text,
      style: cloneRichStyle(entry.style),
    }));
    if (runs.length) {
      blocks.push({
        type: 'paragraph',
        runs,
        indent: 0,
        marker: '',
        baseSize: 9.2,
      });
    }

    inlineBuffer.length = 0;
  };

  const pushBlock = (element, meta = {}) => {
    const runs = collectRichRuns(element, cloneRichStyle(), []);
    blocks.push({
      type: meta.type || 'paragraph',
      runs,
      indent: meta.indent || 0,
      marker: meta.marker || '',
      baseSize: meta.baseSize || 9.2,
    });
  };

    Array.from(root.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = String(child.textContent || '').replace(/\r/g, '');
      if (text) {
        const parts = text.split('\n');
        parts.forEach((part, index) => {
          const normalized = part.replace(/\u00A0/g, ' ').replace(/[ \t]+/g, ' ');
          if (normalized.trim()) {
            inlineBuffer.push({ text: normalized, style: cloneRichStyle() });
          }

          if (index < parts.length - 1) {
            inlineBuffer.push({ text: '\n', style: cloneRichStyle() });
          }
        });
      }
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = child;
    const tagName = element.tagName.toLowerCase();

    if (RICH_LIST_TAGS.has(tagName)) {
      flushInlineBuffer();
      Array.from(element.children).forEach((li, index) => {
        if (li.tagName.toLowerCase() !== 'li') {
          return;
        }

        pushBlock(li, {
          type: 'list-item',
          marker: tagName === 'ol' ? `${index + 1}.` : '•',
          indent: tagName === 'ol' ? 8.5 : 6,
          baseSize: 9.2,
        });
      });
      return;
    }

    if (RICH_BLOCK_TAGS.has(tagName)) {
      flushInlineBuffer();
      pushBlock(element, {
        type: tagName === 'blockquote' ? 'blockquote' : tagName.startsWith('h') ? 'heading' : 'paragraph',
        indent: tagName === 'blockquote' ? 5 : 0,
        baseSize: tagName === 'h1'
          ? 13.5
          : tagName === 'h2'
            ? 12.6
            : tagName === 'h3'
              ? 11.6
              : tagName === 'h4'
                ? 10.7
                : tagName === 'h5' || tagName === 'h6'
                  ? 10.1
                  : 9.2,
      });
      return;
    }

    if (RICH_INLINE_TAGS.has(tagName)) {
      collectRichRuns(element, cloneRichStyle(), inlineBuffer);
      return;
    }

    collectRichRuns(element, cloneRichStyle(), inlineBuffer);
  });

  flushInlineBuffer();
  return blocks;
}

function tokenizeRichRuns(runs) {
  const tokens = [];

  runs.forEach((run) => {
    const text = String(run?.text || '');
    if (!text) {
      return;
    }

    if (text === '\n') {
      tokens.push({ newline: true });
      return;
    }

    text.split(/(\s+)/).forEach((part) => {
      if (!part) {
        return;
      }

      if (part === '\n') {
        tokens.push({ newline: true });
        return;
      }

      if (/^\s+$/.test(part)) {
        tokens.push({
          space: true,
          text: ' ',
          style: cloneRichStyle(run.style),
        });
        return;
      }

      tokens.push({
        text: part,
        style: cloneRichStyle(run.style),
      });
    });
  });

  return tokens;
}

function resolveTokenMetrics(token) {
  const style = cloneRichStyle(token?.style);
  let fontSize = style.size || 9.2;
  let baselineOffset = 0;

  if (style.script === 'sub') {
    fontSize = Math.max(6.2, fontSize * 0.78);
    baselineOffset = fontSize * 0.13;
  } else if (style.script === 'super') {
    fontSize = Math.max(6.2, fontSize * 0.78);
    baselineOffset = -fontSize * 0.18;
  }

  return {
    style,
    fontSize,
    fontStyle: resolveRichFontStyle(style),
    baselineOffset,
  };
}

function measureRichTokenWidth(doc, token, cache) {
  const metrics = resolveTokenMetrics(token);
  const key = `${metrics.fontStyle}|${metrics.fontSize}|${token.text}`;
  if (cache.has(key)) {
    return cache.get(key);
  }

  doc.setFont('helvetica', metrics.fontStyle);
  doc.setFontSize(metrics.fontSize);
  const width = doc.getTextWidth(token.text);
  cache.set(key, width);
  return width;
}

function wrapRichTokens(doc, tokens, maxWidth) {
  const cache = new Map();
  const lines = [];
  let currentLine = [];
  let currentWidth = 0;

  const pushLine = () => {
    lines.push(currentLine);
    currentLine = [];
    currentWidth = 0;
  };

  const pushToken = (token) => {
    const width = measureRichTokenWidth(doc, token, cache);
    currentLine.push({ ...token, width });
    currentWidth += width;
  };

  const breakLongToken = (token) => {
    const chunks = doc.splitTextToSize(String(token.text || ''), maxWidth);

    chunks.forEach((chunk) => {
      const chunkToken = { ...token, text: chunk };
      const chunkWidth = measureRichTokenWidth(doc, chunkToken, cache);

      if (currentLine.length > 0 && currentWidth + chunkWidth > maxWidth) {
        pushLine();
      }

      pushToken(chunkToken);
    });
  };

  tokens.forEach((token) => {
    if (token.newline) {
      pushLine();
      return;
    }

    if (token.space) {
      if (currentLine.length > 0) {
        pushToken(token);
      }
      return;
    }

    const width = measureRichTokenWidth(doc, token, cache);
    if (currentLine.length > 0 && currentWidth + width > maxWidth) {
      pushLine();
    }

    if (width > maxWidth) {
      breakLongToken(token);
      return;
    }

    pushToken(token);
  });

  if (currentLine.length > 0 || !lines.length) {
    lines.push(currentLine);
  }

  return lines;
}

function measureRichContentHeight(doc, value, maxWidth, baseSize = 9.2, lineFactor = 1.25) {
  const blocks = parseRichBlocks(value);
  if (!blocks.length) {
    return 0;
  }

  let height = 0;
  const blockGap = 1.2;

  blocks.forEach((block, blockIndex) => {
    const indent = block.indent || 0;
    const blockWidth = Math.max(10, maxWidth - indent);
    const tokens = tokenizeRichRuns(block.runs);
    const lines = wrapRichTokens(doc, tokens, blockWidth);

    const lineHeights = lines.map((line) => {
      const lineSize = Math.max(
        baseSize,
        block.baseSize || baseSize,
        ...line.map((segment) => resolveTokenMetrics(segment).fontSize),
      );
      return lineSize * 0.3528 * lineFactor;
    });

    if (lineHeights.length > 0) {
      height += lineHeights.reduce((sum, value) => sum + value, 0);
    } else {
      height += baseSize * 0.3528 * lineFactor;
    }

    if (blockIndex < blocks.length - 1) {
      height += blockGap;
    }
  });

  return height;
}

function drawRichContent(doc, x, y, maxWidth, value, baseSize = 9.2, lineFactor = 1.25) {
  const blocks = parseRichBlocks(value);
  if (!blocks.length) {
    return 0;
  }

  const blockGap = 1.2;
  const cache = new Map();
  let cursorY = y;

  blocks.forEach((block, blockIndex) => {
    const indent = block.indent || 0;
    const blockWidth = Math.max(10, maxWidth - indent);
    const textX = x + indent;
    const markerX = x;
    const tokens = tokenizeRichRuns(block.runs);
    const lines = wrapRichTokens(doc, tokens, blockWidth);
    const markerWidth = block.marker ? doc.getTextWidth(block.marker) : 0;

    if (block.marker) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(baseSize);
      doc.setTextColor(...THEME.muted);
      doc.text(block.marker, markerX, cursorY);
    }

    lines.forEach((line, lineIndex) => {
      const lineSize = Math.max(
        baseSize,
        block.baseSize || baseSize,
        ...line.map((segment) => resolveTokenMetrics(segment).fontSize),
      );
      const lineHeight = lineSize * 0.3528 * lineFactor;
      let cursorX = textX + (block.marker && lineIndex === 0 ? markerWidth + 1.8 : 0);
      let lineMaxSize = lineSize;

      line.forEach((segment) => {
        const metrics = resolveTokenMetrics(segment);
        const segmentWidth = measureRichTokenWidth(doc, segment, cache);
        lineMaxSize = Math.max(lineMaxSize, metrics.fontSize);

        doc.setFont('helvetica', metrics.fontStyle);
        doc.setFontSize(metrics.fontSize);
        doc.setTextColor(...THEME.text);
        doc.text(segment.text, cursorX, cursorY + metrics.baselineOffset);

        if (metrics.style.underline) {
          doc.setLineWidth(0.25);
          doc.line(cursorX, cursorY + metrics.baselineOffset + 0.55, cursorX + segmentWidth, cursorY + metrics.baselineOffset + 0.55);
        }

        if (metrics.style.strike) {
          doc.setLineWidth(0.25);
          doc.line(cursorX, cursorY + metrics.baselineOffset - 1.35, cursorX + segmentWidth, cursorY + metrics.baselineOffset - 1.35);
        }

        cursorX += segmentWidth;
      });

      cursorY += lineHeight;
      if (lineIndex < lines.length - 1) {
        cursorY += 0.2;
      }
    });

    if (blockIndex < blocks.length - 1) {
      cursorY += blockGap;
    }
  });

  return cursorY - y;
}

function measureHeight(doc, text, maxWidth, fontSize = 10, lineFactor = 1.25) {
  const lines = splitLines(doc, text, maxWidth);
  if (!lines.length) {
    return 0;
  }

  const lineHeight = fontSize * 0.3528 * lineFactor;
  return lines.length * lineHeight;
}

function addPageChrome(doc, pageNumber, totalPages) {
  const { marginX } = PAGE;

  doc.setDrawColor(...THEME.border);
  doc.setLineWidth(0.3);
  doc.line(marginX, 10, PAGE.width - marginX, 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...THEME.accent);
  doc.text('DevStack', marginX, 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...THEME.muted);
  doc.text(`${pageNumber} / ${totalPages}`, PAGE.width - marginX, 7.5, { align: 'right' });
}

function ensureSpace(doc, state, neededHeight) {
  if (state.y + neededHeight <= PAGE.height - PAGE.marginBottom) {
    return;
  }

  doc.addPage();
  state.page += 1;
  state.y = PAGE.marginTop + 3;
}

function drawSectionHeader(doc, state, title, subtitle = '') {
  const titleHeight = 7;
  const subtitleHeight = subtitle ? 4.5 : 0;
  ensureSpace(doc, state, titleHeight + subtitleHeight + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...THEME.text);
  doc.text(title, PAGE.marginX, state.y + 4.4);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...THEME.muted);
    doc.text(splitLines(doc, subtitle, PAGE.width - PAGE.marginX * 2), PAGE.marginX, state.y + 9.2);
    state.y += 14.5;
  } else {
    state.y += 9;
  }
}

function drawChip(doc, x, y, label, variant = 'default') {
  const text = cleanText(label);
  if (!text) {
    return { width: 0, height: 0 };
  }

  const paddingX = 2.8;
  const paddingY = 1.8;
  const fontSize = 8.3;
  const maxChipWidth = PAGE.width - PAGE.marginX * 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);

  let displayText = text;
  while (displayText.length > 1 && doc.getTextWidth(displayText) + paddingX * 2 > maxChipWidth) {
    displayText = displayText.slice(0, -1);
  }

  const width = Math.min(doc.getTextWidth(displayText) + paddingX * 2, maxChipWidth);
  const height = fontSize * 0.3528 + paddingY * 2;

  let fill = THEME.chip;
  let textColor = THEME.text;
  let borderColor = THEME.border;

  if (variant === 'accent') {
    fill = THEME.primarySoft;
    textColor = THEME.primary;
    borderColor = THEME.primary;
  }

  doc.setFillColor(...fill);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(x, y, width, height, 3.2, 3.2, 'FD');
  doc.setTextColor(...textColor);
  doc.text(displayText, x + paddingX, y + height - paddingY - 0.2);

  return { width, height };
}

function drawChipRow(doc, state, labels, variant = 'default') {
  const chips = labels.filter(Boolean);
  if (!chips.length) {
    return;
  }

  const gap = 2.6;
  const maxWidth = PAGE.width - PAGE.marginX * 2;
  let x = PAGE.marginX;
  let rowHeight = 0;

  chips.forEach((label) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.3);
    const estimatedWidth = doc.getTextWidth(cleanText(label)) + 2.8 * 2;

    if (x > PAGE.marginX && x + estimatedWidth > PAGE.marginX + maxWidth) {
      state.y += rowHeight + 2.2;
      x = PAGE.marginX;
      rowHeight = 0;
    }

    const chip = drawChip(doc, x, state.y, label, variant);
    rowHeight = Math.max(rowHeight, chip.height);
    x += chip.width + gap;
  });

  state.y += rowHeight + 2.6;
}

function measureChipRowsHeight(doc, labels, availableWidth) {
  const chips = labels.filter(Boolean);
  if (!chips.length) {
    return 0;
  }

  const gap = 2.4;
  const rowGap = 2.2;
  const chipHeight = 8.3 * 0.3528 + 1.8 * 2;
  let rows = 1;
  let usedWidth = 0;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.3);

  chips.forEach((label) => {
    const chipWidth = doc.getTextWidth(cleanText(label)) + 2.8 * 2;
    if (usedWidth > 0 && usedWidth + chipWidth > availableWidth) {
      rows += 1;
      usedWidth = 0;
    }

    usedWidth += chipWidth + gap;
  });

  return rows * chipHeight + (rows - 1) * rowGap;
}

function fitImageIntoBox(doc, image, maxWidth, maxHeight) {
  let width = maxWidth;
  let height = maxHeight;

  try {
    const properties = doc.getImageProperties(image);
    const imageWidth = Number(properties?.width || 0);
    const imageHeight = Number(properties?.height || 0);

    if (imageWidth > 0 && imageHeight > 0) {
      const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
      width = imageWidth * scale;
      height = imageHeight * scale;
    }
  } catch {
    // Si jsPDF no puede leer proporciones, usamos el contenedor máximo.
  }

  return { width, height };
}

function drawCard(doc, state, options = {}) {
  const {
    title = '',
    subtitle = '',
    body = '',
    meta = [],
    chips = [],
    accent = false,
    image = '',
    imageHeight = 24,
    width = PAGE.width - PAGE.marginX * 2,
    minHeight = 24,
    links = [],
  } = options;

  const innerX = PAGE.marginX + 5;
  const innerWidth = width - 10;
  const cardPadding = 5;
  const bodyInsetX = 0;
  const bodyContentX = innerX + bodyInsetX;
  const bodyContentWidth = innerWidth - bodyInsetX * 2;
  const imageBox = image ? fitImageIntoBox(doc, image, innerWidth, imageHeight) : null;
  const titleHeight = title ? measureHeight(doc, title, innerWidth - 20, 11.5, 1.2) : 0;
  const richBodyHeight = body ? measureRichContentHeight(doc, body, bodyContentWidth, 9.2, 1.25) : 0;
  const subtitleHeight = subtitle ? measureHeight(doc, subtitle, innerWidth - 2 * cardPadding, 8.8, 1.2) : 0;
  const metaText = meta.filter(Boolean).join(' · ');
  const metaHeight = metaText ? measureHeight(doc, metaText, innerWidth - 2 * cardPadding, 8.5, 1.2) : 0;
  const chipsHeight = chips.length ? measureChipRowsHeight(doc, chips, innerWidth - 10) : 0;
  const linksHeight = links.length ? links.length * 4.0 : 0;
  const topPadding = 9.5;
  const bottomPadding = 3.5;
  const sectionGap = 0.8;
  let contentHeight = topPadding;

  if (imageBox) {
    contentHeight += imageBox.height + 3;
  }

  if (titleHeight) {
    contentHeight += titleHeight;
    if (subtitleHeight || metaHeight || richBodyHeight || chipsHeight || linksHeight) {
      contentHeight += sectionGap;
    }
  }

  if (subtitleHeight) {
    contentHeight += subtitleHeight;
    if (metaHeight || richBodyHeight || chipsHeight || linksHeight) {
      contentHeight += sectionGap;
    }
  }

  if (metaHeight) {
    contentHeight += metaHeight;
    if (richBodyHeight || chipsHeight || linksHeight) {
      contentHeight += sectionGap;
    }
  }

  if (richBodyHeight) {
    contentHeight += richBodyHeight;
    if (chipsHeight || linksHeight) {
      contentHeight += 1.2;
    }
  }

  if (chipsHeight) {
    contentHeight += chipsHeight;
    if (linksHeight) {
      contentHeight += 0.2;
    }
  }

  if (linksHeight) {
    contentHeight += linksHeight;
  }

  const totalHeight = Math.max(
    minHeight,
    contentHeight + bottomPadding,
  );

  ensureSpace(doc, state, totalHeight + 2);

  doc.setFillColor(...THEME.background);
  doc.setDrawColor(...THEME.border);
  doc.roundedRect(PAGE.marginX, state.y, width, totalHeight, 3.2, 3.2, 'FD');

  let cursorY = state.y + topPadding;

  if (image) {
    const imageFormat = String(image).split(';')[0].split('/')[1]?.toUpperCase() || 'JPEG';
    const normalizedFormat = imageFormat === 'JPG' ? 'JPEG' : imageFormat;
    const imageX = innerX + Math.max(0, (innerWidth - imageBox.width) / 2);
    doc.addImage(image, normalizedFormat, imageX, cursorY, imageBox.width, imageBox.height, undefined, 'FAST');
    cursorY += imageBox.height + 3;
  }

  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...THEME.text);
    doc.text(splitLines(doc, title, innerWidth - 20), innerX, cursorY);
    cursorY += titleHeight + (subtitleHeight || metaHeight || richBodyHeight || chipsHeight || linksHeight ? sectionGap : 0);
  }

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(...THEME.muted);
    doc.text(splitLines(doc, subtitle, innerWidth - 2 * cardPadding), innerX, cursorY);
    cursorY += subtitleHeight + (metaHeight || richBodyHeight || chipsHeight || linksHeight ? sectionGap : 0);
  }

  if (metaText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...THEME.primary);
    doc.text(splitLines(doc, metaText, innerWidth - 2 * cardPadding), innerX, cursorY);
    cursorY += metaHeight + (richBodyHeight || chipsHeight || linksHeight ? sectionGap : 0);
  }

  if (body) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(...THEME.text);
    cursorY += drawRichContent(doc, bodyContentX, cursorY, bodyContentWidth, body, 9.2, 1.25);
    cursorY += chipsHeight || linksHeight ? 1.2 : 0;
  }

  if (chips.length) {
    let x = innerX;
    let rowY = cursorY;
    let rowHeight = 0;
    chips.forEach((chip, index) => {
      const chipBox = drawChip(doc, x, rowY, chip, accent ? 'accent' : 'default');
      rowHeight = Math.max(rowHeight, chipBox.height);
      x += chipBox.width + 2.4;

      if (x > innerX + innerWidth - 30 || index === chips.length - 1) {
        rowY += rowHeight + 2.2;
        x = innerX;
        rowHeight = 0;
      }
    });
    cursorY = rowY + (linksHeight ? 0.2 : 0);
  }

  if (links.length) {
    links.forEach((link) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(...THEME.primary);
      doc.textWithLink(cleanText(link.label), innerX, cursorY + 2.5, { url: cleanText(link.href) });
      cursorY += 4.0;
    });
  }

  state.y += totalHeight + 4;
}

function drawContactGrid(doc, state, contacts = [], links = []) {
  const entries = contacts.filter(Boolean);
  const cardWidth = (PAGE.width - PAGE.marginX * 2 - 4) / 2;
  const cardHeight = 18;

  if (entries.length > 0) {
    ensureSpace(doc, state, Math.ceil(entries.length / 2) * (cardHeight + 4) + 4);

    let index = 0;
    while (index < entries.length) {
      const left = entries[index];
      const right = entries[index + 1];
      const rowY = state.y;

      [left, right].forEach((entry, col) => {
        if (!entry) {
          return;
        }

        const x = PAGE.marginX + col * (cardWidth + 4);
        doc.setFillColor(...THEME.background);
        doc.setDrawColor(...THEME.border);
        doc.roundedRect(x, rowY, cardWidth, cardHeight, 2.5, 2.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(...THEME.muted);
        doc.text(entry.label.toUpperCase(), x + 6, rowY + 5.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.2);
        doc.setTextColor(...THEME.text);
        doc.text(splitLines(doc, entry.value, cardWidth - 8), x + 6, rowY + 10.6);
      });

      state.y += cardHeight + 4;
      index += 2;
    }
  }

  if (links.length > 0) {
    ensureSpace(doc, state, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.2);
    doc.setTextColor(...THEME.muted);
    doc.text('Redes', PAGE.marginX, state.y);
    state.y += 4.5;

    let x = PAGE.marginX;
    const gap = 2.5;
    links.forEach((link) => {
      const label = cleanText(link.label);
      const width = doc.getTextWidth(label) + 10;
      const chipHeight = 8.2;
      if (x + width > PAGE.width - PAGE.marginX) {
        x = PAGE.marginX;
        state.y += chipHeight + 2.5;
      }

      doc.setFillColor(...THEME.chip);
      doc.setDrawColor(...THEME.border);
      doc.roundedRect(x, state.y, width, chipHeight, 3, 3, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(...THEME.primary);
      doc.textWithLink(label, x + 4, state.y + 5.3, { url: cleanText(link.href) });
      x += width + gap;
    });
    state.y += 12;
  }
}

function normalizeSkillLevel(level) {
  const value = cleanText(level);
  if (!value) {
    return '';
  }

  const normalized = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (['avanzado', 'advanced', 'alto', 'high', 'expert', 'experto'].includes(normalized)) {
    return 'Avanzado';
  }

  if (['intermedio', 'medio', 'medium', 'mid'].includes(normalized)) {
    return 'Intermedio';
  }

  if (['basico', 'basic', 'bajo', 'starter', 'principiante', 'junior'].includes(normalized)) {
    return 'Básico';
  }

  return value;
}

function getSkillLevelVariant(level) {
  const normalized = normalizeSkillLevel(level);
  if (normalized === 'Avanzado') {
    return 'accent';
  }

  return 'default';
}

function measureChipBoxWidth(doc, label) {
  const text = cleanText(label);
  if (!text) {
    return 0;
  }

  return doc.getTextWidth(text) + 5.6 * 2;
}

function drawSkillRow(doc, state, skill) {
  const name = cleanText(skill?.name || skill?.label || '');
  if (!name) {
    return;
  }

  const level = normalizeSkillLevel(skill?.level || '');
  const evidenceUrl = cleanText(skill?.evidence_url || skill?.link || skill?.url || '');
  const rowWidth = PAGE.width - PAGE.marginX * 2;
  const paddingX = 5;
  const badgeLabel = level || 'Sin nivel';
  const badgeWidth = measureChipBoxWidth(doc, badgeLabel);
  const badgeX = PAGE.marginX + rowWidth - badgeWidth - paddingX;
  const nameMaxWidth = Math.max(42, badgeX - (PAGE.marginX + paddingX) - 4);
  const nameHeight = measureHeight(doc, name, nameMaxWidth, 9.2, 1.15) || 3.8;
  const evidenceHeight = evidenceUrl ? 4.2 : 0;
  const rowHeight = Math.max(11.5, nameHeight + evidenceHeight + 7.4);

  ensureSpace(doc, state, rowHeight + 1.8);

  doc.setFillColor(...THEME.background);
  doc.setDrawColor(...THEME.border);
  doc.roundedRect(PAGE.marginX, state.y, rowWidth, rowHeight, 2.8, 2.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.2);
  doc.setTextColor(...THEME.text);
  doc.text(splitLines(doc, name, nameMaxWidth), PAGE.marginX + paddingX, state.y + 5.6);

  const badgeVariant = getSkillLevelVariant(level);
  const badgeY = state.y + 2.4;
  drawChip(doc, badgeX, badgeY, badgeLabel, badgeVariant);

  if (evidenceUrl) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...THEME.primary);
    doc.textWithLink('Evidencia', PAGE.marginX + paddingX, state.y + rowHeight - 2.8, { url: evidenceUrl });
  }

  state.y += rowHeight + 2.2;
}

function drawSkillSectionTitle(doc, state, title, subtitle = '') {
  ensureSpace(doc, state, subtitle ? 10 : 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.4);
  doc.setTextColor(...THEME.text);
  doc.text(title, PAGE.marginX, state.y);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(...THEME.muted);
    doc.text(splitLines(doc, subtitle, PAGE.width - PAGE.marginX * 2), PAGE.marginX, state.y + 4.2);
    state.y += 8.2;
  } else {
    state.y += 5.8;
  }
}

async function blobToDataUrl(blob) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(blob);
  });
}

async function resolvePhotoDataUrl(profile) {
  const photoUrl = profile?.photoUrl || profile?.profile_photo_url || profile?.profilePhotoUrl || '';

  if (!photoUrl) {
    return '';
  }

  if (String(photoUrl).startsWith('data:')) {
    return photoUrl;
  }

  try {
    const cacheBustedUrl = (() => {
      try {
        const url = new URL(photoUrl, window.location.origin);
        url.searchParams.set('pdf', String(Date.now()));
        return url.toString();
      } catch {
        return `${photoUrl}${photoUrl.includes('?') ? '&' : '?'}pdf=${Date.now()}`;
      }
    })();

    const response = await fetch(cacheBustedUrl, { mode: 'cors', cache: 'no-store' });
    if (!response.ok) {
      throw new Error('No se pudo leer la imagen directamente.');
    }

    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    if (!profile?.id) {
      return '';
    }

    try {
      const response = await api.get(`/users/${profile.id}/profile-photo`, {
        responseType: 'blob',
        params: { pdf: Date.now() },
      });

      const blob = response?.data;
      if (blob instanceof Blob && blob.size > 0) {
        return await blobToDataUrl(blob);
      }
    } catch {
      return '';
    }
  }

  return '';
}

export async function exportarPerfilPDF(profile, nombreArchivo = 'perfil.pdf') {
  if (!profile) {
    throw new Error('No se encontró el perfil a exportar.');
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const state = {
    y: PAGE.marginTop,
    page: 1,
    totalPages: 1,
  };

  const totalProjects = Array.isArray(profile.projects) ? profile.projects.length : 0;
  const totalRepos = Array.isArray(profile.githubRepositories) ? profile.githubRepositories.length : 0;
  const totalSkills = (Array.isArray(profile.skills) ? profile.skills.length : 0) + (Array.isArray(profile.softSkills) ? profile.softSkills.length : 0);
  const totalExp = Array.isArray(profile.jobs) ? profile.jobs.length : 0;
  const totalStudies = Array.isArray(profile.studies) ? profile.studies.length : 0;

  const headerWidth = PAGE.width - PAGE.marginX * 2;
  const headerHeight = 62;
  doc.setFillColor(...THEME.background);
  doc.setDrawColor(...THEME.border);
  doc.roundedRect(PAGE.marginX, state.y, headerWidth, headerHeight, 4, 4, 'FD');

  const photoX = PAGE.marginX + 6;
  const photoY = state.y + 6;
  const photoSize = 42;
  const photoUrl = await resolvePhotoDataUrl(profile);

  if (photoUrl) {
    const inferredFormat = photoUrl.split(';')[0].split('/')[1]?.toUpperCase();
    const format = inferredFormat && ['PNG', 'WEBP', 'JPEG', 'JPG'].includes(inferredFormat)
      ? inferredFormat === 'JPG'
        ? 'JPEG'
        : inferredFormat
      : 'JPEG';
    doc.addImage(photoUrl, format, photoX, photoY, photoSize, photoSize, undefined, 'FAST');
  } else {
    doc.setFillColor(...THEME.accent);
    doc.roundedRect(photoX, photoY, photoSize, photoSize, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    const initials = cleanText(profile.name)
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
    doc.text(initials || 'P', photoX + photoSize / 2, photoY + 24, { align: 'center' });
  }

  const textX = photoX + photoSize + 8;
  const textWidth = headerWidth - (textX - PAGE.marginX) - 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...THEME.accent);
  doc.text(splitLines(doc, profile.name || 'Usuario', textWidth), textX, state.y + 11);

  if (profile.role) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...THEME.primary);
    doc.text(splitLines(doc, profile.role, textWidth), textX, state.y + 19);
  }

  const statItems = [
    { label: 'Proyectos', value: totalProjects + totalRepos },
    { label: 'Experiencias', value: totalExp },
    { label: 'Formaciones', value: totalStudies },
    { label: 'Habilidades', value: totalSkills },
  ];

  let statY = state.y + 24;
  const statWidth = Math.max(29, (textWidth - 6) / 2);
  statItems.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = textX + col * (statWidth + 3);
    const y = statY + row * 13;

    doc.setFillColor(...THEME.primarySoft);
    doc.setDrawColor(...THEME.border);
    doc.roundedRect(x, y, statWidth, 11, 2.5, 2.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...THEME.text);
    doc.text(String(item.value), x + 2.5, y + 4.9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(...THEME.muted);
    doc.text(item.label.toUpperCase(), x + 2.5, y + 8.3);
  });

  state.y += headerHeight + 5;

  drawSectionHeader(doc, state, 'Contacto y redes');

  const contactColumns = [
    profile.contact?.phone ? { label: 'Teléfono', value: profile.contact.phone } : null,
    profile.contact?.mobile ? { label: 'Móvil', value: profile.contact.mobile } : null,
    profile.contact?.email ? { label: 'Correo', value: profile.contact.email } : null,
    profile.contact?.address ? { label: 'Dirección', value: profile.contact.address } : null,
  ].filter(Boolean);

  const contactLinks = [
    profile.githubUrl ? { label: 'GitHub', href: profile.githubUrl } : null,
    profile.linkedinUrl ? { label: 'LinkedIn', href: profile.linkedinUrl } : null,
    profile.instagramUrl ? { label: 'Instagram', href: profile.instagramUrl } : null,
    profile.facebookUrl ? { label: 'Facebook', href: profile.facebookUrl } : null,
  ].filter(Boolean);

  drawContactGrid(doc, state, contactColumns, contactLinks);

  drawSectionHeader(doc, state, 'Biografía');
  drawCard(doc, state, {
    body: profile.biography || 'Sin biografía disponible.',
    minHeight: 28,
  });

  if (Array.isArray(profile.jobs) && profile.jobs.length > 0) {
    drawSectionHeader(doc, state, 'Experiencia laboral', 'Historial profesional.');

    profile.jobs.forEach((job) => {
      const title = cleanText(job?.position || job?.job_title || job?.role || job?.title || job?.cargo || 'Experiencia');
      const company = cleanText(job?.company_name || 'Empresa no especificada');
      const range = cleanText(formatJobRange(job));
      const body = job?.description || job?.achievements || job?.achievement || job?.achivements || job?.logros || '';
      drawCard(doc, state, {
        title,
        subtitle: company,
        meta: [range].filter(Boolean),
        body,
        minHeight: 28,
        links: job?.evidence_url ? [{ label: 'Ver evidencia', href: job.evidence_url }] : [],
      });
    });
  }

  if (Array.isArray(profile.studies) && profile.studies.length > 0) {
    drawSectionHeader(doc, state, 'Formación', 'Formación académica.');

    profile.studies.forEach((study) => {
      const title = cleanText(study?.degree || study?.title || 'Estudio');
      const institution = cleanText(study?.academic_institution || study?.institution || 'Institución no especificada');
      const range = cleanText(formatDateRange(study?.start_date, study?.end_date, 'PRESENTE'));
      const achievements = study?.achievements || '';
      drawCard(doc, state, {
        title,
        subtitle: institution,
        meta: [range].filter(Boolean),
        body: achievements,
        minHeight: 24,
      });
    });
  }

  const technicalSkills = Array.isArray(profile.skills)
    ? profile.skills
        .map((skill) => {
          if (!skill) {
            return null;
          }

          return {
            name: cleanText(skill?.name || skill?.label || ''),
            level: cleanText(skill?.level || skill?.pivot?.level || ''),
            evidence_url: cleanText(skill?.evidence_url || skill?.pivot?.evidence_url || ''),
          };
        })
        .filter((skill) => skill?.name)
    : [];

  const softSkills = Array.isArray(profile.softSkills)
    ? profile.softSkills
        .map((skill) => {
          if (!skill) {
            return null;
          }

          return {
            name: cleanText(skill?.name || skill?.label || ''),
            evidence_url: cleanText(skill?.evidence_url || skill?.pivot?.evidence_url || ''),
          };
        })
        .filter((skill) => skill?.name)
    : [];

  if (technicalSkills.length > 0 || softSkills.length > 0) {
    drawSectionHeader(doc, state, 'Habilidades');

    if (technicalSkills.length > 0) {
      drawSkillSectionTitle(doc, state, 'Técnicas', 'Nivel y evidencia cuando exista.');
      technicalSkills.slice(0, 30).forEach((skill) => {
        drawSkillRow(doc, state, skill);
      });
    }

    if (softSkills.length > 0) {
      if (technicalSkills.length > 0) {
        state.y += 1.2;
      }

      drawSkillSectionTitle(doc, state, 'Blandas', 'Competencias personales y de colaboración.');
      drawChipRow(
        doc,
        state,
        softSkills.slice(0, 40).map((skill) => skill.name),
        'default',
      );
    }
  }

  const projects = Array.isArray(profile.projects) ? profile.projects : [];
  const repositories = Array.isArray(profile.githubRepositories) ? profile.githubRepositories : [];

  if (projects.length > 0 || repositories.length > 0) {
    drawSectionHeader(doc, state, 'Proyectos y repositorios', 'Listado formal por secciones.');
  }

  for (const project of projects) {
    const title = cleanText(project?.title || project?.name || 'Proyecto');
    const description = project?.description || 'Sin descripción disponible.';
    const range = cleanText(formatDateRange(project?.start_date, project?.end_date, project?.is_in_progress ? 'EN PROGRESO' : 'PRESENTE'));
    const technologies = Array.isArray(project?.technologies)
      ? project.technologies
          .map((technology) => cleanText(technology?.name || technology?.label || technology?.title || technology?.value || technology))
          .filter(Boolean)
      : [];
    const links = [
      project?.demo_url ? { label: 'Demo', href: project.demo_url } : null,
      project?.repo_url ? { label: 'Repositorio', href: project.repo_url } : null,
    ].filter(Boolean);
    const image = await resolveProjectImageDataUrl(project);

    drawCard(doc, state, {
      title,
      meta: [range].filter(Boolean),
      body: description,
      chips: technologies.slice(0, 6),
      links,
      accent: true,
      image,
      imageHeight: 42,
      minHeight: 30,
    });
  }

  repositories.forEach((repo) => {
    const title = cleanText(repo?.title || 'Repositorio');
    const description = stripHtml(repo?.description || 'Sin descripción disponible.');
    const meta = [
      repo?.language ? `Lenguaje: ${repo.language}` : '',
      typeof repo?.starsCount === 'number' ? `Estrellas: ${repo.starsCount}` : '',
      typeof repo?.forksCount === 'number' ? `Forks: ${repo.forksCount}` : '',
      repo?.isFork ? 'Fork' : '',
    ].filter(Boolean);

    drawCard(doc, state, {
      title,
      meta,
      body: description,
      links: repo?.repoUrl ? [{ label: 'Abrir en GitHub', href: repo.repoUrl }] : [],
      minHeight: 28,
    });
  });

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    addPageChrome(doc, page, totalPages);
  }

  doc.save(nombreArchivo);
}
