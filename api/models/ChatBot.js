'use strict'

const Model = require('trails/model')

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
          let data = null
          if (this.getDataValue('data')) {
            data = JSON.parse(this.getDataValue('data'))
          }
          return data
        },
        set: function (value) {
          if (value) {
            this.setDataValue('data', JSON.stringify(value))
          }
          else {
            this.setDataValue('data', null)
          }
        },
        allowNull: false
      },
      originalData: {
        type: Sequelize.STRING,
        get: function () {
          let data = null
          if (this.getDataValue('originalData')) {
            data = JSON.parse(this.getDataValue('originalData'))
          }
          return data
        },
        set: function (value) {
          if (value) {
            this.setDataValue('originalData', JSON.stringify(value))
          }
          else {
            this.setDataValue('originalData', null)
          }
        },
        allowNull: false
      }
    }
  }
}
