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

  it('should return result for given sentence', (done) => {
    request
      .post('/chatbot/interact')
      .send({
        lang: 'fr',
        sentence: 'augmente le son de 8'
      })
      .expect(200)
      .end((err, res) => {
        assert(res.body)
        assert.equal(res.body.action, 'TV_SOUND_UP')
        assert.equal(res.body.fields.number, 8)
        done(err)
      })
  })

  it('should return result for given sentence', (done) => {
    request
      .post('/fr/chatbot/interact')
      .send({
        sentence: 'augmente le son de 8'
      })
      .expect(200)
      .end((err, res) => {
        assert(res.body)
        assert.equal(res.body.action, 'TV_SOUND_UP')
        assert.equal(res.body.fields.number, 8)
        done(err)
      })
  })

  it('should return result for given sentence by asking the bot directly', (done) => {
    request
      .post('/fr/chatbot/tv/interact')
      .send({
        sentence: 'augmente le son de 8'
      })
      .expect(200)
      .end((err, res) => {
        assert(res.body)
        assert.equal(res.body.action, 'TV_SOUND_UP')
        assert.equal(res.body.fields.number, 8)
        done(err)
      })
  })

  it('should return no result with unknow sentence', (done) => {
    request
      .post('/fr/chatbot/interact')
      .send({
        sentence: 'aucune idée'
      })
      .expect(200)
      .end((err, res) => {
        assert(res.body)
        assert.equal(res.body.action, 'UNKNOWN')
        done(err)
      })
  })

  it('should return the context', (done) => {
    request
      .post('/fr/chatbot/interact')
      .send({
        sentence: 'aucune idée',
        context: {
          test: 'toto'
        }
      })
      .expect(200)
      .end((err, res) => {
        assert(res.body)
        assert.equal(res.body.action, 'UNKNOWN')
        assert.equal(res.body.context.test, 'toto')
        done(err)
      })
  })
})
