const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Vote', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    questionId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    answerId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isIn: [[1, -1]]
      }
    }
  }, {
    tableName: 'votes',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'questionId'],
        name: 'uq_user_question'
      },
      {
        unique: true,
        fields: ['userId', 'answerId'],
        name: 'uq_user_answer'
      }
    ]
  });
};
