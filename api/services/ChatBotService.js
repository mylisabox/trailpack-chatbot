'use strict'

const Service = require('trails/service')
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
  _prepareParam(key, value) {
    if (Array.isArray(value)) {
      mapParams[key] = `(${value.join('|')})`
    }
    else if (_.isFunction(value)) {
      return value(this.app).then(result => {
        if (Array.isArray(result)) {
          mapParams[key] = `(${result.join('|')})`
        }
        else {
          mapParams[key] = result
        }
      }).catch(err => mapParams[key] = null)
    }
    else if (_.isPlainObject(value)) {
      const keys = Object.keys(value)
      mapParams[key] = `(${keys.join('|')})`
    }
    else {
      mapParams[key] = value
    }
    return Promise.resolve()
  }

  _prepareParams() {
    _.merge(mapParams, this.app.config.chatbot.params)
    const promises = []
    _.each(mapParams, (value, key) => {
      promises.push(this._prepareParam(key, value))
    })
    return Promise.all(promises)
  }

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
    let data
    if (botData.originalData) {
      botData.data.links = botData.originalData.links
      botData.data.freeStates = botData.originalData.freeStates
      botData.data.nestedStates = botData.originalData.nestedStates
      _.each(botData.data.links, link => {
        link.compiledSentences = this._compileSentences(link.sentences)
      })

      _.each(botData.data.freeStates, (dataState, id) => {
        dataState.id = id
        dataState.compiledSentences = this._compileSentences(dataState.sentences)
        dataState.links = botData.data.links.filter(link => {
          return link.from === id
        })
      })

      _.each(botData.data.nestedStates, (dataState, id) => {
        dataState.id = id
        dataState.links = botData.data.links.filter(link => {
          return link.from === id
        })
      })

      data = botData
    }
    else {
      data = _.cloneDeep(botData)
      data.displayName = botData.name
      data.name = botId
      _.each(data.links, link => {
        link.compiledSentences = this._compileSentences(link.sentences)
      })

      _.each(data.freeStates, (dataState, id) => {
        dataState.id = id
        dataState.compiledSentences = this._compileSentences(dataState.sentences)
        dataState.links = data.links.filter(link => {
          return link.from === id
        })
      })

      _.each(data.nestedStates, (dataState, id) => {
        dataState.id = id
        dataState.links = data.links.filter(link => {
          return link.from === id
        })
      })
      data = _.merge({
        name: botId,
        displayName: botData.name,
        data: data,
        originalData: {
          links: botData.links,
          freeStates: botData.freeStates,
          nestedStates: botData.nestedStates
        }
      }, _.omit(botData, ['name', 'links', 'freeStates', 'nestedStates']))
    }
    return data
  }

  /**
   * Compile and save chatBot into DB
   * @param initialData
   * @returns {Promise.<ChatBot>}
   */
  init(initialData) {
    this.botCache = this.app.services.CacheService.getStore('chatbot')
    initialData = _.cloneDeep(initialData)
    this.chatBots = []
    return this._prepareParams().then(() => this.app.orm.ChatBot.findAll({
      where: {
        enabled: true
      }
    }).then(results => {
      const bots = []
      _.forEach(initialData, (botData, botId) => {
        bots.push(this._prepareChatBot(botId, botData))
      })

      if (!results || results.length === 0) {
        return this.app.orm.ChatBot.bulkCreate(bots).then(results => {
          this.chatBots = results || []
          return results
        })
      }
      else {
        const updates = []
        for (const bot of bots) {
          if (results.filter(result => result.name === bot.name.toLowerCase()).length > 0) {
            updates.push(this.app.orm.ChatBot.update(bot, { where: { name: bot.name } }))
          }
          else {
            updates.push(this.app.orm.ChatBot.create(bot))
          }
        }
        return Promise.all(updates).then(results => this.reloadBots())
      }
    }))
  }

  /**
   * Add a new bot into DB
   * @param botId
   * @param botData
   * @returns {Promise.<TResult>}
   */
  addBot(botId, botData) {
    return this._prepareParams().then(() => this.app.orm.ChatBot.create(this._prepareChatBot(botId, botData))
      .then(result => {
        this.chatBots.push(result)
        return result
      }))
  }

  /**
   * Delete a bot in DB
   * @param botId
   * @returns {Promise.<TResult>}
   */
  deleteBot(botId) {
    return this.app.orm.ChatBot.destroy({ where: { name: botId } }).then(result => {
      const index = _.indexOf(this.chatBots, _.find(this.chatBots, { name: botId }))
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
    return this.app.orm.ChatBot.update(this._prepareChatBot(botId, botData), { where: { name: botId } }).then(result => {
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
        const index = _.indexOf(this.chatBots, _.find(this.chatBots, { name: botId }))
        this.chatBots.splice(index, 1, result)
      }
      return result
    })
  }

  reloadBots() {
    return this._prepareParams().then(() => this.app.orm.ChatBot.findAll({
      where: {
        enabled: true
      }
    }).then(results => {
      if (results) {
        const bots = []
        _.forEach(results, (botData) => {
          const data = this._prepareChatBot(botData.name, botData.toJSON())
          bots.push(this.app.orm.ChatBot.update(
            data,
            {
              where: {
                name: botData.name
              }
            }
          ))
        })
        return Promise.all(bots).then(results => {
          return this.app.orm.ChatBot.findAll({
            where: {
              enabled: true
            }
          }).then(results => {
            this.chatBots = results || []
            return results
          })
        })
      }
      return results
    }))
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
            let value = matches[i]
            const type = sentenceData.fields[i - 1]
            if (type.indexOf('number') !== -1) {
              value = parseInt(value)
            }
            fields[type] = value
          }
        }
        results = {
          botId: bot.name,
          bot: bot.toJSON ? bot.toJSON() : bot,
          action: stateData ? stateData.id : null,
          state: stateData,
          responses: stateData && stateData.responses ? stateData.responses[lang] : [],
          response: stateData && stateData.responses ? _.sample(stateData.responses[lang]) : '',
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
              const bot = _.find(this.chatBots, { name: chatBotId })
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
            const publicResult = _.omit(result, ['bot', 'state', 'match'])
            if (userId) {
              this.botCache.set(userId + '_data', result, (err) => {
                if (err) {
                  reject(err)
                }
                else {
                  if (hook) {
                    hook(this.app, publicResult).then(resolve).catch(reject)
                  }
                  else {
                    resolve(publicResult)
                  }
                }
              })
            }
            else {
              if (hook) {
                hook(this.app, publicResult).then(resolve).catch(reject)
              }
              else {
                resolve(publicResult)
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

