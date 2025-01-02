const express = require("express");
const { User, Spot, Booking } = require("../../db/models");

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

// GET all bookings for a spot
router.get("/:spotId/bookings", async (req, res) => {
  const { spotId } = req.params;
  const user = req.user;

  try {
    // Find the spot
    const spot = await Spot.findOne({
      where: { id: spotId },
    });

    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found",
      });
    }

    // Check if the requesting user is the owner of the spot
    if (user && spot.ownerId === user.id) {
      // Owner: Include user details in the response
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
    } else {
      // Non-owner: Only show non-sensitive booking details
      const publicBookings = await Booking.findAll({
        where: { spotId },
        attributes: ["startDate", "endDate"], // Exclude sensitive data
      });

      return res.json({ Bookings: publicBookings });
    }
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;
