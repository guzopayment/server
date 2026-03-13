import History from "../models/History.js";
import { getIO } from "./socket.js";

export default async function logHistory(title, message, extra = {}) {
  try {
    const item = await History.create({
      title,
      message,
      ...extra,
    });

    try {
      getIO().emit("history", item);
    } catch {
      // socket may not be ready in some cases
    }

    return item;
  } catch (err) {
    console.error("HISTORY LOG ERROR:", err.message);
    return null;
  }
}
