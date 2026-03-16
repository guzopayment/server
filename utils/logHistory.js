// import History from "../models/History.js";
// import { getIO } from "./socket.js";

// export default async function logHistory(title, message, extra = {}) {
//   try {
//     const item = await History.create({
//       title,
//       message,
//       ...extra,
//     });

//     try {
//       getIO().emit("history", item);
//     } catch {
//       // socket may not be ready in some cases
//     }

//     return item;
//   } catch (err) {
//     console.error("HISTORY LOG ERROR:", err.message);
//     return null;
//   }
// }
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
