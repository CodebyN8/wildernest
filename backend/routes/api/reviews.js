const express = require("express");

const {
  User,
  Spot,
  SpotImage,
  Review,
  Sequelize,
  ReviewImage,
} = require("../../db/models");

const router = express.Router();

//Reviews by user
router.get("/", async (req, res) => {
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
        // include: [
        //     {
        //         model: SpotImage,
        //         attributes: ["url"],
        //         where: {
        //             previewImage: true,
        //         },
        //     },
        // ],
      },
      // {
      //   model: ReviewImage,
      //   attributes: { exclude: ["reviewId", "createdAt", "updatedAt"] },
      // },
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
