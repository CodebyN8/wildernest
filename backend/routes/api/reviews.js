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

const router = express.Router();

module.exports = router;
