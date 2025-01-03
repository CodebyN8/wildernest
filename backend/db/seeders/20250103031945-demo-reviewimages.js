"use strict";

const { ReviewImage } = require("../models");

let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await ReviewImage.bulkCreate([
      {
        reviewId: 1,
        url: "https://example.com/review-images/review1-img1.jpg",
      },
      {
        reviewId: 2,
        url: "https://example.com/review-images/review2-img1.jpg",
      },
      {
        reviewId: 2,
        url: "https://example.com/review-images/review2-img2.jpg",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    options.tableName = "ReviewImages";
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        reviewId: { [Op.in]: [1, 2] },
      },
      {}
    );
  },
};
