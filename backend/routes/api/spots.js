const express = require("express");
const {
  User,
  Spot,
  Booking,
  Review,
  SpotImage,
  Sequelize,
} = require("../../db/models");
const { requireAuth } = require("../../utils/auth");
const { Op } = require("sequelize");

const router = express.Router();

//Get all spots by current user
router.get("/current", requireAuth, async (req, res) => {
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

// Get all spots
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 20;
  const offset = size * (page - 1);
  const limit = size;
  const minLat = req.query.minLat;
  const maxLat = req.query.maxLat;
  const minLng = req.query.minLng;
  const maxLng = req.query.maxLng;
  const minPrice = req.query.minPrice;
  const maxPrice = req.query.maxPrice;

  const filter = {};
  const errors = {};

  if (page) {
    if (page < 1) {
      errors.page = "Page must be greater than or equal to 1";
    }
  }

  if (size) {
    if (size < 1) {
      errors.size = "Size must be greater than or equal to 1";
    }
  }

  if (minLat) {
    if (minLat < -90) {
      errors.minLat = "Minimum latitude is invalid";
    } else {
      filter.lat = { [Op.gte]: minLat };
    }
  }

  if (maxLat) {
    if (maxLat > 90) {
      errors.maxLat = "Maximum latitude is invalid";
    } else if (filter.lat) {
      filter.lat = { [Op.between]: [minLat, maxLat] };
    } else {
      filter.lat = { [Op.lte]: maxLat };
    }
  }

  if (minLng) {
    if (minLng < -180) {
      errors.minLng = "Minimum longitude is invalid";
    } else {
      filter.lng = { [Op.gte]: minLng };
    }
  }

  if (maxLng) {
    if (maxLng > 180) {
      errors.maxLng = "Maximum longitude is invalid";
    } else if (filter.lng) {
      filter.lng = { [Op.between]: [minLng, maxLng] };
    } else {
      filter.lng = { [Op.lte]: maxLng };
    }
  }

  if (minPrice) {
    if (minPrice < 0) {
      errors.minPrice = "Minimum price must be greater than or equal to 0";
    } else {
      filter.price = { [Op.gte]: minPrice };
    }
  }

  if (maxPrice) {
    if (minPrice < 0) {
      errors.maxPrice = "Maximum price must be greater than or equal to 0";
    } else if (filter.price) {
      filter.price = { [Op.between]: [minPrice, maxPrice] };
    } else {
      filter.price = { [Op.lte]: maxPrice };
    }
  }

  console.log(offset);
  console.log(limit);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: "Bad Request",
      errors,
    });
  }
  const allSpots = await Spot.findAll({
    where: filter,

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

  const spotResults = [];

  for (let i = offset; i < allSpots.length && i < offset + limit; i++) {
    spotResults.push(allSpots[i]);
  }
  res.json({ Spots: spotResults, page, size });
});

// GET all bookings for a spot
router.get("/:spotId/bookings", async (req, res, next) => {
  const { spotId } = req.params;
  const user = req.user;

  const spot = await Spot.findOne({
    where: { id: spotId },
  });

  if (!spot) {
    return res.status(404).json({
      message: "Spot couldn't be found",
    });
  }

  if (user && spot.ownerId === user.id) {
    const ownerBookings = await Booking.findAll({
      where: { spotId },
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });

    const bookingsWithUsers = ownerBookings.map((booking) => ({
      id: booking.id,
      spotId: booking.spotId,
      userId: booking.userId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      User: {
        id: booking.User.id,
        firstName: booking.User.firstName,
        lastName: booking.User.lastName,
      },
    }));

    return res.json({ Bookings: bookingsWithUsers });
  }

  const publicBookings = await Booking.findAll({
    where: { spotId },
    attributes: ["startDate", "endDate"],
  });

  return res.json({ Bookings: publicBookings });
});

//reviews for a spot
router.get("/:spotId/reviews", async (req, res) => {
  const { spotId } = req.params;
  const spot = await Spot.findOne({
    where: {
      id: spotId,
    },
  });

  if (spot === null) {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  }

  const reviews = await Review.findAll({
    where: {
      spotId: spot.id,
    },

    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName"],
      },
    ],
  });

  res.json({ Reviews: reviews });
});

