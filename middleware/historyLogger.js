import History from "../models/History.js";

const historyLogger = (action) => {
  return async (req, res, next) => {
    try {
      await History.create({
        action,
        adminId: req.admin?.id || "unknown",
        details: JSON.stringify(req.body),
      });
    } catch (err) {
      console.log("History log error:", err.message);
    }

    next();
  };
};

export default historyLogger;
