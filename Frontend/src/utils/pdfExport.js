import jsPDF from 'jspdf';

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

function stripHtml(value) {
  const raw = cleanText(value);
  if (!raw) {
    return '';
  }

  if (typeof document === 'undefined') {
    return raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = raw;
  return cleanText(wrapper.textContent || wrapper.innerText || '');
}

function splitLines(doc, text, maxWidth) {
  const content = cleanText(text);
  if (!content) {
    return [];
  }

  return doc.splitTextToSize(content, maxWidth);
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
  const usableWidth = PAGE.width - marginX * 2;

  doc.setDrawColor(...THEME.border);
  doc.setLineWidth(0.3);
  doc.line(marginX, 10, PAGE.width - marginX, 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...THEME.accent);
  doc.text('SoftSave Portfolio', marginX, 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...THEME.muted);
  doc.text(`${pageNumber} / ${totalPages}`, PAGE.width - marginX, 7.5, { align: 'right' });

  doc.setFillColor(...THEME.primarySoft);
  doc.roundedRect(marginX, PAGE.height - 9, usableWidth, 5.2, 1.6, 1.6, 'F');
}

function ensureSpace(doc, state, neededHeight) {
  if (state.y + neededHeight <= PAGE.height - PAGE.marginBottom) {
    return;
  }

  doc.addPage();
  state.page += 1;
  state.y = PAGE.marginTop + 3;
  addPageChrome(doc, state.page, state.totalPages);
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
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);
  const width = doc.getTextWidth(text) + paddingX * 2;
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
  doc.text(text, x + paddingX, y + height - paddingY - 0.2);

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

  chips.forEach((label, index) => {
    const chip = drawChip(doc, x, state.y, label, variant);
    if (index === 0) {
      rowHeight = chip.height;
    } else {
      rowHeight = Math.max(rowHeight, chip.height);
    }

    x += chip.width + gap;
    if (x + chip.width > PAGE.marginX + maxWidth) {
      state.y += rowHeight + 2.2;
      x = PAGE.marginX;
      const nextChip = drawChip(doc, x, state.y, label, variant);
      rowHeight = nextChip.height;
      x += nextChip.width + gap;
    }
  });

  state.y += rowHeight + 2.6;
}

function drawCard(doc, state, options = {}) {
  const {
    title = '',
    subtitle = '',
    body = '',
    meta = [],
    chips = [],
    accent = false,
    width = PAGE.width - PAGE.marginX * 2,
    minHeight = 24,
    links = [],
  } = options;

  const innerX = PAGE.marginX + 5;
  const innerWidth = width - 10;
  const cardPadding = 5;

  const bodyHeight = body ? measureHeight(doc, body, innerWidth - 2 * cardPadding, 9.4, 1.3) : 0;
  const subtitleHeight = subtitle ? measureHeight(doc, subtitle, innerWidth - 2 * cardPadding, 8.8, 1.2) : 0;
  const metaHeight = meta.length ? 5.5 : 0;
  const chipsRows = chips.length ? Math.ceil(chips.length / 4) : 0;
  const chipsHeight = chipsRows ? chipsRows * 7.8 + (chipsRows - 1) * 2.2 : 0;
  const linksHeight = links.length ? links.length * 4.6 : 0;
  const totalHeight = Math.max(
    minHeight,
    (title ? 11 : 0) + subtitleHeight + metaHeight + bodyHeight + chipsHeight + linksHeight + 14,
  );

  ensureSpace(doc, state, totalHeight + 2);

  doc.setFillColor(...THEME.background);
  doc.setDrawColor(...THEME.border);
  doc.roundedRect(PAGE.marginX, state.y, width, totalHeight, 3.2, 3.2, 'FD');

  let cursorY = state.y + 9.5;

  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...THEME.text);
    doc.text(splitLines(doc, title, innerWidth - 20), innerX, cursorY);
    cursorY += 6.4;
  }

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(...THEME.muted);
    doc.text(splitLines(doc, subtitle, innerWidth - 2 * cardPadding), innerX, cursorY);
    cursorY += subtitleHeight + 1.6;
  }

  if (meta.length) {
    const metaText = meta.filter(Boolean).join(' · ');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...THEME.primary);
    doc.text(splitLines(doc, metaText, innerWidth - 2 * cardPadding), innerX, cursorY);
    cursorY += metaHeight + 1.2;
  }

  if (body) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(...THEME.text);
    doc.text(splitLines(doc, stripHtml(body), innerWidth - 2 * cardPadding), innerX, cursorY);
    cursorY += bodyHeight + 1.6;
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
    cursorY = rowY;
  }

  if (links.length) {
    links.forEach((link) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(...THEME.primary);
      doc.textWithLink(cleanText(link.label), innerX, cursorY + 2.5, { url: cleanText(link.href) });
      cursorY += 4.4;
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
  const paddingY = 3.2;
  const badgeLabel = level || 'Sin nivel';
  const badgeWidth = measureChipBoxWidth(doc, badgeLabel);
  const badgeHeight = 7.4;
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

async function resolvePhotoDataUrl(photoUrl) {
  if (!photoUrl) {
    return '';
  }

  if (String(photoUrl).startsWith('data:')) {
    return photoUrl;
  }

  try {
    const response = await fetch(photoUrl, { mode: 'cors' });
    if (!response.ok) {
      return '';
    }

    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
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

  addPageChrome(doc, 1, 1);

  const headerWidth = PAGE.width - PAGE.marginX * 2;
  const headerHeight = 62;
  doc.setFillColor(...THEME.background);
  doc.setDrawColor(...THEME.border);
  doc.roundedRect(PAGE.marginX, state.y, headerWidth, headerHeight, 4, 4, 'FD');

  const photoX = PAGE.marginX + 6;
  const photoY = state.y + 6;
  const photoSize = 42;
  const photoUrl = await resolvePhotoDataUrl(profile.photoUrl);

  if (photoUrl) {
    doc.addImage(photoUrl, undefined, photoX, photoY, photoSize, photoSize, undefined, 'FAST');
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
      const range = cleanText(job?.start_date || job?.end_date || job?.date || '');
      const body = stripHtml(job?.description || job?.achievements || job?.achievement || job?.achivements || job?.logros || '');
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
      const achievements = stripHtml(study?.achievements || '');
      drawCard(doc, state, {
        title,
        subtitle: institution,
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

  projects.forEach((project) => {
    const title = cleanText(project?.title || project?.name || 'Proyecto');
    const description = stripHtml(project?.description || 'Sin descripción disponible.');
    const technologies = Array.isArray(project?.technologies)
      ? project.technologies
          .map((technology) => cleanText(technology?.name || technology?.label || technology?.title || technology?.value || technology))
          .filter(Boolean)
      : [];
    const links = [
      project?.demo_url ? { label: 'Demo', href: project.demo_url } : null,
      project?.repo_url ? { label: 'Repositorio', href: project.repo_url } : null,
    ].filter(Boolean);

    drawCard(doc, state, {
      title,
      body: description,
      chips: technologies.slice(0, 6),
      links,
      accent: true,
      minHeight: 30,
    });
  });

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
