var TelegramBot = require('node-telegram-bot-api');
var mongoose = require('mongoose');
var util = require('util')
var Q = require('q');
var emoji = require('node-emoji');
var dateutil = require('dateutil')
var get_book = require('./get_book.js')

var ObjectId = mongoose.Schema.Types.ObjectId;
mongoose.connect('mongodb://localhost:27017/packtbot');

var People = mongoose.model('people', { first_name: String , last_name: String, chatId: Number, date: { type: Date, default: Date.now  }, username: String, status: String, objective_trap: Object, pending_responses: Array});
var Message = mongoose.model('message', { msg: Object, message_id: String, date: { type: Date, default: Date.now  }, user: ObjectId });

function Robot(bot){
    this.bot = bot;
    var self = this;

	self.sendTodays = function(user, msg, callback){
		console.log("sendTodays to "+user.first_name+" "+user.chatId);
		user.status = "subscribed" 
		user.save()
		get_book.get_book().then(function(data){
			console.log(data)
			self.bot.sendPhoto(user.chatId, "todays-book.jpg", {caption: data['title']});
			setTimeout(function(){
				self.bot.sendMessage(user.chatId, data['link'])
			}
			, 3000)
		});
	}

}


Robot.prototype.daily = function(user, response, callback){
	var self = this;
	console.log("daily...");
	   People.find({"status": "subscribed"}).exec(function(err, people){
		people.forEach(function(each){
			console.log(self.sendTodays(each));
		});
	   });
}


Robot.prototype.listen = function(bot){
        var self = this;
	function save_msg_in_db(msg, user){
	    console.log("user_id:"+user.id)
	    var message = new Message({msg: msg, user: user})
	    message.save()
	}

	function check_if_subscriber(msg){
	    console.log("check_if_user_in_db...")
	    var deferred = Q.defer();
	    People.find({chatId: msg.chat.id}).exec(function(err, response){
		if(err) console.log(err)
		console.log("Found persons: "+response.length)
		if(response.length === 0){
		    var response = new People({first_name: msg.from.first_name, last_name: msg.from.last_name, chatId: msg.chat.id,username: msg.chat.username, status: "subscribed"})
		    response.save();
		    save_msg_in_db(msg, response);
		    console.log("reject")
		    deferred.reject(response);
		}else{
		    save_msg_in_db(msg, response[0]);
		    console.log("resolve")
		    deferred.resolve(response[0]);
		}
	    })
	    return deferred.promise
	}

	function send_responses(user){
	    console.log("send_responses...")
	    console.log(user)
	    console.log(user.pending_responses)
	    time = 1000
	    if(user.pending_responses.length == 0){
		user.pending_responses = [{key: user.status}]
	    }
	    self.bot.sendChatAction(user.chatId, "typing")
	    user.pending_responses.forEach(function(each){
		console.log("IN :"+time)
		setTimeout(function(){
		    if(responses[each.key].keyboard){
			bot.sendMessage(user.chatId, util.format(responses[each.key].text, each.data), {reply_markup: JSON.stringify({"keyboard": responses[each.key].keyboard, "one_time_keyboard": true})})
		    }else{
			if(each.data){
			   console.log("DATA: "+each.data)
			   var message = each.data
			   message.unshift(responses[each.key].text)
			   self.bot.sendMessage(user.chatId, util.format.apply(util,message));
			}else{
			   self.bot.sendMessage(user.chatId, responses[each.key].text );
			}
		    }
		    if(responses[each.key].send_position){
			self.bot.sendLocation(user.chatId, each.gps_data_latitude, each.gps_data_longitude)
		    }
		}, time)
		time = time + 1000
	    });
	    user.pending_responses = []
	    user.save()
	};


	function interact(user){
	    console.log("user_continue_chatting...")
	    Message.findOne({user:user}, {}, { sort: { 'date' : -1  }  }).exec(function(err, message){
		if(err){
			console.log("No previous Messages!")
		}else{
			console.log(message)
			if(message.msg.text === "/start"){
			    console.log(Object.keys(responses))
			    user.status = Object.keys(responses)[0]
			    user.save()
			}
			console.log(">>>>> status: "+user.status)
			console.log(">>>>> status: "+responses[user.status].answers)
			console.log(">>>>> status: "+Object.keys(responses[user.status].answers).indexOf(message.msg.text))
			if(message.msg.text)
				message.msg.text = message.msg.text.replace("@packtbot", "");
			console.log(user.status)
			if(responses[user.status].answers && Object.keys(responses[user.status].answers).indexOf(message.msg.text) >= 0){
			    user.status = responses[user.status].answers[message.msg.text]
			    user.save()
			    console.log(">>>> CAMBIANDO A: "+user.status)
			};
			if(responses[user.status].process){
			    console.log("Tiene process..")
			    console.log(message)
			    responses[user.status].process(user, message, function(user){
				send_responses(user);
			    })
			}else{
			    console.log("NO Tiene process..")
			    send_responses(user);
			}
		};
	    });
	}

	    responses = {
		"not-subscribed": {text: "Would you like to be notified of the new packtpub ebook available every day? \nPlease answer: \n\n/yes \n\n/no", 
			answers: {
				"/yes": "subscribed",
				"/no": "unsubscribed"
			}
			},
		"subscribed": {text: "You are now currently subscribed to the daily free ebook notifications... \n\noptions:\n/unsubscribe stop receiving the daily free ebook.\n/today today's free ebook.",
			answers: {
				"/today": "send-todays",
				"/unsubscribe": "unsubscribed"
			}
			},
		"unsubscribed": {text: "You are currently NOT subscribed to the daily free ebook notifications... \n\noptions:\n/subscribe\n/today", 
			answers: {
				"/today": "send-todays",
				"/subscribe": "subscribed"
			}
			},
		"send-todays": {text: "Today free ebook:", process: this.sendTodays,
			answers: {
				"/today": "send-todays",
				"/subscribe": "subscribed",
				"/unsubscribe": "unsubscribed"
			}
			}
		}

	    this.bot.on('message', function(msg){
		console.log(msg)
		check_if_subscriber(msg).then(interact, interact)
	    })
	    console.log("Bot listening for messages...")
	}

module.exports = Robot 

