const express = require("express");
const {
  User,
  Spot,
  Booking,
  Review,
  ReviewImage,
  SpotImage,
  Sequelize,
} = require("../../db/models");
const { requireAuth } = require("../../utils/auth");

const router = express.Router();

//add image to review based on id
router.post("/:reviewId/images", requireAuth, async (req, res) => {
  console.log("hello");
  const { reviewId } = req.params;
  const { url } = req.body;
  console.log("test");

  const reviews = await Review.findOne({
    where: {
      id: reviewId,
    },
  });

  if (reviews === null) {
    res.status(404).json({
      message: "Review couldn't be found",
    });
  }

  const imageCount = await ReviewImage.count({
    where: {
      reviewId: reviewId,
    },
  });

  if (imageCount >= 10) {
    res.status(403).json({
      message: "Maximum number of images for this resource was reached",
    });
  }

  console.log(reviews);

  const image = await ReviewImage.create({ reviewId: reviews.id, url });

  const resImage = {
    id: image.id,
    url: image.url,
  };

  res.json(resImage);
});

module.exports = router;
