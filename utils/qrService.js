export async function qrPngFor(booking) {
  const token = qrPayloadFor(booking);
  const name = String(booking?.name || "Participant").trim() || "Participant";
  // Support the actual Booking field plus common legacy/imported field names.
  const organization = String(
    booking?.organization ??
    booking?.organizationName ??
    booking?.orgName ??
    booking?.participantDetails?.organization ??
    ""
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
  const lineGap = 8;

  // Keep long organization names visible instead of allowing SVG text to run
  // outside the canvas. Two lines are supported for long Amharic names.
  const wrapText = (value, maxChars) => {
    const text = String(value || "").trim();
    if (!text) return [];
    const words = text.split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= maxChars || !line) line = candidate;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines.slice(0, 2);
  };

  const nameLines = wrapText(name, 34);
  const organizationLines = wrapText(organization, 42);
  const nameLineHeight = 38;
  const orgLineHeight = 30;
  const topPadding = 18;
  const between = organizationLines.length ? 10 : 0;
  const labelHeight =
    topPadding +
    Math.max(1, nameLines.length) * nameLineHeight +
    between +
    organizationLines.length * orgLineHeight +
    18;

  const canvasHeight = labelHeight + 700 + 30;
  const qrTop = labelHeight;
  const fontBase64 = getEthiopicFontBase64();

  const nameSvg = nameLines.map((line, i) =>
    `<text x="${canvasWidth / 2}" y="${topPadding + nameLineHeight * (i + 1) - 5}" text-anchor="middle" class="name">${escapeXml(line)}</text>`
  ).join("\n");

  const orgStartY = topPadding + nameLines.length * nameLineHeight + between;
  const orgSvg = organizationLines.map((line, i) =>
    `<text x="${canvasWidth / 2}" y="${orgStartY + orgLineHeight * (i + 1) - 4}" text-anchor="middle" class="organization">${escapeXml(line)}</text>`
  ).join("\n");

  const labelSvg = `
    <svg width="${canvasWidth}" height="${labelHeight}" viewBox="0 0 ${canvasWidth} ${labelHeight}" xmlns="http://www.w3.org/2000/svg">
      <style>
        @font-face {
          font-family: 'GubaeEthiopic';
          src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
          font-weight: 400;
          font-style: normal;
        }
        .name {
          font-family: 'GubaeEthiopic', sans-serif;
          font-size: ${nameFontSize}px;
          font-weight: 400;
          fill: #003B46;
        }
        .organization {
          font-family: 'GubaeEthiopic', sans-serif;
          font-size: ${orgFontSize}px;
          font-weight: 400;
          fill: #4f5b62;
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
