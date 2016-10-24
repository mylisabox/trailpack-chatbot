'use strict'

const Controller = require('trails-controller')

/**
 * @module ChatBotController
 * @description Generated Trails.js Controller.
 */
module.exports = class ChatBotController extends Controller {
  interact(req, res) {
    this.app.services.ChatBotService.interact(req.user ? req.user.id : null, req.body.lang || req.params.lang || 'en', req.body.sentence, req.body.id || req.params.id).then(result => {
      this.log.error(result)
    }).catch(err => {
      this.log.error(err)
      res.serverError(err)
    })
  }
}

