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

//edit a booking
router.put("/:bookingId", requireAuth, async (req, res) => {
  const { bookingId } = req.params;

  const { startDate, endDate } = req.body;
  const errors = {};

  const bookingFields = ["startDate", "endDate"];
  let currentDate = new Date();
  const booking = await Booking.findOne({
    where: { id: bookingId },
  });

  if (!booking) {
    res.status(404).json({
      message: "Booking couldn't be found",
    });
  }

  if (startDate > endDate) {
    return res
      .status(400)
      .json({ message: "endDate cannot be on or before startDate" });
  }

  const conflictingBookings = await Booking.findAll({
    where: {
      spotId: booking.spotId,
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

  if (new Date(booking.startDate) < currentDate) {
    return res.json({
      message: "Past bookings can't be modified",
    });
  }

  if (new Date(startDate) < currentDate || new Date(endDate) < currentDate) {
    return res.json({
      message: "You cannot set a booking in the past",
    });
  }

  if (new Date(booking.startDate) < currentDate) {
    return res.json({
      message: "Past bookings can't be modified",
    });
  }

  bookingFields.forEach((field) => {
    if (req.body[field]) {
      booking[field] = req.body[field];
    }
  });
  const newstartDate = new Date(booking.startDate);
  const newendDate = new Date(booking.endDate);

  if (newendDate < newstartDate) {
    return res
      .status(400)
      .json({ error: "End date must be after the start date." });
  }

  booking.save();

  res.json({ booking });
});

//delete a booking
router.delete("/:bookingId", requireAuth, async (req, res) => {
  const { bookingId } = req.params;
  const user = req.user.id;
  const currentDate = new Date();
  const booking = await Booking.findOne({
    where: {
      id: bookingId,
    },
  });

  if (booking === null) {
    return res.status(404).json({
      message: "Booking couldn't be found",
    });
  }

  if (booking.userId !== user) {
    return res.status(403).json({
      message: "Booking does not belong to user",
    });
  }

  if (currentDate > booking.startDate) {
    return res.json({
      message: "Bookings that have been started can't be deleted",
    });
  }

  booking.destroy();
  res.json({ message: "Successfully deleted" });
});

//get all bookings by user
router.get("/current", requireAuth, async (req, res) => {
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
