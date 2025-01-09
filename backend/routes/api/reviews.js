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

//Reviews by user
router.get("/current", requireAuth, async (req, res) => {
  const user = req.user;

  const reviews = await Review.findAll({
    where: {
      userId: user.id,
    },
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName"],
      },
      {
        model: Spot,
        attributes: {
          exclude: ["description", "createdAt", "updatedAt"],
        },
      },
      {
        model: ReviewImage,
        attributes: { exclude: ["reviewId", "createdAt", "updatedAt"] },
      },
    ],
  });

  let reviewsArr = [];

  for (let i = 0; i < reviews.length; i++) {
    let review = reviews[i];
    let revObj = review.toJSON();
    let spot = revObj.Spot;

    let spotImage = await SpotImage.findOne({
      where: {
        spotId: spot.id,
        preview: true,
      },
    });

    if (spotImage) {
      spot.previewImage = spotImage.url;
    } else {
      spot.previewImage = null;
    }

    reviewsArr.push(revObj);
  }

  res.json({ Reviews: reviewsArr });
});

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

//edit a review
router.put("/:reviewId", requireAuth, async (req, res) => {
  const { reviewId } = req.params;
  const { review, stars } = req.body;

  const user = req.user;

  const reviewFields = ["review", "stars"];

  const findReview = await Review.findOne({
    where: { id: reviewId },
  });

  if (findReview === null) {
    res.status(404).json({
      message: "Review couldn't be found",
    });
  }

  if (findReview.userId !== user.id) {
    return res.json({
      message: "Review must belong to the current user",
    });
  }

  if (findReview === null) {
    res.status(404).json({
      message: "Review couldn't be found",
    });
  }

  const errors = {};

  if (!stars || isNaN(stars) || stars > 5 || stars <= 0) {
    errors.stars = "Stars must be an integer from 1 to 5";
  }

  if (!review) {
    errors.review = "Review text is required";
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      message: "Bad Request",
      errors,
    });
  }

  reviewFields.forEach((field) => {
    if (req.body[field]) {
      findReview[field] = req.body[field];
    }
  });

  findReview.save();

  res.json(findReview);
});

// delete a review
router.delete("/:reviewId", requireAuth, async (req, res) => {
  const { reviewId } = req.params;
  const user = req.user;
  const review = await Review.findOne({
    where: {
      id: reviewId,
    },
  });

  if (review === null) {
    res.status(404).json({
      message: "Review couldn't be found",
    });
  }

  if (review.userId !== user.id) {
    return res.json({
      message: "Review must belong to the current user",
    });
  }

  review.destroy();
  res.json({ message: "Review has been deleted" });
});

module.exports = router;
