'use strict'
/* global describe, it */
const assert = require('assert')

describe('ChatBotService', () => {
  it('should exist', () => {
    assert(global.app.api.services['ChatBotService'])
    assert(global.app.services['ChatBotService'])
  })

  const dataExample = require('../../dialogs/example.json')

  it('should compile sentences correctly', done => {
    const compiledSentences = global.app.services.// eslint-disable-line no-underscore-dangle
    ChatBotService._compileSentences(dataExample.tv.freeStates.TV_CHANNEL.sentences)
    assert(compiledSentences)
    assert(compiledSentences.fr)
    assert(compiledSentences.en)
    assert.equal(compiledSentences.fr[0].sentence, 'mets ([a-zA-z]+)')
    assert.equal(compiledSentences.fr[1].sentence, 'mets la ([0-9]+)')
    assert.equal(compiledSentences.en[0].sentence, 'set channel ([0-9]+)')
    assert.equal(compiledSentences.en[1].sentence, 'set ([a-zA-z]+)')
    done()
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

  it('should return the correct command with field', done => {
    global.app.services.ChatBotService.interact(1, 'fr', 'augmente le son de 5').then(result => {
      assert(result)
      assert.equal(result.action, 'TV_SOUND_UP')
      assert(result.fields)
      assert.equal(result.fields.number, '5')
      done()
    }).catch(done)
  })

  it('should return the correct command with field named', done => {
    global.app.services.ChatBotService.interact(1, 'fr', 'baisse le son de 5').then(result => {
      assert(result)
      assert.equal(result.action, 'TV_SOUND_DOWN')
      assert(result.fields)
      assert.equal(result.fields.volume, '5')
      done()
    }).catch(done)
  })


  it('should return the correct nested command', done => {
    global.app.services.ChatBotService.interact(1, 'fr', 'oui').then(result => {
      assert(result)
      assert.equal(result.action, 'TV_SOUND_DOWN_AGAIN')
      assert(result.fields)
      done()
    }).catch(done)
  })
})
