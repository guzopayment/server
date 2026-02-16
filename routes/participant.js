import { io } from "../server.js";

router.post("/submit", async (req, res) => {
  try {
    const participant = await Participant.create(req.body);

    // NOTIFICATION
    io.emit("newParticipant", {
      message: "New participant registered",
    });

    res.json(participant);
  } catch (err) {
    res.status(500).json(err.message);
  }
});
