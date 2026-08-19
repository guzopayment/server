import QRCode from "qrcode";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ETHIOPIC_FONT_PATH = path.join(__dirname, "fonts", "NotoSansEthiopic-Regular.ttf");
let ETHIOPIC_FONT_BASE64;

function getEthiopicFontBase64() {
  if (!ETHIOPIC_FONT_BASE64) {
    if (!fs.existsSync(ETHIOPIC_FONT_PATH)) {
      throw new Error(`Ethiopic font not found: ${ETHIOPIC_FONT_PATH}`);
    }
    ETHIOPIC_FONT_BASE64 = fs.readFileSync(ETHIOPIC_FONT_PATH).toString("base64");
  }
  return ETHIOPIC_FONT_BASE64;
}

export function makeQrToken(id) {
  return `GUBAE-EVENT:${String(id)}`;
}

export async function ensureQrToken(booking) {
  const expected = makeQrToken(booking._id);
  if (booking.qrToken === expected) return expected;

  booking.qrToken = expected;
  await booking.save();
  return expected;
}

export function qrPayloadFor(booking) {
  return booking.qrToken || makeQrToken(booking._id);
}

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generates a participant QR as a PNG.
 *
 * Important:
 * - QRCode generates the QR itself as a PNG buffer.
 * - Sharp creates a clean white canvas and composites the QR + labels.
 * - We deliberately do NOT nest one SVG inside another SVG. That was causing
 *   the /api/qr/:id endpoint to fail with a 500 on some Sharp/libvips builds.
 */
export async function qrPngFor(booking) {
  const token = qrPayloadFor(booking);
  const name = String(booking.name || "Participant").trim() || "Participant";
  const organization = String(booking.organization || "").trim();

  const qrPng = await QRCode.toBuffer(token, {
    type: "png",
    width: 700,
    margin: 3,
    errorCorrectionLevel: "M",
  });

  const canvasWidth = 760;
  const canvasHeight = organization ? 900 : 860;
  const qrTop = organization ? 130 : 105;
  const fontBase64 = getEthiopicFontBase64();

  // Embed the Ethiopic font directly in the SVG. This is important for Render
  // and other Linux environments where Arial/Windows Ethiopic fonts may not
  // exist. It also guarantees that existing participants and new participants
  // use exactly the same readable Amharic QR artwork.
  const labelSvg = `
    <svg width="${canvasWidth}" height="${qrTop}" viewBox="0 0 ${canvasWidth} ${qrTop}"
         xmlns="http://www.w3.org/2000/svg">
      <style>
        @font-face {
          font-family: 'GubaeEthiopic';
          src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
          font-weight: 400;
          font-style: normal;
        }
        .name {
          font-family: 'GubaeEthiopic', sans-serif;
          font-size: 30px;
          font-weight: 400;
          fill: #003B46;
        }
        .organization {
          font-family: 'GubaeEthiopic', sans-serif;
          font-size: 19px;
          font-weight: 400;
          fill: #5b6770;
        }
      </style>
      <rect width="${canvasWidth}" height="${qrTop}" fill="#ffffff"/>
      <text x="${canvasWidth / 2}" y="43" text-anchor="middle" class="name">${escapeXml(name)}</text>
      ${
        organization
          ? `<text x="${canvasWidth / 2}" y="82" text-anchor="middle" class="organization">${escapeXml(organization)}</text>`
          : ""
      }
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

export async function qrDataUrlForBooking(booking) {
  const png = await qrPngFor(booking);
  return `data:image/png;base64,${png.toString("base64")}`;
}

export async function qrDataUrlForToken(token) {
  if (!token) throw new Error("Participant QR token is required");

  return QRCode.toDataURL(token, {
    width: 700,
    margin: 3,
    errorCorrectionLevel: "M",
  });
}

export function safeFileName(value = "participant") {
  return (
    String(value)
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
      .replace(/[. ]+$/g, "")
      .trim()
      .slice(0, 120) || "participant"
  );
}
