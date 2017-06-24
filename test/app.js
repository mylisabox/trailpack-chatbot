'use strict'

const _ = require('lodash')
const smokesignals = require('smokesignals')

module.exports = _.defaultsDeep({
  pkg: {
    name: require('../package').name + '-test'
  },
  api: {
    models: {},
    controllers: {},
    services: {}
  },
  config: {
    caches: {
      stores: [{
        name: 'chatbot',
        type: 'memory',
        ttl: 0
      }]
    },
    chatbot: {
      bots: require('./dialogs/example.json'),
      allowAnonymousUsers: true,
      hooks: {
        'TV_CHANNEL': (app, data) => {
          data.myAddition = 'ok'
          return Promise.resolve(data)
        }
      },
      params: {
        custom: '(custom|match)',
        customArray: ['custom', 'match'],
        customMethod: app => {
          return Promise.resolve(['custom', 'match'])
        }
      }
    },
    database: {
      stores: {
        sqlitedev: {
          database: 'dev',
          storage: './.tmp/dev.sqlite',
          host: '127.0.0.1',
          dialect: 'sqlite'
        }
      },
      models: {
        defaultStore: 'sqlitedev',
        migrate: 'drop'
      }
    },
    main: {
      packs: [
        require('trailpack-sequelize'),
        require('trailpack-cache'),
        require('trailpack-express'),
        require('trailpack-router'),
        require('../')
      ]
    },
    web: {
      express: require('express')
    }
  }
}, smokesignals.FailsafeConfig)


