'use strict'

const Service = require('trails-service')
const _ = require('lodash')

const mapParams = {
  'number': '([0-9]+)',
  'text': '([a-zA-Z]+)',
  'acceptance': '^(ok|oui|yes|ouai|no problem|aucun problème|ça marche|it\'s ok|sure|volontier|let\'s do this)$',
}

/**
 * @module ChatBotService
 * @description Manage chatbots
 */
module.exports = class ChatBotService extends Service {

  _compileSentences(sentences) {
    const compiledSentences = {}
    _.each(sentences, (sentences, lang) => {
      compiledSentences[lang] = []
      for (let i = 0; i < sentences.length; i++) {
        let paramsName = []
        const sentence = sentences[i].replace(/(%[a-zA-Z_]+%)/gi, function (matched) {
          matched = matched.replace(/%/g, '')
          const parts = matched.split('_')
          if (parts.length > 1) {
            paramsName.push(parts[1])
          }
          else {
            paramsName.push(parts[0])
          }
          return mapParams[parts[0]] || '([a-zA-z]+)'
        })
        compiledSentences[lang][i] = {
          sentence: sentence,
          fields: paramsName
        }
      }
    })
    return compiledSentences
  }

  init(initialData) {
    this.botCache = this.app.services.CacheService.getCaches()
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

          _.each(botData.links, link => {
            link.compiledSentences = this._compileSentences(link.sentences)
          })

          _.each(botData.freeStates, (data, id) => {
            data.id = id
            data.compiledSentences = this._compileSentences(data.sentences)
            data.links = botData.links.filter(link => {
              return link.from === id
            })
          })

          _.each(botData.nestedStates, (data, id) => {
            data.id = id
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
    })
  }

  reloadBot(id, data) {
    return this.app.orm.ChatBot.find({
      where: {
        name: id
      }
    }).then(result => {
      if (result) {
        // Find item index using indexOf+find
        const index = _.indexOf(this.chatBots, _.find(this.chatBots, {name: id}))
        this.chatBots.splice(index, 1, data)
      }
    })
  }

  _searchMatch(bot, stateData, lang, userSentence, sentences) {
    let results = null
    for (let j = 0; j < sentences[lang].length; j++) {
      const sentenceData = sentences[lang][j]
      const reg = new RegExp(sentenceData.sentence, 'gi')

      const matches = reg.exec(userSentence)
      if (matches) {
        const fields = {}
        if (matches.length > 1) {
          for (let i = 1; i < matches.length; i++) {
            const match = matches[i]
            fields[sentenceData.fields[i - 1]] = match
          }
        }
        results = {
          bot: bot,
          action: stateData ? stateData.id : null,
          state: stateData,
          match: matches,
          fields: fields
        }
        break
      }
    }
    return results
  }

  _searchMatchForFreeStates(bot, lang, userSentence) {
    const keys = Object.keys(bot.data['freeStates'])
    let results = null
    for (let i = 0; i < keys.length; i++) {
      const stateId = keys[i]
      const stateData = bot.data.freeStates[stateId]
      stateData.id = stateId

      results = this._searchMatch(bot, stateData, lang, userSentence, stateData.compiledSentences)

      if (results) {
        break
      }
    }
    return results
  }

  interact(userId, lang, userSentence, chatbotId) {
    return new Promise((response, reject) => {
      this.botCache.get(userId + '_data', (err, data) => {
        if (err) {
          reject(err)
        }
        else {
          let result
          // if previous data exist, we search for nested states first
          if (data) {
            const bot = data.bot

            for (let i = 0; i < data.state.links.length; i++) {
              const link = data.state.links[i]

              result = this._searchMatch(bot, null, lang, userSentence, link.compiledSentences)

              if (result) {
                result.state = bot.data.nestedStates[link.to]
                result.action = result.state.id
                break
              }
            }
          }

          // no result in nested data or we want to test free states
          if (!result) {
            if (chatbotId) {
              const bot = _.find(this.chatBots, {name: chatbotId})
              result = this._searchMatchForFreeStates(bot, lang, userSentence)
            }
            else {
              for (let i = 0; i < this.chatBots.length; i++) {
                const bot = this.chatBots[i]
                result = this._searchMatchForFreeStates(bot, lang, userSentence)
                if (result) {
                  break
                }
              }
            }
          }

          if (result) {
            this.botCache.set(userId + '_data', result, (err) => {
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
      })
    })
  }
}

