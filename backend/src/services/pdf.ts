import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { env } from '../config/env.js';
import type { Categoria, PrefacturaPayload, Producto } from '../types.js';

// ---------------------------------------------------------------------------
// Geometria y utilidades compartidas por la factura y la carta (ambas en
// tamano carta / Letter).
// ---------------------------------------------------------------------------

const PAGE_W = 612; // 8.5in
const PAGE_H = 792; // 11in
const MARGIN = 40;
const GAP = 14;
const COL_W = (PAGE_W - MARGIN * 2 - GAP) / 2;

const CREAM = rgb(0.973, 0.937, 0.898);
const CREAM_ALT = rgb(0.953, 0.878, 0.792);
const MAROON = rgb(0.33, 0.14, 0.11);
const MAROON_DARK = rgb(0.27, 0.09, 0.07);
const ORANGE = rgb(0.83, 0.33, 0.09);
const TEXT_DARK = rgb(0.16, 0.11, 0.08);
const TEXT_GRAY = rgb(0.55, 0.48, 0.45);
const WHITE = rgb(1, 1, 1);

function money(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

// Formato "$70.000,00" (puntos de miles, coma de centavos) como en la carta de referencia.
function moneyCarta(value: number) {
  const fixed = (Number.isFinite(value) ? value : 0).toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${withDots},${decPart}`;
}

// Formato "$70.000" (sin decimales, con puntos de miles) como en la factura de referencia.
function moneySimple(value: number) {
  const rounded = Math.round(Number.isFinite(value) ? value : 0);
  const withDots = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${rounded < 0 ? '-' : ''}$${withDots}`;
}

// "14:05" -> "2:05 PM"
function formatHora12(hhmm: string) {
  const match = /^(\d{1,2}):(\d{2})/.exec(hhmm || '');
  if (!match) return hhmm || '';
  let hours = Number(match[1]);
  const minutes = match[2];
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours %= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${suffix}`;
}

// Fecha corta sin ceros a la izquierda, como en la factura de referencia (10/7/2026).
function formatFechaCorta(date: Date) {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function whatsappDigits() {
  return env.whatsappPhone.replace(/^57/, '');
}

function loadLogoBytes(): Buffer | null {
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const logoPath = path.join(here, '../../assets/logo-lili.png');
    return fs.readFileSync(logoPath);
  } catch {
    return null;
  }
}

function letterSpaced(text: string) {
  return text.split('').join(' ');
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(attempt, size) <= maxWidth || !current) {
      current = attempt;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawCentered(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color = TEXT_DARK,
) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (PAGE_W - w) / 2, y, size, font, color });
  return w;
}

function drawRightText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  xEnd: number,
  y: number,
  color = TEXT_DARK,
) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: xEnd - w, y, size, font, color });
  return w;
}

// ---------------------------------------------------------------------------
// Factura / prefactura de un pedido puntual, tamano carta, replicando el
// formato de referencia del negocio (encabezado con logo y datos fiscales,
// cajas de cliente/pago, tabla de detalle y banner de agradecimiento).
// ---------------------------------------------------------------------------

const INVOICE_RED = rgb(0.75, 0.1, 0.1);
const INVOICE_OLIVE = rgb(0.36, 0.42, 0.09);
const INVOICE_OLIVE_LIGHT = rgb(0.5, 0.6, 0.14);
const INVOICE_CREAM = rgb(0.96, 0.97, 0.93);
const INVOICE_CREAM_ALT = rgb(0.94, 0.95, 0.89);
const INVOICE_TEXT = rgb(0.15, 0.15, 0.15);
const INVOICE_GRAY = rgb(0.45, 0.45, 0.45);
const INVOICE_LINE = rgb(0.82, 0.82, 0.8);
const INVOICE_WHITE = rgb(1, 1, 1);

const INVOICE_COL_ITEM = MARGIN;
const INVOICE_COL_DESC = MARGIN + 34;
const INVOICE_COL_CANT_END = PAGE_W - MARGIN - 150;
const INVOICE_COL_VALOR_END = PAGE_W - MARGIN - 70;
const INVOICE_COL_TOTAL_END = PAGE_W - MARGIN;

type InvoiceFonts = {
  helv: PDFFont;
  helvBold: PDFFont;
  timesBold: PDFFont;
};

function drawInvoiceHeader(page: PDFPage, fonts: InvoiceFonts, logo: PDFImage | null, data: PrefacturaPayload) {
  let y = PAGE_H - 40;

  if (logo) {
    const logoW = 58;
    const logoH = logoW * (logo.height / logo.width);
    page.drawImage(logo, { x: MARGIN, y: y - logoH + 10, width: logoW, height: logoH });
  }

  drawCentered(page, 'PreFactura', fonts.timesBold, 24, y - 4, INVOICE_RED);
  let cy = y - 28;
  drawCentered(page, 'LILI Y SU SAZON COMPLETA', fonts.helvBold, 10.5, cy, INVOICE_TEXT);
  cy -= 13;
  drawCentered(
    page,
    `Nit. ${env.businessNit}  ${env.businessRegimen.toUpperCase()}`,
    fonts.helv,
    8.5,
    cy,
    INVOICE_GRAY,
  );
  cy -= 11;
  drawCentered(page, `Tels: ${env.businessPhoneFixed} - (+57) ${whatsappDigits()}`, fonts.helv, 8.5, cy, INVOICE_GRAY);
  cy -= 11;
  drawCentered(page, env.businessCity, fonts.helv, 8.5, cy, INVOICE_GRAY);

  const rightX = PAGE_W - MARGIN;
  let ry = y - 2;
  drawRightText(page, 'Fecha de Elaboracion', fonts.helvBold, 8.5, rightX, ry, INVOICE_TEXT);
  ry -= 11;
  drawRightText(page, formatFechaCorta(new Date()), fonts.helv, 8.5, rightX, ry, INVOICE_GRAY);
  ry -= 15;
  drawRightText(page, 'Fecha de Entrega', fonts.helvBold, 8.5, rightX, ry, INVOICE_TEXT);
  ry -= 11;
  drawRightText(page, data.cliente.fechaEntrega, fonts.helv, 8.5, rightX, ry, INVOICE_GRAY);
  ry -= 15;
  drawRightText(page, 'Hora de Entrega', fonts.helvBold, 8.5, rightX, ry, INVOICE_TEXT);
  ry -= 11;
  drawRightText(page, formatHora12(data.cliente.horaEntrega), fonts.helv, 8.5, rightX, ry, INVOICE_GRAY);

  y -= 80;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 2.5,
    color: INVOICE_OLIVE_LIGHT,
  });

  return y - 22;
}

function drawInvoiceInfoBoxes(page: PDFPage, fonts: InvoiceFonts, data: PrefacturaPayload, startY: number) {
  const boxGap = 16;
  const boxW = (PAGE_W - MARGIN * 2 - boxGap) / 2;
  const leftBoxX = MARGIN;
  const rightBoxX = MARGIN + boxW + boxGap;
  const pad = 12;

  // Altura dinamica: medimos el contenido de ambas cajas para que queden parejas.
  const dirLines = wrapText(fonts.helv, data.cliente.direccion, 9, boxW - pad * 2).slice(0, 3);
  const advisorNoteLines = wrapText(fonts.helv, env.advisorConfirmationNote, 8.5, boxW - pad * 2);

  const leftContentH = 16 + 15 + 15 + 13 + dirLines.length * 12 + 8;
  const rightContentH = 16 + 17 + advisorNoteLines.length * 12 + 8;
  const boxH = Math.max(92, leftContentH, rightContentH);

  page.drawRectangle({ x: leftBoxX, y: startY - boxH, width: boxW, height: boxH, color: INVOICE_CREAM });
  page.drawRectangle({ x: rightBoxX, y: startY - boxH, width: boxW, height: boxH, color: INVOICE_CREAM });

  let lcy = startY - 16;
  page.drawText('DATOS DEL CLIENTE', { x: leftBoxX + pad, y: lcy, size: 8, font: fonts.helvBold, color: INVOICE_OLIVE });
  lcy -= 17;
  page.drawText(data.cliente.nombre.toUpperCase(), {
    x: leftBoxX + pad,
    y: lcy,
    size: 11,
    font: fonts.helvBold,
    color: INVOICE_TEXT,
  });
  lcy -= 15;
  page.drawText(data.cliente.telefono, { x: leftBoxX + pad, y: lcy, size: 9, font: fonts.helv, color: INVOICE_TEXT });
  lcy -= 13;
  for (const line of dirLines) {
    page.drawText(line, { x: leftBoxX + pad, y: lcy, size: 9, font: fonts.helv, color: INVOICE_TEXT });
    lcy -= 12;
  }

  let rcy = startY - 16;
  page.drawText('NOTA', {
    x: rightBoxX + pad,
    y: rcy,
    size: 8,
    font: fonts.helvBold,
    color: INVOICE_OLIVE,
  });
  rcy -= 17;
  for (const line of advisorNoteLines) {
    page.drawText(line, { x: rightBoxX + pad, y: rcy, size: 8.5, font: fonts.helv, color: INVOICE_TEXT });
    rcy -= 12;
  }

  return startY - boxH - 20;
}

function drawInvoiceTableHeader(page: PDFPage, fonts: InvoiceFonts, y: number) {
  page.drawText('ITEM', { x: INVOICE_COL_ITEM, y, size: 8.5, font: fonts.helvBold, color: INVOICE_OLIVE });
  page.drawText('DESCRIPCION', { x: INVOICE_COL_DESC, y, size: 8.5, font: fonts.helvBold, color: INVOICE_OLIVE });
  drawRightText(page, 'Cant.', fonts.helvBold, 8.5, INVOICE_COL_CANT_END, y, INVOICE_OLIVE);
  drawRightText(page, 'V. Unit.', fonts.helvBold, 8.5, INVOICE_COL_VALOR_END, y, INVOICE_OLIVE);
  drawRightText(page, 'Total', fonts.helvBold, 8.5, INVOICE_COL_TOTAL_END, y, INVOICE_OLIVE);

  const lineY = y - 6;
  page.drawLine({
    start: { x: MARGIN, y: lineY },
    end: { x: PAGE_W - MARGIN, y: lineY },
    thickness: 1,
    color: INVOICE_OLIVE_LIGHT,
  });

  return lineY - 16;
}

export async function buildPrefacturaPdf(data: PrefacturaPayload, _referencia: string) {
  const pdf = await PDFDocument.create();

  const fonts: InvoiceFonts = {
    helv: await pdf.embedFont(StandardFonts.Helvetica),
    helvBold: await pdf.embedFont(StandardFonts.HelveticaBold),
    timesBold: await pdf.embedFont(StandardFonts.TimesRomanBold),
  };

  const logoBytes = loadLogoBytes();
  const logo = logoBytes ? await pdf.embedPng(logoBytes) : null;

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = drawInvoiceHeader(page, fonts, logo, data);
  y = drawInvoiceInfoBoxes(page, fonts, data, y);

  page.drawText('DETALLE DE PRODUCTOS', { x: MARGIN, y, size: 8.5, font: fonts.helvBold, color: INVOICE_GRAY });
  y -= 16;
  y = drawInvoiceTableHeader(page, fonts, y);

  const footerReserve = 150; // espacio minimo para totales + banner en la ultima pagina
  let subtotal = 0;

  data.items.forEach((item, index) => {
    if (y < footerReserve) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - 50;
      y = drawInvoiceTableHeader(page, fonts, y);
    }

    const lineTotal = item.valor * item.cantidad;
    subtotal += lineTotal;

    if (index % 2 === 1) {
      page.drawRectangle({
        x: MARGIN,
        y: y - 5,
        width: PAGE_W - MARGIN * 2,
        height: 18,
        color: INVOICE_CREAM_ALT,
      });
    }

    page.drawText(String(index + 1), {
      x: INVOICE_COL_ITEM,
      y,
      size: 9.5,
      font: fonts.helvBold,
      color: INVOICE_OLIVE_LIGHT,
    });
    const nameLines = wrapText(fonts.helv, item.nombre, 9.5, INVOICE_COL_CANT_END - INVOICE_COL_DESC - 10);
    page.drawText(nameLines[0] ?? item.nombre, {
      x: INVOICE_COL_DESC,
      y,
      size: 9.5,
      font: fonts.helv,
      color: INVOICE_TEXT,
    });
    drawRightText(page, String(item.cantidad), fonts.helv, 9.5, INVOICE_COL_CANT_END, y, INVOICE_TEXT);
    drawRightText(page, moneySimple(item.valor), fonts.helv, 9.5, INVOICE_COL_VALOR_END, y, INVOICE_TEXT);
    drawRightText(page, moneySimple(lineTotal), fonts.helvBold, 9.5, INVOICE_COL_TOTAL_END, y, INVOICE_OLIVE_LIGHT);

    y -= 20;
  });

  if (y < footerReserve) {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - 60;
  }

  y -= 6;
  page.drawLine({
    start: { x: INVOICE_COL_VALOR_END - 60, y: y + 14 },
    end: { x: INVOICE_COL_TOTAL_END, y: y + 14 },
    thickness: 0.75,
    color: INVOICE_LINE,
  });
  drawRightText(page, 'Subtotal', fonts.helv, 9.5, INVOICE_COL_VALOR_END, y, INVOICE_GRAY);
  drawRightText(page, moneySimple(subtotal), fonts.helv, 9.5, INVOICE_COL_TOTAL_END, y, INVOICE_TEXT);
  y -= 22;

  if (data.impuesto > 0) {
    const deliveryNoteLines = wrapText(fonts.helv, `* ${env.deliveryNoticeNote}`, 7.5, PAGE_W - MARGIN * 2);
    for (const line of deliveryNoteLines) {
      page.drawText(line, { x: MARGIN, y, size: 7.5, font: fonts.helv, color: INVOICE_GRAY });
      y -= 10;
    }
    y -= 9;
  }

  const total = subtotal;
  drawRightText(page, 'TOTAL', fonts.helvBold, 13, INVOICE_COL_VALOR_END, y, INVOICE_TEXT);
  drawRightText(page, moneySimple(total), fonts.helvBold, 13, INVOICE_COL_TOTAL_END, y, INVOICE_OLIVE_LIGHT);

  // ---------------- Banner de agradecimiento (fijo cerca del pie de pagina) ----------------
  const bannerH = 92;
  const bannerBottom = 40;
  if (y - 30 < bannerBottom + bannerH) {
    page = pdf.addPage([PAGE_W, PAGE_H]);
  }

  page.drawRectangle({ x: 0, y: bannerBottom, width: PAGE_W, height: bannerH, color: INVOICE_OLIVE });

  let fy = bannerBottom + bannerH - 24;
  drawCentered(page, 'Gracias por tu compra!', fonts.helvBold, 12, fy, INVOICE_WHITE);
  fy -= 18;
  drawCentered(
    page,
    `Envia tu comprobante de pago por WhatsApp al +57 ${whatsappDigits()} para confirmar tu pedido`,
    fonts.helv,
    9,
    fy,
    INVOICE_WHITE,
  );
  fy -= 15;
  drawCentered(
    page,
    `Instagram: ${env.instagramHandle}     WhatsApp: +57 ${whatsappDigits()}`,
    fonts.helvBold,
    9,
    fy,
    INVOICE_WHITE,
  );
  fy -= 14;
  drawCentered(page, env.businessAddress, fonts.helv, 8, fy, INVOICE_WHITE);

  return pdf.save();
}

// ---------------------------------------------------------------------------
// Carta / catalogo en PDF, tamano carta (Letter), replicando el diseno de
// referencia: portada con logo y redes, y una pagina por categoria con una
// tabla de 2 columnas (NOMBRE | TIPO | CANTIDAD | VALOR).
// ---------------------------------------------------------------------------

type Fonts = {
  helv: PDFFont;
  helvBold: PDFFont;
  timesBold: PDFFont;
  timesItalic: PDFFont;
};

function drawFooter(page: PDFPage, fonts: Fonts, logo: PDFImage | null) {
  if (logo) {
    const size = 30;
    page.drawImage(logo, { x: MARGIN, y: 26, width: size, height: size * (logo.height / logo.width) });
  }

  const text = 'Lili y su Sazon Completa · (+57) 3177719249';
  const w = fonts.timesItalic.widthOfTextAtSize(text, 9);
  page.drawText(text, {
    x: PAGE_W - MARGIN - w,
    y: 38,
    size: 9,
    font: fonts.timesItalic,
    color: TEXT_GRAY,
  });
}

function drawPageHeader(page: PDFPage, fonts: Fonts, title: string, suffix?: string) {
  let y = PAGE_H - 44;

  const menuLabel = 'Menu';
  const menuW = fonts.timesItalic.widthOfTextAtSize(menuLabel, 11);
  const menuX = (PAGE_W - menuW) / 2;
  page.drawText(menuLabel, { x: menuX, y, size: 11, font: fonts.timesItalic, color: MAROON });
  page.drawLine({
    start: { x: menuX, y: y - 2 },
    end: { x: menuX + menuW, y: y - 2 },
    thickness: 0.6,
    color: MAROON,
  });

  y -= 34;
  const fullTitle = suffix ? `${title} ${suffix}` : title;
  page.drawText(fullTitle, {
    x: MARGIN,
    y,
    size: suffix ? 22 : 27,
    font: fonts.timesBold,
    color: MAROON_DARK,
  });

  y -= 30;
  return y;
}

function columnGeometry() {
  const nombreW = 100;
  const tipoW = 52;
  const cantidadW = 40;
  const valorW = COL_W - nombreW - tipoW - cantidadW;
  return { nombreW, tipoW, cantidadW, valorW };
}

function drawColumnTableHeader(page: PDFPage, fonts: Fonts, x: number, y: number) {
  const { nombreW, tipoW, cantidadW, valorW } = columnGeometry();
  const headerH = 20;

  page.drawRectangle({ x, y: y - headerH, width: COL_W, height: headerH, color: ORANGE });

  const labelY = y - headerH + 6;
  const pad = 8;
  page.drawText('NOMBRE', { x: x + pad, y: labelY, size: 8.5, font: fonts.helvBold, color: WHITE });
  page.drawText('TIPO', { x: x + nombreW + pad, y: labelY, size: 8.5, font: fonts.helvBold, color: WHITE });
  page.drawText('CANTIDAD', {
    x: x + nombreW + tipoW + pad,
    y: labelY,
    size: 8.5,
    font: fonts.helvBold,
    color: WHITE,
  });
  const valorLabel = 'VALOR';
  const valorLabelW = fonts.helvBold.widthOfTextAtSize(valorLabel, 8.5);
  page.drawText(valorLabel, {
    x: x + COL_W - pad - valorLabelW,
    y: labelY,
    size: 8.5,
    font: fonts.helvBold,
    color: WHITE,
  });

  return y - headerH;
}

function drawColumnRows(
  page: PDFPage,
  fonts: Fonts,
  x: number,
  startY: number,
  bottomLimit: number,
  items: Producto[],
  fromIndex: number,
  rowCounterStart: number,
) {
  const { nombreW, tipoW, cantidadW, valorW } = columnGeometry();
  const pad = 8;
  const lineH = 10.5;
  let y = startY;
  let idx = fromIndex;
  let rowCounter = rowCounterStart;

  while (idx < items.length) {
    const item = items[idx];
    const nameLines = wrapText(fonts.helvBold, item.nombre.toUpperCase(), 8.5, nombreW - pad - 4);
    const tipoLines = wrapText(fonts.helv, item.categoria.toUpperCase(), 7.5, tipoW - pad - 4);
    const lines = Math.max(nameLines.length, tipoLines.length, 1);
    const rowH = lines * lineH + 10;

    if (y - rowH < bottomLimit) break;

    if (rowCounter % 2 === 0) {
      page.drawRectangle({ x, y: y - rowH, width: COL_W, height: rowH, color: CREAM_ALT });
    }

    let ny = y - 12;
    for (const line of nameLines) {
      page.drawText(line, { x: x + pad, y: ny, size: 8.5, font: fonts.helvBold, color: TEXT_DARK });
      ny -= lineH;
    }

    ny = y - 12;
    for (const line of tipoLines) {
      page.drawText(line, {
        x: x + nombreW + pad,
        y: ny,
        size: 7.5,
        font: fonts.helv,
        color: TEXT_GRAY,
      });
      ny -= lineH;
    }

    const midY = y - rowH / 2 - 3;
    const cantidadText = item.presentacion || '-';
    const cantidadLines = wrapText(fonts.helv, cantidadText, 7.5, cantidadW - 4);
    let cy = cantidadLines.length > 1 ? midY + ((cantidadLines.length - 1) * lineH) / 2 : midY;
    for (const line of cantidadLines) {
      const lw = fonts.helv.widthOfTextAtSize(line, 7.5);
      page.drawText(line, {
        x: x + nombreW + tipoW + (cantidadW - lw) / 2,
        y: cy,
        size: 7.5,
        font: fonts.helv,
        color: TEXT_GRAY,
      });
      cy -= lineH;
    }

    const valorText = moneyCarta(item.valor);
    const valorW2 = fonts.helvBold.widthOfTextAtSize(valorText, 8.5);
    page.drawText(valorText, {
      x: x + COL_W - pad - valorW2,
      y: midY,
      size: 8.5,
      font: fonts.helvBold,
      color: TEXT_DARK,
    });

    y -= rowH;
    idx += 1;
    rowCounter += 1;
  }

  return { nextIndex: idx, rowCounter };
}

export async function buildCatalogoPdf(categorias: Categoria[], productos: Producto[]) {
  const pdf = await PDFDocument.create();

  const fonts: Fonts = {
    helv: await pdf.embedFont(StandardFonts.Helvetica),
    helvBold: await pdf.embedFont(StandardFonts.HelveticaBold),
    timesBold: await pdf.embedFont(StandardFonts.TimesRomanBold),
    timesItalic: await pdf.embedFont(StandardFonts.TimesRomanItalic),
  };

  const logoBytes = loadLogoBytes();
  const logo = logoBytes ? await pdf.embedPng(logoBytes) : null;

  // ---------------- Portada ----------------
  const cover = pdf.addPage([PAGE_W, PAGE_H]);
  cover.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: CREAM });

  drawCentered(cover, letterSpaced('SABOR DE FAMILIA'), fonts.helvBold, 11, PAGE_H - 130, MAROON);
  drawCentered(cover, 'NUESTRA CARTA', fonts.timesBold, 42, PAGE_H - 190, MAROON_DARK);

  if (logo) {
    const logoW = 190;
    const logoH = logoW * (logo.height / logo.width);
    cover.drawImage(logo, {
      x: (PAGE_W - logoW) / 2,
      y: PAGE_H - 240 - logoH,
      width: logoW,
      height: logoH,
    });

    let y = PAGE_H - 240 - logoH - 42;
    drawCentered(cover, letterSpaced('COCINAMOS CON AMOR PARA TI Y TU FAMILIA'), fonts.helvBold, 10, y, MAROON);

    y -= 26;
    cover.drawLine({
      start: { x: PAGE_W / 2 - 30, y },
      end: { x: PAGE_W / 2 + 30, y },
      thickness: 2,
      color: ORANGE,
    });

    y -= 34;
    drawCentered(cover, 'Visitanos en nuestras paginas', fonts.timesBold, 13, y, MAROON);

    y -= 34;
    const social = [
      { text: '@liliysusazoncompleta', color: ORANGE },
      { text: '(+57) 3177719249', color: rgb(0.15, 0.4, 0.18) },
      { text: 'LILI Y SU SAZON COMPLETA', color: rgb(0.13, 0.32, 0.6) },
    ];
    const gap = 26;
    const widths = social.map((s) => fonts.helvBold.widthOfTextAtSize(s.text, 10.5));
    const totalW = widths.reduce((a, b) => a + b, 0) + gap * (social.length - 1);
    let sx = (PAGE_W - totalW) / 2;
    social.forEach((s, i) => {
      cover.drawText(s.text, { x: sx, y, size: 10.5, font: fonts.helvBold, color: s.color });
      sx += widths[i] + gap;
    });
  }

  drawFooter(cover, fonts, logo);

  // ---------------- Paginas por categoria ----------------
  const activeCategorias = categorias.filter((cat) =>
    productos.some((p) => p.id_tipo_producto === cat.id_tipo_producto),
  );

  for (const cat of activeCategorias) {
    const items = productos.filter((p) => p.id_tipo_producto === cat.id_tipo_producto);
    const splitIndex = Math.ceil(items.length / 2);
    const left = items.slice(0, splitIndex);
    const right = items.slice(splitIndex);

    let leftIdx = 0;
    let rightIdx = 0;
    let leftRowCounter = 1;
    let rightRowCounter = 1;
    let firstPage = true;

    // Cada categoria siempre pinta al menos una pagina (left nunca esta vacio
    // porque activeCategorias ya filtro categorias sin productos).
    while (true) {
      const page = pdf.addPage([PAGE_W, PAGE_H]);
      page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: CREAM });

      const tableTopY = drawPageHeader(page, fonts, cat.nombre, firstPage ? undefined : '(continuacion)');
      const bottomLimit = 60;
      const leftX = MARGIN;
      const rightX = MARGIN + COL_W + GAP;

      let leftY = tableTopY;
      let rightY = tableTopY;

      if (leftIdx < left.length) {
        leftY = drawColumnTableHeader(page, fonts, leftX, tableTopY);
        const result = drawColumnRows(page, fonts, leftX, leftY, bottomLimit, left, leftIdx, leftRowCounter);
        leftIdx = result.nextIndex;
        leftRowCounter = result.rowCounter;
      }

      if (rightIdx < right.length) {
        rightY = drawColumnTableHeader(page, fonts, rightX, tableTopY);
        const result = drawColumnRows(page, fonts, rightX, rightY, bottomLimit, right, rightIdx, rightRowCounter);
        rightIdx = result.nextIndex;
        rightRowCounter = result.rowCounter;
      }

      drawFooter(page, fonts, logo);
      firstPage = false;

      if (leftIdx >= left.length && rightIdx >= right.length) {
        break;
      }
    }
  }

  return pdf.save();
}
