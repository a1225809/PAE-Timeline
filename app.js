var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var lazy = require('lazy');

var routes = require('./routes/index');
var users = require('./routes/users');
var statistics = require('./routes/statistics');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/statistics', statistics);
app.use('/users', users);

// creates a csv-file with just the temporal bounds
app.use('/convert', function(req, res, next) {
	var timesArray = Array();
	new lazy(fs.createReadStream('coins-with-time.json.txt'))
		 .lines
		 .forEach(function(line){
			var js = JSON.parse(line);
			var appendData = js.temporal_bounds.from + ','+js.temporal_bounds.to+',\n';
			fs.appendFile('coins.csv', appendData, function (err) {
					
			});
		 }
	 );
});

// returns a JSON string of temporal bounds for statistics 
app.use('/objects', function(req, res, next) {
	var timesArray = Array();	
	new lazy(fs.createReadStream('coins-with-time.json.txt'))
		 .lines
		 .forEach(function(line){
			var js = JSON.parse(line);
			var image_urls = Array();
			var obj = {from:js.temporal_bounds.from , to:js.temporal_bounds.to,title:js.title,image_urls};
			for(var i = 1; i < js.image_urls.length; i++){
				obj.image_urls.push(js.image_urls[i]);
			}
			timesArray.push(obj);
			}).on('pipe',function() {
				res.end(JSON.stringify(timesArray));
			});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
