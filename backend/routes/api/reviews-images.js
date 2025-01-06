const express = require("express");
const { ReviewImage, Review } = require("../../db/models");
const { requireAuth } = require("../../utils/auth");

const router = express.Router();

// Delete a review image
router.delete("/:imageId", requireAuth, async (req, res) => {
  const { imageId } = req.params;
  const userId = req.user.id;

  try {
    const image = await ReviewImage.findOne({
      where: { id: imageId },
    });

    if (!image) {
      return res.status(404).json({
        message: "Review Image couldn't be found",
      });
    }

    const review = await Review.findOne({
      where: { id: image.reviewId },
    });

    if (!review) {
      return res.status(404).json({
        message: "Review associated with the image couldn't be found",
      });
    }

    if (review.userId !== userId) {
      return res.status(403).json({
        message: "Review Image does not belong to user",
      });
    }

    await image.destroy();

    return res.json({ message: "Successfully deleted" });
  } catch (error) {
    console.error("Error deleting review image:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;
