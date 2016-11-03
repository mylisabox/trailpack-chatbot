'use strict'

/**
 * ChatBots Configuration
 * (app.config.chatbot)
 *
 * Configure the Chat Bots
 */
module.exports = {
  /**
   * Prefix for Chatbot routes, use the one in trailpack-footprints if installed and not override here
   */
  //prefix: '/',
  /**
   * Bots definitions example
   * for more
   * @see https://github.com/mylisabox/trailpack-chatbot/blob/master/test/dialogs/example.json
   */
  bots: {
    'me': {
      'name': 'Presentation',
      'freeStates': {
        'ME_HELLO': {
          'name': 'Hello',
          'sentences': {
            'fr': [
              '(?:bonjour|hello|salut|bonsoir)'
            ],
            'en': [
              '(?:hello|morning|hi)'
            ]
          },
          'responses': {
            'fr': [
              'Salut',
              'Bonjour'
            ],
            'en': [
              'Hello',
              'hi'
            ]
          }
        },
        'ME_FEEL': {
          'name': 'How do you feel',
          'sentences': {
            'fr': [
              'Comment tu vas ?'
            ],
            'en': [
              'How are you ?'
            ]
          },
          'responses': {
            'fr': [
              'Très bien et toi ?'
            ],
            'en': [
              'Fine and you ?'
            ]
          }
        },
        'ME_THANKS': {
          'name': 'Thanks',
          'sentences': {
            'fr': [
              '(?:merci)'
            ],
            'en': [
              '(?:thanks|thank you)'
            ]
          },
          'responses': {
            'fr': [
              'Pas de problème',
              'De rien',
              'Aucun problème'
            ],
            'en': [
              'No problem',
              'You are welcome',
              'My pleasure'
            ]
          }
        }
      },
      'nestedStates': {
        'ME_FEEL_OK_ANSWER': {
          'name': 'Encore',
          'responses': {
            'fr': [
              'Ravi de l\'entendre'
            ],
            'en': [
              'Glad to hear it'
            ]
          }
        }
      },
      links: [
        {
          'from': 'ME_FEEL',
          'to': 'ME_FEEL_OK_ANSWER',
          'sentences': {
            'fr': [
              'ca va bien'
            ],
            'en': [
              'I am ok'
            ]
          }
        }
      ]
    }
  },
  /**
   * Allow bot to answer without a connected user
   * This will answer very basic sentence as there no state for the user (this mean nested states are not handled)
   */
  allowAnonymousUsers: false,
  /**
   * When bot
   * @param app Trails application
   * @param data User sentence, lang, botId, userId
   * @returns Promise
   */
  defaultAnswer: (app, data) => {
    data.action = 'UNKNOWN'
    return Promise.resolve(data)
  },
  /**
   * Hooks can be used to influance the answer
   * The return data will be the one returned to the user
   */
  hooks: {
    'ME_HELLO': (app, data) => {
      data.myAddition = 'ok'
      return Promise.resolve(data)
    }
  }
}
