"use strict";

const { Spot } = require("../models");

let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await Spot.bulkCreate([
      {
        ownerId: 1,
        address: "123 Beach Ave",
        city: "Santa Monica",
        state: "CA",
        country: "USA",
        lat: 34.0195,
        lng: -118.4912,
        name: "Cozy Beachfront Spot",
        description:
          "A beautiful spot right by the beach. Perfect for a relaxing getaway.",
        price: 250,
      },
      {
        ownerId: 2,
        address: "456 Mountain Road",
        city: "Aspen",
        state: "CO",
        country: "USA",
        lat: 39.1911,
        lng: -106.8175,
        name: "Mountain Retreat",
        description: "A cozy cabin in the mountains with breathtaking views.",
        price: 400,
      },
      {
        ownerId: 3,
        address: "789 Urban Lane",
        city: "New York",
        state: "NY",
        country: "USA",
        lat: 40.7128,
        lng: -74.006,
        name: "City Loft",
        description: "Modern loft located in the heart of the city.",
        price: 300,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    options.tableName = "Spots";
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        name: {
          [Op.in]: ["Cozy Beachfront Spot", "Mountain Retreat", "City Loft"],
        },
      },
      {}
    );
  },
};
