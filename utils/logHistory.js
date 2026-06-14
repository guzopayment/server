import History from "../models/History.js";
import { getIO } from "./socket.js";

const logHistory = async (title, message, extra = {}) => {
  try {
    const item = await History.create({
      title,
      message,
      actor: extra.actor || "system",
      entityType: extra.entityType || "",
      entityId: extra.entityId || "",
    });

    try {
      getIO().emit("history", item);
    } catch {}

    return item;
  } catch (err) {
    console.error("LOG HISTORY ERROR:", err.message);
    return null;
  }
};

export default logHistory;
