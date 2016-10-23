'use strict'
/* global describe, it */
const assert = require('assert')

describe('ChatBotService', () => {
  it('should exist', () => {
    assert(global.app.api.services['ChatBotService'])
    assert(global.app.services['ChatBotService'])
  })

  it('should return the correct command with chatbot id', done => {
    global.app.services.ChatBotService.interact(1, 'fr', 'augmente le son', 'tv').then(result => {
      assert(result)
      assert.equal(result.action, 'TV_SOUND_UP')
      done()
    }).catch(done)
  })

  it('should return the correct command without chatbot id', done => {
    global.app.services.ChatBotService.interact(1, 'fr', 'augmente le son').then(result => {
      assert(result)
      assert.equal(result.action, 'TV_SOUND_UP')
      done()
    }).catch(done)
  })
  it('should return the correct command with params', done => {
    global.app.services.ChatBotService.interact(1, 'fr', 'augmente le son de 5').then(result => {
      assert(result)
      assert.equal(result.action, 'TV_SOUND_UP')
      done()
    }).catch(done)
  })
})
