var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var q = require('q');

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);
    console.log("getting: "+uri)

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

exports.get_book = function(){
		var defered = q.defer()
		request('https://www.packtpub.com/packt/offers/free-learning', function(error, response, html){
			if(!error && response.statusCode == 200){
				//console.log(html)
				var data = {}
				var $ = cheerio.load(html)
				data['title'] = $('h2')['0']['children'][0]['data'].trim();
				data['image'] = "https:"+$('#deal-of-the-day > div > div > div.dotd-main-book-image.float-left > a > img')['0']['attribs']['data-original']
				data['link'] = "https://www.packtpub.com"+$('#deal-of-the-day > div > div > div.dotd-main-book-summary.float-left > div.dotd-main-book-form.cf > div.float-left.free-ebook > a')['0']['attribs']['href']
				download(data['image'], 'todays-book.jpg', function(){
					console.log('Book image downloaded');
					defered.resolve(data);
				})
			}else{
				defered.reject(response);
			}
		});
		return defered.promise
	}
