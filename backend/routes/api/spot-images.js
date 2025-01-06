const express = require("express");

const {
  User,
  Spot,
  SpotImage,
  Review,
  Sequelize,
  Booking,
  ReviewImage,
} = require("../../db/models");
const { Op } = require("sequelize");
const { requireAuth } = require("../../utils/auth");
const spot = require("../../db/models/spot");

const router = express.Router();

//Delete a spot image
router.delete("/:imageId", requireAuth, async (req, res) => {
  const { imageId } = req.params;
  const user = req.user.id;
  const image = await SpotImage.findOne({
    where: {
      id: imageId,
    },
  });

  if (image === null) {
    return res.json({
      message: "Spot Image couldn't be found",
    });
  }

  const spot = await Spot.findOne({
    where: {
      id: image.spotId,
    },
  });

  if (spot.ownerId !== user) {
    return res.status(401).json({
      message: "Spot Image does not belong to user",
    });
  }

  image.destroy();
  res.json({ message: "Successfully deleted" });
});

module.exports = router;
