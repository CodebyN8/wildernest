const express = require("express");
const { Spot } = require("../../db/models");

const router = express.Router();

// GET all spots
router.get("/", async (req, res) => {
  try {
    const spots = await Spot.findAll();
    return res.json({ spots });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching spots." });
  }
});

module.exports = router;
