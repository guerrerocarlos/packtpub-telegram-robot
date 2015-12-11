var get_book = require('./get_book.js')

var mongoose = require('mongoose');
var util = require('util')
var Q = require('q');
var emoji = require('node-emoji');
var dateutil = require('dateutil')

var ObjectId = mongoose.Schema.Types.ObjectId;
mongoose.connect('mongodb://localhost:27017/packtpub');

var People = mongoose.model('people', { first_name: String , last_name: String, chatId: Number, date: { type: Date, default: Date.now  }, username: String, status: String, objective_trap: Object, pending_responses: Array});
var Message = mongoose.model('message', { msg: Object, message_id: String, date: { type: Date, default: Date.now  }, user: ObjectId });

get_book.get_book().then(function(data){
	console.log('finished!')
	console.log(data)
	//TODO: Send book data to all the people
});
