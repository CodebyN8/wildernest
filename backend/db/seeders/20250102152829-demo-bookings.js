"use strict";

const { Booking } = require("../models");

let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await Booking.bulkCreate([
      {
        spotId: 1,
        userId: 2,
        startDate: "2025-01-15",
        endDate: "2025-01-20",
      },
      {
        spotId: 2,
        userId: 3,
        startDate: "2025-02-01",
        endDate: "2025-02-07",
      },
      {
        spotId: 3,
        userId: 1,
        startDate: "2025-03-10",
        endDate: "2025-03-15",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    options.tableName = "Bookings";
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        spotId: { [Op.in]: [1, 2, 3] },
      },
      {}
    );
  },
};
