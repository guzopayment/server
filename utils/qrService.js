import crypto from "crypto";
import QRCode from "qrcode";

export function makeQrToken() {
  return `GUBAE-ATT-${crypto.randomUUID()}`;
}

export async function ensureQrToken(booking) {
  if (booking.qrToken) return booking.qrToken;
  booking.qrToken = makeQrToken();
  await booking.save();
  return booking.qrToken;
}

export function qrPayloadFor(booking) {
  return booking.qrToken;
}

export async function qrPngFor(booking) {
  if (!booking.qrToken) throw new Error("Participant QR token has not been generated");
  return QRCode.toBuffer(booking.qrToken, {
    type: "png",
    width: 700,
    margin: 3,
    errorCorrectionLevel: "M",
  });
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
  return String(value)
    .normalize("NFKD")
    .replace(/[^\w\-\. ]+/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80) || "participant";
}
