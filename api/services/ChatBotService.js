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
  /**
   * Compile sentences to change fields into regexp
   * @param sentences to compile
   * @returns {{}}
   * @private
   */
  _compileSentences(sentences) {
    const compiledSentences = {}
    _.each(sentences, (sentences, lang) => {
      compiledSentences[lang] = []
      for (let i = 0; i < sentences.length; i++) {
        const paramsName = []
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

  /**
   * Prepare chatBot data before saving in database
   * @param botId
   * @param botData
   * @private
   */
  _prepareChatBot(botId, botData) {
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
  }

  /**
   * Compile and save chatBot into DB
   * @param initialData
   * @returns {Promise.<ChatBot>}
   */
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
        _.forEach(initialData, (botData, botId) => {
          this._prepareChatBot(botId, botData)

          bots.push({
            name: botData.id,
            displayName: botData.name,
            enabled: botData.enabled,
            data: botData
          })
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

  /**
   * Add a new bot into DB
   * @param botId
   * @param botData
   * @returns {Promise.<TResult>}
   */
  addBot(botId, botData) {
    this._prepareChatBot(botId, botData)
    return this.app.orm.ChatBot.create(botData).then(result => {
      this.chatBots.push(result)
      return result
    })
  }

  /**
   * Delete a bot in DB
   * @param botId
   * @returns {Promise.<TResult>}
   */
  deleteBot(botId) {
    return this.app.orm.ChatBot.destroy({where: {name: botId}}).then(result => {
      const index = _.indexOf(this.chatBots, _.find(this.chatBots, {name: botId}))
      this.chatBots.splice(index, 1)
      return result
    })
  }

  /**
   * Update a bot in DB
   * @param botId
   * @param botData
   * @returns {Promise.<TResult>}
   */
  updateBot(botId, botData) {
    return this.app.orm.ChatBot.update(botData, {where: {name: botId}}).then(result => {
      this.reloadBot(botId)
      return result
    })
  }

  /**
   * Reload a specific bot
   * @param botId
   * @returns {Promise.<TResult>}
   */
  reloadBot(botId) {
    return this.app.orm.ChatBot.find({
      where: {
        name: botId
      }
    }).then(result => {
      if (result) {
        // Find item index using indexOf+find
        const index = _.indexOf(this.chatBots, _.find(this.chatBots, {name: botId}))
        this.chatBots.splice(index, 1, result)
      }
      return result
    })
  }

  /**
   * Search if the user sentence match a sentence from the state
   * @param bot
   * @param stateData
   * @param lang
   * @param userSentence
   * @param sentences
   * @returns {*}
   * @private
   */
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
          botId: bot.name,
          bot: bot,
          action: stateData ? stateData.id : null,
          state: stateData,
          lang: lang,
          userSentence: userSentence,
          match: matches,
          fields: fields
        }
        break
      }
    }
    return results
  }

  /**
   * Search if the sentence match a sentence from the free states of the bot
   * @param bot
   * @param lang
   * @param userSentence
   * @returns {*}
   * @private
   */
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

  /**
   * Ask to process user sentence
   * @param userId
   * @param lang
   * @param userSentence
   * @param chatBotId - optional - search into a specific bot only
   * @returns {Promise} processed data if found
   */
  interact(userId, lang, userSentence, chatBotId) {
    if (!userId && !this.app.config.chatbot.allowAnonymousUsers) {
      return Promise.reject('No user provided')
    }

    return new Promise((resolve, reject) => {
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
            if (chatBotId) {
              const bot = _.find(this.chatBots, {name: chatBotId})
              if (bot) {
                result = this._searchMatchForFreeStates(bot, lang, userSentence)
              }
              else {
                reject(new Error('unknow bot ' + chatBotId))
              }
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
            const hook = this.app.config.chatbot.hooks[result.action]
            if (userId) {
              this.botCache.set(userId + '_data', result, (err) => {
                if (err) {
                  reject(err)
                }
                else {
                  if (hook) {
                    hook(this.app, result).then(resolve).catch(reject)
                  }
                  else {
                    resolve(result)
                  }
                }
              })
            }
            else {
              if (hook) {
                hook(this.app, result).then(resolve).catch(reject)
              }
              else {
                resolve(result)
              }
            }
          }
          else {
            const defaultAnswer = this.app.config.chatbot.defaultAnswer
            if (defaultAnswer) {
              defaultAnswer(this.app, {
                userId: userId,
                userSentence: userSentence,
                botId: chatBotId,
                lang: lang
              }).then(resolve).catch(reject)
            }
            else {
              resolve({
                action: 'UNKNOWN',
                userId: userId,
                userSentence: userSentence,
                botId: chatBotId,
                lang: lang
              })
            }
          }
        }
      })
    })
  }
}

