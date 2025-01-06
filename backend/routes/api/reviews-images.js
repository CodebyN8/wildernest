const express = require("express");
const { ReviewImage, Review } = require("../../db/models");
const { requireAuth } = require("../../utils/auth");

const router = express.Router();

//Delete a review image
router.delete("/:reviewId/images/:imageId", requireAuth, async (req, res) => {
  const { imageId } = req.params;
  const user = req.user.id;
  const image = await ReviewImage.findOne({
    where: {
      id: imageId,
    },
  });

  if (image === null) {
    return res.status(404).json({
      message: "Review Image couldn't be found",
    });
  }

  const review = await Review.findOne({
    where: {
      id: image.reviewId,
    },
  });

  if (user !== review.userId) {
    return res.status(401).json({
      message: "Review Image does not belong to user",
    });
  }

  image.destroy();
  res.json({ message: "Successfully deleted" });
});

module.exports = router;
