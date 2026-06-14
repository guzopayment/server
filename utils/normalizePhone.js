export default function normalizePhone(phone = "") {
  let value = String(phone || " ").trim();

  // remove spaces, dashes, parentheses
  value = value.replace(/\s+/g, "");
  value = value.replace(/[\s\-()]/g, "");

  // convert +251xxxxxxxxx -> 0xxxxxxxxx
  if (value.startsWith("+251")) {
    value = "0" + value.slice(4);
  }

  // convert 251xxxxxxxxx -> 0xxxxxxxxx
  else if (value.startsWith("251")) {
    value = "0" + value.slice(3);
  }

  return value;
}
