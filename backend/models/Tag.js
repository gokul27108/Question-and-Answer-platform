const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Tag', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    }
  }, {
    tableName: 'tags',
    timestamps: false
  });
};
