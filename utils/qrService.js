import fs from "node:fs/promises";
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
  // Never regenerate/replace an existing token. This is important for
  // already-issued QR codes and scanner compatibility.
  return String(booking?.qrToken || makeQrToken(booking?._id));
}

export async function qrDataUrlForBooking(booking) {
  return QRCode.toDataURL(qrPayloadFor(booking), {
    type: "image/png",
    width: 700,
    margin: 3,
    errorCorrectionLevel: "M",
  });
}

let fontBase64Promise;

async function getEthiopicFontBase64() {
  if (!fontBase64Promise) {
    const fontPath = fileURLToPath(
      new URL("./NotoSansEthiopic-Regular.ttf", import.meta.url),
    );
    fontBase64Promise = fs.readFile(fontPath).then((buffer) =>
      buffer.toString("base64"),
    );
  }
  return fontBase64Promise;
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/*
 * Approximate rendered width for Noto Sans Ethiopic.
 * This is deliberately conservative so Amharic text does not run outside
 * the 760px label. A word that is too long is hard-wrapped by code point.
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

    // A single very long word can still exceed the label. Break it safely.
    if (estimatedWidth(word, fontSize) <= maxWidth) {
      current = word;
    } else {
      let part = "";
      for (const char of word) {
        const candidatePart = part + char;
        if (
          part &&
          estimatedWidth(candidatePart, fontSize) > maxWidth
        ) {
          lines.push(part);
          part = char;
        } else {
          part = candidatePart;
        }
      }
      current = part;
    }

    // We only need a maximum of two lines.
    if (lines.length >= 2) {
      current = "";
      break;
    }
  }

  if (current) lines.push(current);

  if (lines.length <= 2) return lines;

  // Defensive fallback: never render more than two lines.
  const second = lines.slice(1).join(" ");
  return [lines[0], second];
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

// Header filenames must be ASCII-safe. Never put an Amharic participant or
// organization name into Content-Disposition: it can cause HTTP 500 errors
// on some Node/serverless response implementations.
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

export async function qrPngFor(booking) {
  const token = qrPayloadFor(booking);

  // These are the registered participant fields used by Booking.
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
  const topPadding = 20;
  const between = organization ? 10 : 0;

  const nameLines =
    wrapToTwoLines(name, maxTextWidth, nameFontSize).slice(0, 2);
  const organizationLines =
    wrapToTwoLines(organization, maxTextWidth, orgFontSize).slice(0, 2);

  const labelHeight =
    topPadding +
    Math.max(1, nameLines.length) * nameLineHeight +
    between +
    organizationLines.length * orgLineHeight +
    20;

  const qrSize = 700;
  const canvasHeight = labelHeight + qrSize + 30;
  const qrTop = labelHeight;

  const fontBase64 = await getEthiopicFontBase64();

  const nameSvg = nameLines
    .map(
      (line, i) =>
        `<text x="${canvasWidth / 2}" y="${
          topPadding + nameLineHeight * (i + 1) - 6
        }" text-anchor="middle" class="name">${escapeXml(line)}</text>`,
    )
    .join("\n");

  const orgStartY =
    topPadding + Math.max(1, nameLines.length) * nameLineHeight + between;

  const orgSvg = organizationLines
    .map(
      (line, i) =>
        `<text x="${canvasWidth / 2}" y="${
          orgStartY + orgLineHeight * (i + 1) - 5
        }" text-anchor="middle" class="organization">${escapeXml(line)}</text>`,
    )
    .join("\n");

  const labelSvg = `
    <svg width="${canvasWidth}" height="${labelHeight}"
         viewBox="0 0 ${canvasWidth} ${labelHeight}"
         xmlns="http://www.w3.org/2000/svg">
      <style>
        @font-face {
          font-family: 'NotoSansEthiopic';
          src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
          font-weight: 400;
          font-style: normal;
        }

        .name {
          font-family: 'NotoSansEthiopic', sans-serif;
          font-size: ${nameFontSize}px;
          font-weight: 400;
          fill: #111827;
        }

        .organization {
          font-family: 'NotoSansEthiopic', sans-serif;
          font-size: ${orgFontSize}px;
          font-weight: 400;
          fill: #374151;
        }
      </style>

      <rect width="${canvasWidth}" height="${labelHeight}" fill="#ffffff"/>
      ${nameSvg}
      ${orgSvg}
    </svg>
  `;

  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: Buffer.from(labelSvg), left: 0, top: 0 },
      { input: qrPng, left: 30, top: qrTop },
    ])
    .png()
    .toBuffer();
}
