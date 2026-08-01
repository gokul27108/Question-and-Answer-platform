const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Question', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    acceptedAnswerId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'questions',
    timestamps: false
  });
};