// Spot details by id

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const spot = await Spot.findAll({
    where: {
      id: id,
    },
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
      [Sequelize.fn("COUNT", Sequelize.col("Reviews.id")), "numReviews"],

      [
        Sequelize.fn(
          "ROUND",
          Sequelize.fn("AVG", Sequelize.col("Reviews.stars")),
          2
        ),
        "avgRating",
      ],
    ],
    include: [
      {
        model: SpotImage,
        attributes: ["id", "url", "preview"],
      },
      {
        model: Review,
        attributes: [],
      },
      {
        model: User,
        as: "Owner",
        attributes: ["id", "firstName", "lastName"],
      },
    ],
    group: [["Spot.id"], ["SpotImages.url"], ["SpotImages.id"], ["Owner.id"]],
    order: [["id", "ASC"]],
  });

  if (spot.length === 0) {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  } else {
    res.json({ Spots: spot });
  }
});

//Create a new spot
router.post("/", requireAuth, async (req, res) => {
  const user = req.user.id;

  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;

  const errors = {};

  if (!address) {
    errors.address = "Street address is required";
  }
  if (!city) {
    errors.city = "City is required";
  }
  if (!state) {
    errors.state = "State is required";
  }
  if (!country) {
    errors.country = "Country is required";
  }
  if (!lat || isNaN(lat) || lat < -90 || lat > 90) {
    errors.lat = "Latitude is not valid";
  }
  if (!lng || isNaN(lng) || lng < -180 || lng > 180) {
    errors.lng = "Longitude is not valid";
  }
  if (!name || name.length > 50) {
    errors.name = "Name must be less than 50 characters";
  }
  if (!description) {
    errors.description = "Description is required";
  }
  if (!price || isNaN(price) || price < 0) {
    errors.price = "Price per day is required";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: "Bad Request",
      errors,
    });
  }

  const newSpot = await Spot.create({
    ownerId: user,
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price,
  });

  res.json(newSpot);
});

//Add image to a spot based on spot id
router.post("/:spotId/images", requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const { url, preview } = req.body;

  const spot = await Spot.findOne({
    where: {
      id: spotId,
    },
  });

  if (spot === null) {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  }

  const previewExist = await SpotImage.findOne({
    where: {
      spotId: spot.id,
      preview: true,
    },
  });

  if (preview === true && previewExist) {
    return res
      .status(403)
      .json({ message: "This spot already has a preview image" });
  }

  const newImage = await SpotImage.create({
    spotId: spotId,
    url,
    preview,
  });

  res.json({ id: newImage.id, url, preview });
});

// Add image to a spot based on spot id
router.post("/spotId/images", requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const { url, preview } = req.body;

  const spot = await Spot.findOne({
    where: {
      id: spotId,
    },
  });

  if (spot === null) {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  }

  const previewExist = await SpotImage.findOne({
    where: {
      spotId: spot.id,
      preview: true,
    },
  });

  if (preview === true && previewExist) {
    return res
      .status(403)
      .json({ message: "This spot already has a preview image" });
  }

  const newImage = await SpotImage.create({
    spotId: spotId,
    url,
    preview,
  });

  res.json({ id: newImage.id, url, preview });
});

//edit a spot
router.put("/:spotId", requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const user = req.user.id;

  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;

  const spotFields = [
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
  ];

  const errors = {};

  if (!address) {
    errors.address = "Street address is required";
  }
  if (!city) {
    errors.city = "City is required";
  }
  if (!state) {
    errors.state = "State is required";
  }
  if (!country) {
    errors.country = "Country is required";
  }
  if (!lat || isNaN(lat) || lat < -90 || lat > 90) {
    errors.lat = "Latitude is not valid";
  }
  if (!lng || isNaN(lng) || lng < -180 || lng > 180) {
    errors.lng = "Longitude is not valid";
  }
  if (!name || name.length > 50) {
    errors.name = "Name must be less than 50 characters";
  }
  if (!description) {
    errors.description = "Description is required";
  }
  if (!price || isNaN(price) || price < 0) {
    errors.price = "Price per day is required";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: "Bad Request",
      errors,
    });
  }

  const spot = await Spot.findOne({
    where: { id: spotId },
  });

  if (!spot) {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  }

  if (spot.ownerId !== user) {
    return res.status(403).json({
      message: "Forbidden: You do not have permission to edit this spot",
    });
  }

  spotFields.forEach((field) => {
    if (req.body[field]) {
      spot[field] = req.body[field];
    }
  });

  spot.save();

  res.json(spot);
});

//Delete a spot
router.delete("/:spotId", requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const spot = await Spot.findOne({
    where: {
      id: spotId,
    },
  });

  if (spot === null) {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  }

  spot.destroy();
  res.json({ message: "Successfully deleted" });
});

