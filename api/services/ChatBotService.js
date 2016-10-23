'use strict'

const Service = require('trails-service')
const _ = require('lodash')

/**
 * @module ChatBotService
 * @description Manage chatbots
 */
module.exports = class ChatBotService extends Service {
  /*
   _getNestedState(currentState, freeStates, nestedStates, links) {
   const stateLinks = links.filter(link => {
   return link.from === currentState.id
   })

   const idNestedStates = stateLinks.map(link => link.to)

   let stateNestedStates = nestedStates.filter(state => {
   return idNestedStates.indexOf(state.to) !== -1
   })

   stateNestedStates = stateNestedStates.concat(freeStates.filter(state => state.to === currentState.id)
   .map(state => state.id))

   stateNestedStates.forEach(state => {
   if (!_.isString(state)) {
   state.nestedStates = this._getNestedState(state, freeStates, nestedStates, links)
   }
   })

   return stateNestedStates
   }*/

  init(initialData) {
    initialData = _.cloneDeep(initialData)
    return this.app.orm.ChatBot.find({
      where: {
        enabled: true
      }
    }).then(results => {
      if (!results || results.length === 0) {
        //initialData
        const bots = []
        _.forEach(initialData.bots, (botData, botId) => {
          botData.id = botId
          _.forEach(botData.freeStates, (data, id) => {
            data.links = botData.links.filter(link => {
              return link.from === id
            })

          })

          _.forEach(botData.nestedStates, (data, id) => {
            data.links = botData.links.filter(link => {
              return link.from === id
            })
          })

          bots.push({
            name: botData.id,
            displayName: botData.name,
            enabled: botData.enabled,
            data: botData
          })
          this.log.debug(JSON.stringify(bots))
        })
        return this.app.orm.ChatBot.bulkCreate(bots).then(results => {
          this.chatBots = results
        })
      }
      else {
        this.chatBots = results
      }
      this.log.info(this.chatBots)
    })
  }

  reloadBot(id, data) {
    return this.app.orm.ChatBot.find({
      where: {
        name: id
      }
    }).then(result => {
      if (result) {
        this.log.info(result)
        // Find item index using indexOf+find
        const index = _.indexOf(this.chatBots, _.find(this.chatBots, {name: id}))
        this.chatBots.splice(index, 1, data)
      }
    })
  }

  _searchMatch(bot, lang, searchType, userSentence) {
    const keys = Object.keys(bot.data[searchType])
    let results = null
    for (let i = 0; i < keys.length; i++) {
      const stateId = keys[i]
      const stateData = bot.data.freeStates[stateId]

      for (let j = 0; j < stateData['sentences'][lang].length; j++) {
        const sentence = stateData['sentences'][lang][j]
        const reg = new RegExp(sentence, 'gi')

        const matches = userSentence.match(reg)
        if (matches) {
          results = {
            bot: bot,
            action: stateId,
            state: stateData,
            match: matches
          }
          break
        }
      }

      if (results) {
        break
      }
    }
    return results
  }

  interact(userId, lang, userSentence, chatbotId) {
    const mycache = this.app.services.CacheService.getCaches()
    return new Promise((response, reject) => {
      mycache.get(userId + '_data', (err, state) => {
        if (err) {
          reject(err)
        }
        else {
          if (state) {
            this.log.debug(state)
          }
          else {
            let result
            if (chatbotId) {
              const bot = _.find(this.chatBots, {name: chatbotId})
              result = this._searchMatch(bot, lang, 'freeStates', userSentence)
              this.log.debug(result)
            }
            else {
              for (let i = 0; i < this.chatBots.length; i++) {
                const bot = this.chatBots[i]
                result = this._searchMatch(bot, lang, 'freeStates', userSentence)
                this.log.debug(result)
                if (result) {
                  break
                }
              }
            }

            if (result) {
              mycache.set(userId + '_data', result, {ttl: 60}, (err) => {
                if (err) {
                  reject(err)
                }
                else {
                  response(result)
                }
              })
            }
            else {
              response({
                action: 'UNKNOWN'
              })
            }
          }
        }
        this.log.debug(state)
      })
    })
  }
}

