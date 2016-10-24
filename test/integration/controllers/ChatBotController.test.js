'use strict'
/* global describe, it */
const assert = require('assert')
const supertest = require('supertest')

describe('ChatBotController', () => {
  let request
  before(() => {
    request = supertest('http://localhost:3000')
  })

  it('should exist', () => {
    assert(global.app.api.controllers.ChatBotController)
    assert(global.app.controllers.ChatBotController)
  })

  it.skip('should return result for given sentence', (done) => {
    request
      .post('/chatbot/interact')
      .send({
        lang: 'fr',
        sentence: 'augmente le son de 8'
      })
      .expect(200)
      .end((err, res) => {
        done(err)
      })
  })
})
