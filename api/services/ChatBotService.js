'use strict'

const Service = require('trails-service')
const _ = require('lodash')

/**
 * @module ChatBotService
 * @description Manage chatbots
 */
module.exports = class ChatBotService extends Service {
  _getNestedState(freeStates, nestedStates, links) {

  }

  init(initialData) {
    return this.app.orm.ChatBot.find({
      where: {
        enabled: true
      }
    }).then(results => {
      if (!results || results.length === 0) {
        //initialData
        const bots = []
        _.forEach(initialData.bots, (botName, botData) => {
          const bot = {
            name: botName
          }

          _.forEach(botData.freeStates, (index, data) => {
            botData.nestedStates = this._getNestedState(data, botData.freeStates, botData.nestedStates, botData.links)
          })

          bots.push(bot)

        })
      }
      else {

      }
      this.log.info(results)
      this.chatBots = results
    })
  }

  reloadBot(name, data) {
    return this.app.orm.ChatBot.find({
      where: {
        name: name
      }
    }).then(result => {
      this.log.info(result)
      //TODO reload bots
    })
  }

  interact(userId, chatbot, lang, sentence) {
    const mycache = this.app.services.CacheService.getCaches()
    return new Promise((response, reject) => {
      mycache.get(userId + '_data', (err, result) => {
        if (err) {
          reject(err)
        }
        else {
          if (result) {

          }
          else {

          }
        }
        console.log(result)

      });
    });
  }
}

