"use strict";

const { Review } = require("../models");

let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await Review.bulkCreate([
      {
        userId: 1,
        spotId: 2,
        review: "Amazing spot with great views! Highly recommend.",
        stars: 5,
      },
      {
        userId: 2,
        spotId: 3,
        review: "Comfortable stay, but a bit noisy at night.",
        stars: 4,
      },
      {
        userId: 3,
        spotId: 1,
        review: "Not as advertised, needs better maintenance.",
        stars: 2,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    options.tableName = "Reviews";
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
