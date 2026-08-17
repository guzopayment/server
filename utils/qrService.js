import QRCode from "qrcode";
import sharp from "sharp";

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

  const labelSvg = `
    <svg width="${canvasWidth}" height="${qrTop}" viewBox="0 0 ${canvasWidth} ${qrTop}"
         xmlns="http://www.w3.org/2000/svg">
      <rect width="${canvasWidth}" height="${qrTop}" fill="#ffffff"/>
      <text x="${canvasWidth / 2}" y="42"
            text-anchor="middle"
            font-family="Arial, 'Noto Sans Ethiopic', sans-serif"
            font-size="28"
            font-weight="700"
            fill="#003B46">${escapeXml(name)}</text>
      ${
        organization
          ? `<text x="${canvasWidth / 2}" y="78"
              text-anchor="middle"
              font-family="Arial, 'Noto Sans Ethiopic', sans-serif"
              font-size="18"
              fill="#5b6770">${escapeXml(organization)}</text>`
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
