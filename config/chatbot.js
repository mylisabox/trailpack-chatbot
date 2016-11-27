'use strict'

/**
 * ChatBots Configuration
 * (app.config.chatbot)
 *
 * Configure the Chat Bots
 */
module.exports = {
  /**
   * Bots definitions example
   * for more
   * @see https://github.com/mylisabox/trailpack-chatbot/blob/master/test/dialogs/example.json
   */
  bots: {},
  /**
   * Default language
   */
  defaultLang: 'en',
  /**
   * Allow bot to answer without a connected user
   * This will answer very basic sentence as there no state for the user (this mean nested states are not handled)
   */
  allowAnonymousUsers: false,
  /**
   * When bot doesn't understand the sentence, you can return a default answer based on data
   * @param app Trails application
   * @param data User sentence, lang, botId, userId
   * @returns Promise
   */
  defaultAnswer: (app, data) => {
    data.action = 'UNKNOWN'
    return Promise.resolve(data)
  },
  /**
   * Hooks can be used to influance the answer
   * The return data will be the one returned to the user
   */
  hooks: {},
  /**
   * Params that can be used to parse the answer
   * myKey : rexExp or Array<String>
   */
  params: {}
}
