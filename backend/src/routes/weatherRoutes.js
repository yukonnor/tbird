const express = require("express");
const { getCurrentWeather } = require("../services/weatherService");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng are required" });
    }
    const weather = await getCurrentWeather(parseFloat(lat), parseFloat(lng));
    res.json(weather);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
