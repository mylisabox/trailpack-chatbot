'use strict'

const Model = require('trails-model')

/**
 * @module ChatBot
 * @description ChatBot model
 */
module.exports = class ChatBot extends Model {

  static config(app, Sequelize) {
  }

  static schema(app, Sequelize) {
    return {
      name: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      displayName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      data: {
        type: Sequelize.STRING,
        get: function () {
          return JSON.parse(this.getDataValue('data'))
        },
        set: function (value) {
          this.setDataValue('data', JSON.stringify(value))
        },
        allowNull: false
      }
    }
  }
}
