const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('User', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    bio: {
      type: DataTypes.TEXT
    },
    reputation: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    avatarUrl: {
      type: DataTypes.STRING(255)
    },
    roles: {
      type: DataTypes.JSON,
      defaultValue: ['USER']
    },
    badges: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    tableName: 'users',
    timestamps: false
  });
};
