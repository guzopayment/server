# QR renderer production fix

The production issue was caused by the previous SVG renderer using an embedded `@font-face` data URL. Sharp's documentation states that embedded SVG fonts are unsupported. The new implementation renders text through Sharp's Pango text input and explicitly supplies the bundled TTF with `fontfile`.

The important path is:

`utils/NotoSansEthiopic-Regular.ttf`

The QR token is not changed. The visual image is changed only by adding the participant name and organization.
