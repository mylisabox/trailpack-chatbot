'use strict'

const Trailpack = require('trailpack')

module.exports = class ChatbotTrailpack extends Trailpack {

  /**
   * TODO document method
   */
  validate() {

  }

  /**
   * TODO document method
   */
  configure() {

  }

  /**
   * Initialize bots
   */
  initialize() {
    return this.app.services.ChatBotService.init(this.app.config.chatbots)
  }

  constructor(app) {
    super(app, {
      config: require('./config'),
      api: require('./api'),
      pkg: require('./package')
    })
  }
}

