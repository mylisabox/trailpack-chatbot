module.exports = [
  {
    method: 'POST',
    path: '/chatbot/interact',
    handler: 'ChatBotController.interact'
  },
  {
    method: 'POST',
    path: '/chatbot/{id}/interact',
    handler: 'ChatBotController.interact'
  },
  {
    method: 'POST',
    path: '/{lang}/chatbot/interact',
    handler: 'ChatBotController.interact'
  },
  {
    method: 'POST',
    path: '/{lang}/chatbot/{id}/interact',
    handler: 'ChatBotController.interact'
  }
]
