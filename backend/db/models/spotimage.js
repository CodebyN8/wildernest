"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SpotImage extends Model {
    static associate(models) {
      // A SpotImage belongs to a Spot
      SpotImage.belongsTo(models.Spot, {
        foreignKey: "spotId",
        onDelete: "CASCADE",
      });
    }
  }

  SpotImage.init(
    {
      spotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      preview: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "SpotImage",
    }
  );

  return SpotImage;
};
