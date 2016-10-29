# trailpack-chatbot
:package: Trailpack to create chatbot under your Trails projects

[![Gitter][gitter-image]][gitter-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![NPM version][npm-image]][npm-url]
[![Linux + OSX Build Status][ci-image]][ci-url]
[![Code Climate][codeclimate-image]][codeclimate-url]
[![Follow @trailsjs on Twitter][twitter-image]][twitter-url]


## Intallation
With yo : 

```
npm install -g yo generator-trails
yo trails:trailpack trailpack-chatbot
```

With npm (you will have to create config file manually) :
 
`npm install --save trailpack-chatbot`


## Compatibility

This Trailpack is compatible with Sequelize [trailpack-sequelize](https://github.com/trailsjs/trailpack-sequelize).

## Usage
Load in your trailpack config.

```js
// config/main.js
module.exports = {
  // ...
  packs: [
    require('trailpack-core'),
    // ...
    require('trailpack-cache'),
    require('trailpack-chatbot')
  ]
}
```

## Dependencies 
In order to work you need to install and configure [trailpack-cache](https://github.com/trailsjs/trailpack-cache)

## Config
Setup your bots.

```js
// config/chatbot.js
module.exports = {
  bots: {}, // put you bots definitions here (see example below)
  allowAnonymousUsers: false, // allow to use basic chatbot command (no nested states for unlogged user
  defaultAnswer: (app, data) => { // set a default answer when no bot recognize the sentence
    data.action = 'UNKNOWN'
    return Promise.resolve(data)
  },
  hooks: {} // set some hooks on bot states to add/modify the bot response 
}
```
Default config [here](https://github.com/mylisabox/trailpack-chatbot/blob/master/archetype/config/chatbot.js)

Full example of bot [here](https://github.com/mylisabox/trailpack-chatbot/blob/master/test/dialogs/example.json)

## Contributing
We love contributions! Please check out our [Contributor's Guide](https://github.com/trailsjs/trails/blob/master/.github/CONTRIBUTING.md) for more
information on how our projects are organized and how to get started.

## License
[MIT](https://github.com/mylisabox/trailpack-chatbot/blob/master/LICENSE)

[snyk-image]: https://snyk.io/test/github/mylisabox/trailpack-chatbot/badge.svg
[snyk-url]: https://snyk.io/test/github/mylisabox/trailpack-chatbot/
[npm-image]: https://img.shields.io/npm/v/trailpack-chatbot.svg?style=flat-square
[npm-url]: https://npmjs.org/package/trailpack-chatbot
[ci-image]: https://img.shields.io/travis/mylisabox/trailpack-chatbot.svg?style=flat-square&label=Linux%20/%20OSX
[ci-url]: https://travis-ci.org/mylisabox/trailpack-chatbot
[codeclimate-image]: https://img.shields.io/codeclimate/github/mylisabox/trailpack-chatbot.svg?style=flat-square
[codeclimate-url]: https://codeclimate.com/github/mylisabox/trailpack-chatbot
[gitter-image]: http://img.shields.io/badge/+%20GITTER-JOIN%20CHAT%20%E2%86%92-1DCE73.svg?style=flat-square
[gitter-url]: https://gitter.im/mylisabox/trails
[twitter-image]: https://img.shields.io/twitter/follow/trailsjs.svg?style=social
[twitter-url]: https://twitter.com/trailsjs

