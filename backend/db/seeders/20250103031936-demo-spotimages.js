"use strict";

const { SpotImage } = require("../models");

let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await SpotImage.bulkCreate([
      {
        spotId: 1,
        url: "https://example.com/spot-images/spot1-img1.jpg",
        preview: true,
      },
      {
        spotId: 1,
        url: "https://example.com/spot-images/spot1-img2.jpg",
        preview: false,
      },
      {
        spotId: 2,
        url: "https://example.com/spot-images/spot2-img1.jpg",
        preview: true,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    options.tableName = "SpotImages";
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        spotId: { [Op.in]: [1, 2] },
      },
      {}
    );
  },
};