router.get("/:spotId/reviews", async (req, res) => {
  const { spotId } = req.params;
  const spot = await Spot.findOne({
    where: {
      id: spotId,
    },
  });

  if (spot === null) {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  }

  // get all reviews for a spot
  const reviews = await Review.findAll({
    where: {
      spotId: spot.id,
    },

    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName"],
      },
      {
        model: ReviewImage,
        attributes: ["id", "url"],
        required: false,
      },
    ],
  });

  res.json({ Reviews: reviews });
});

//create a review based off spotId
router.post("/:spotId/reviews", requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const { review, stars } = req.body;

  const errors = {};

  if (!stars || isNaN(stars) || stars > 5 || stars <= 0) {
    errors.stars = "Stars must be an integer from 1 to 5";
  }

  if (!review) {
    errors.review = "Review text is required";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: "Bad Request",
      errors,
    });
  }

  const spot = await Spot.findOne({
    where: {
      id: spotId,
    },
  });
  if (spot === null) {
    return res.status(404).json({
      message: "Spot couldn't be found",
    });
  }

  const findReview = await Review.findOne({
    where: {
      userId: req.user.id,
      spotId: spot.id,
    },
  });

  if (findReview) {
    return res.status(500).json({
      message: "User already has a review for this spot",
    });
  }

  const postReview = await Review.create({
    spotId: spot.id,
    userId: req.user.id,
    review,
    stars,
  });

  res.json(postReview);
});

//bookings by spot id
router.get("/:spotId/bookings", requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const { user } = req;

  const spot = await Spot.findOne({
    where: {
      id: spotId,
    },
  });

  if (spot === null) {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  }

  if (spot.ownerId === user.id) {
    const userBookings = await Booking.findAll({
      where: {
        spotId: spotId,
      },
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });

    let bookingResults = [];
    for (let i = 0; i < userBookings.length; i++) {
      let booking = userBookings[i];
      let bookingObj = booking.toJSON();
      let userObj = bookingObj.User;

      bookingResults.push({
        User: {
          UserId: userObj.id,
          FirstName: userObj.firstName,
          LastName: userObj.lastName,
        },
        id: bookingObj.id,
        spotId: bookingObj.spotId,
        userId: bookingObj.userId,
        StartDate: bookingObj.startDate,
        EndDate: bookingObj.endDate,
        CreatedAt: bookingObj.createdAt,
        UpdatedAt: bookingObj.updatedAt,
      });
    }

    return res.json({ Bookings: bookingResults });
  } else {
    const notUserBookings = await Booking.findAll({
      where: {
        spotId: spotId,
      },
      attributes: {
        exclude: ["id", "userId", "createdAt", "updatedAt"],
      },
    });
    res.json({ Bookings: notUserBookings });
  }
});

//create a booking
router.post("/:spotId/bookings", requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const { startDate, endDate } = req.body;
  const user = req.user;

  const errors = {};

  const spot = await Spot.findOne({
    where: {
      id: spotId,
    },
  });

  if (spot === null) {
    return res.status(404).json({
      message: "Spot couldn't be found",
    });
  }

  let currentDate = new Date();

  if (startDate > endDate) {
    return res
      .status(400)
      .json({ message: "endDate cannot be on or before startDate" });
  }

  const conflictingBookings = await Booking.findAll({
    where: {
      spotId: spot.id,
      [Op.or]: [
        {
          startDate: {
            [Op.lte]: startDate,
          },
          endDate: {
            [Op.between]: [startDate, endDate],
          },
        },
        {
          startDate: {
            [Op.between]: [startDate, endDate],
          },
          endDate: {
            [Op.gte]: endDate,
          },
        },
        {
          startDate: {
            [Op.between]: [startDate, endDate],
          },
          endDate: {
            [Op.between]: [startDate, endDate],
          },
        },
        {
          startDate: {
            [Op.lte]: startDate,
          },
          endDate: {
            [Op.gte]: endDate,
          },
        },
      ],
    },
  });

  if (conflictingBookings.length > 0) {
    errors.startDate = "Start date conflicts with an existing booking";
    errors.endDate = "End date conflicts with an existing booking";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(403).json({
      message: "Sorry, this spot is already booked for the specified dates",
      errors,
    });
  }

  if (new Date(startDate) < currentDate || new Date(endDate) < currentDate) {
    return res.json({
      message: "you cannot set a booking in the past",
    });
  }

  if (user.id === spot.ownerId) {
    return res.json({
      message: "Spot cannot be booked by owner",
    });
  }

  const postBooking = await Booking.create({
    spotId: spot.id,
    userId: req.user.id,
    startDate,
    endDate,
  });

  res.json(postBooking);
});

module.exports = router;
