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
    chatbot: {
      bots: require('./dialogs/example.json'),
      allowAnonymousUsers: true,
      hooks: {
        'TV_CHANNEL': (app, data) => {
          data.myAddition = 'ok'
          return Promise.resolve(data)
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
        smokesignals.Trailpack,
        require('trailpack-core'),
        require('trailpack-cache'),
        require('trailpack-sequelize'),
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


