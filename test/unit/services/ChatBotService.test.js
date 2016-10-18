'use strict'
/* global describe, it */
const assert = require('assert')

describe('ChatBotService', () => {
  it('should exist', () => {
    assert(global.app.api.services['ChatBotService'])
    assert(global.app.services['ChatBotService'])
  })

  it('should return the correct order', done => {
    global.app.services.ChatBotService.interact(1, 'tv', 'fr', 'coupe le son de la tv').then(result => {
      assert(result)
      assert.equal(result.action, 'TV_MUTE')
    }).catch(done)
  })
})
