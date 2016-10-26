'use strict'

const Trailpack = require('trailpack')
const routes = require('./lib/routes')
const _ = require('lodash')

module.exports = class ChatbotTrailpack extends Trailpack {

  /**
   * Check if trailpack-cache is installed
   */
  validate() {
    if (!this.app.packs.cache) {
      return Promise.reject(
        new Error('trailpack-cache need to be installed in order to make chatbot working')
      )
    }

    if (!this.app.config.chatbot) {
      return Promise.reject(
        new Error('config.chatbot doesn\'t exist, please correct this')
      )
    }
  }

  /**
   * Compile route with prefix if needed
   */
  configure() {
    const prefix = _.get(this.app.config, 'chatbot.prefix') || _.get(this.app.config, 'footprints.prefix')
    const routerUtil = this.app.packs.router.util
    if (prefix) {
      routes.forEach(route => {
        route.path = prefix + route.path
      })
    }
    this.app.config.routes = routerUtil.mergeRoutes(routes, this.app.config.routes)

  }

  /**
   * Initialize bots
   */
  initialize() {
    return this.app.services.ChatBotService.init(this.app.config.chatbot.bots)
  }

  constructor(app) {
    super(app, {
      config: require('./config'),
      api: require('./api'),
      pkg: require('./package')
    })
  }
}

