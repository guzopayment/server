import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import sharp from "sharp";

const QR_PREFIX = "GUBAE-EVENT:";

// The token format is intentionally kept compatible with the scanner.
// Existing qrToken values are always reused; this function is only for
// participants that do not have a token yet.
export function makeQrToken(id) {
  return `${QR_PREFIX}${String(id)}`;
}

export async function ensureQrToken(booking) {
  if (!booking?.qrToken) {
    booking.qrToken = makeQrToken(booking._id);
    await booking.save();
  }
  return booking.qrToken;
}

function qrPayloadFor(booking) {
  // NEVER regenerate an existing token. This preserves scanner compatibility.
  return String(booking?.qrToken || makeQrToken(booking?._id));
}

function fontPath() {
  return fileURLToPath(
    new URL("./NotoSansEthiopic-Regular.ttf", import.meta.url),
  );
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Pango markup escaping for Sharp's text renderer.
function escapePango(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/*
 * Estimate rendered width conservatively for Noto Sans Ethiopic so that
 * participant text stays inside the label. This is only used for wrapping;
 * Sharp/Pango does the actual glyph rendering.
 */
function estimatedWidth(text, fontSize) {
  let width = 0;
  for (const char of String(text)) {
    if (/\s/.test(char)) width += fontSize * 0.42;
    else if (/[\u1200-\u137F]/.test(char)) width += fontSize * 0.96;
    else width += fontSize * 0.55;
  }
  return width;
}

function wrapToTwoLines(value, maxWidth, fontSize) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return [];

  const words = text.split(" ");
  const lines = [];
  let current = "";

  const pushCurrent = () => {
    if (current) {
      lines.push(current);
      current = "";
    }
  };

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (!current || estimatedWidth(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }

    pushCurrent();

    if (estimatedWidth(word, fontSize) <= maxWidth) {
      current = word;
    } else {
      let part = "";
      for (const char of word) {
        const candidatePart = part + char;
        if (part && estimatedWidth(candidatePart, fontSize) > maxWidth) {
          lines.push(part);
          part = char;
        } else {
          part = candidatePart;
        }
      }
      current = part;
    }

    if (lines.length >= 2) {
      current = "";
      break;
    }
  }

  if (current) lines.push(current);
  if (lines.length <= 2) return lines;

  return [lines[0], lines.slice(1).join(" ")];
}

export function safeFileName(value, fallback = "participant") {
  const cleaned = String(value || "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/[. ]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  return cleaned || fallback;
}

// HTTP Content-Disposition must remain ASCII-safe. Do not put Amharic names
// or organization names into this header.
export function safeHeaderFileName(value, fallback = "gubae-qr-codes") {
  const ascii = String(value || "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.\-]+|[.\-]+$/g, "")
    .slice(0, 100);

  return ascii || fallback;
}

async function renderTextLine(text, { width, fontSize, color }) {
  if (!text) return null;

  // Render each line separately, trim its transparent margins, then center the
  // actual glyphs on the final canvas. This avoids the left-alignment behavior
  // that can occur with Pango text blocks on Linux/Render.
  const raw = await sharp({
    text: {
      text: `<span size="${Math.round(fontSize * 1000)}" foreground="${color}">${escapePango(text)}</span>`,
      font: "Noto Sans Ethiopic",
      fontfile: fontPath(),
      width,
      height: Math.ceil(fontSize * 1.55),
      align: "center",
      rgba: true,
      wrap: "none",
      spacing: 0,
    },
  })
    .png()
    .toBuffer();

  const trimmed = sharp(raw).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } });
  const meta = await trimmed.metadata();
  return {
    input: await trimmed.png().toBuffer(),
    width: meta.width || width,
    height: meta.height || Math.ceil(fontSize * 1.55),
  };
}

/**
 * ONE renderer for every QR image in the application:
 * - individual QR download
 * - Share / existing participant QR
 * - new participant registration response
 * - ZIP generation
 *
 * The QR payload itself is kept unchanged. Only the visual presentation is
 * changed by adding the participant's Amharic name and organization.
 */
export async function qrPngFor(booking) {
  const token = qrPayloadFor(booking);

  const name = String(booking?.name || "Participant").trim() || "Participant";
  const organization = String(
    booking?.organization ??
      booking?.organizationName ??
      booking?.orgName ??
      booking?.participantDetails?.organization ??
      "",
  ).trim();

  const qrPng = await QRCode.toBuffer(token, {
    type: "png",
    width: 700,
    margin: 3,
    errorCorrectionLevel: "M",
  });

  const canvasWidth = 760;
  const sideMargin = 32;
  const maxTextWidth = canvasWidth - sideMargin * 2;

  const nameFontSize = 30;
  const orgFontSize = 23;
  const nameLineHeight = 40;
  const orgLineHeight = 32;
  const topPadding = 16;
  const between = organization ? 8 : 0;

  const nameLines = wrapToTwoLines(name, maxTextWidth, nameFontSize).slice(0, 2);
  const organizationLines = wrapToTwoLines(
    organization,
    maxTextWidth,
    orgFontSize,
  ).slice(0, 2);

  const nameHeight = Math.max(1, nameLines.length) * nameLineHeight;
  const organizationHeight = organizationLines.length * orgLineHeight;
  const labelHeight =
    topPadding + nameHeight + between + organizationHeight + 16;

  const canvasHeight = labelHeight + 700 + 30;
  const qrTop = labelHeight;

  const composite = [];
  let currentTop = topPadding;

  for (const line of nameLines) {
    const rendered = await renderTextLine(line, {
      width: maxTextWidth,
      fontSize: nameFontSize,
      color: "#111827",
    });
    if (rendered) {
      composite.push({
        input: rendered.input,
        left: Math.round((canvasWidth - rendered.width) / 2),
        top: currentTop,
      });
      currentTop += nameLineHeight;
    }
  }

  if (organizationLines.length) {
    currentTop += between;
    for (const line of organizationLines) {
      const rendered = await renderTextLine(line, {
        width: maxTextWidth,
        fontSize: orgFontSize,
        color: "#374151",
      });
      if (rendered) {
        composite.push({
          input: rendered.input,
          left: Math.round((canvasWidth - rendered.width) / 2),
          top: currentTop,
        });
        currentTop += orgLineHeight;
      }
    }
  }

  composite.push({
    input: qrPng,
    left: 30,
    top: qrTop,
  });

  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite(composite)
    .png()
    .toBuffer();
}

// New registrations use exactly the same renderer as downloads and sharing.
export async function qrDataUrlForBooking(booking) {
  const png = await qrPngFor(booking);
  return `data:image/png;base64,${png.toString("base64")}`;
}
