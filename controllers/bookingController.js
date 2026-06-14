export const createBooking = async (req, res) => {
  try {
    const booking = await Participant.create({
      fullName: req.body.fullName,
      organization: req.body.organization,
      phone: req.body.phone,
      participants: req.body.participants,
      paymentProof: req.file?.filename || "",
    });

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Booking failed" });
  }
};
