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
        require('../')
      ]
    },
    caches: {
      stores: [
        // Example for memory store
        {
          name: 'memoryStore',
          type: 'memory',
          max: 100,
          ttl: 60
        }
      ],
      defaults: ['memoryStore']
    }
  }
}, smokesignals.FailsafeConfig)


