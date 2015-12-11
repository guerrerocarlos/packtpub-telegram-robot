var tidbot = require('./packtbot.js')
var TelegramBot = require('node-telegram-bot-api');

var token = "124723913:AAFB9TJUA1zu_R3HHX-Z8t5r--hxYtPgllE"
var bot = new TelegramBot(token, {polling: true});

var telBot = new tidbot(bot)
telBot.listen();

