// backend/routes/api/session.js
const express = require("express");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const { requireAuth } = require("../../utils/auth");

const { setTokenCookie, restoreUser } = require("../../utils/auth");
const {
  User,
  Spot,
  Review,
  Booking,
  SpotImage,
  ReviewImage,
  Sequelize,
} = require("../../db/models");

const router = express.Router();

const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const validateLogin = [
  check("credential")
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage("Email or username is required"),
  check("password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required"),
  handleValidationErrors,
];

/// Log in
router.post("/", validateLogin, async (req, res, next) => {
  const { credential, password } = req.body;

  const user = await User.unscoped().findOne({
    where: {
      [Op.or]: {
        username: credential,
        email: credential,
      },
    },
  });

  if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
    const err = new Error("Login failed");
    err.status = 401;
    err.title = "Login failed";
    err.errors = { credential: "The provided credentials were invalid." };
    return next(err);
  }

  const safeUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    username: user.username,
  };

  await setTokenCookie(res, safeUser);

  return res.json({
    user: safeUser,
  });
});

// Log out
router.delete("/", (_req, res) => {
  res.clearCookie("token");
  return res.json({ message: "success" });
});

// Restore session user
router.get("/", (req, res) => {
  const { user } = req;
  if (user) {
    const safeUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    };
    return res.json({
      user: safeUser,
    });
  } else return res.json({ user: null });
});

//Reviews by user
router.get("/reviews", async (req, res) => {
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
    ],
  });

  let reviewsArr = [];

  for (let i = 0; i < reviews.length; i++) {
    let review = reviews[i];
    let revObj = review.toJSON();
    let spot = revObj.Spot;

    reviewsArr.push(revObj);
  }

  res.json({ Reviews: reviewsArr });
});

//Get all spots by current user
router.get("/spots", requireAuth, async (req, res) => {
  const user = req.user;

  const allSpots = await Spot.findAll({
    where: [{ ownerId: user.id }],
    attributes: [
      "id",
      "ownerId",
      "address",
      "city",
      "state",
      "country",
      "lat",
      "lng",
      "name",
      "description",
      "price",
      "createdAt",
      "updatedAt",
      [
        Sequelize.fn(
          "ROUND",
          Sequelize.fn("AVG", Sequelize.col("Reviews.stars")),
          2
        ),
        "avgRating",
      ],

      [Sequelize.col("SpotImages.url"), "previewImage"],
    ],

    include: [
      {
        model: SpotImage,
        as: "SpotImages",
        where: {
          preview: true,
        },
        required: false,
        attributes: [],
      },
      {
        model: Review,
        required: false,
        attributes: [],
      },
    ],
    group: [["Spot.id"], ["SpotImages.url"]],
    order: [["id", "ASC"]],
  });
  res.json({ Spots: allSpots });
});

//Reviews by user
router.get("/", requireAuth, async (req, res) => {
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

//get all bookings by user
router.get("/bookings", requireAuth, async (req, res) => {
  const { user } = req;
  console.log(user.id);

  const bookings = await Booking.findAll({
    where: {
      userId: user.id,
    },

    include: [
      {
        model: Spot,
        attributes: {
          exclude: ["description", "createdAt", "updatedAt"],
        },
      },
    ],
  });

  const bookingResults = [];

  for (let i = 0; i < bookings.length; i++) {
    let booking = bookings[i];
    let bookingObj = booking.toJSON();
    let spot = bookingObj.Spot;

    let previewImage = await SpotImage.findOne({
      where: {
        preview: true,
        spotId: spot.id,
      },
    });

    if (previewImage) {
      spot.previewImage = previewImage.url;
    } else {
      spot.previewImage = null;
    }

    bookingResults.push(bookingObj);
  }
  res.json({ Bookings: bookingResults });
});
module.exports = router;
