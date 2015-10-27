var express = require('express'), //express module
	app = express(),
	path = require('path'), //path module
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	config = require('./config/config.js'),
	ConnectMongo = require('connect-mongo')(session),
	mongoose = require('mongoose').connect(config.dbURL),
	passport = require('passport'),
	FacebookStrategy = require('passport-facebook').Strategy,
	rooms = []

app.set('views',path.join(__dirname,'views'));//dirname - current directory
app.engine('html',require('hogan-express'));
app.set('view engine','html');
app.use(cookieParser());

var env = process.env.NODE_ENV || 'development';
if (env === 'development'){
	//dev specific settings
	app.use(session({secret:config.sessionSecret,saveUninitialized:true, resave:true}))
}else{
	//production specific settings
	app.use(session({
		secret:config.sessionSecret,
		store:new ConnectMongo({
			//url:config.dbURL,
			mongoose_connection:mongoose.connections[0],
			stringify:true //all session values are converted into strings and 
			//stored on mongolab
		})
	}))
}

app.use(passport.initialize());
app.use(passport.session());

require('./auth/passportAuth.js')(passport, FacebookStrategy, config, mongoose);

//use this line if you are not using 1.2.0
//app.use(session({secret:'catscanfly'}));

app.use(session({secret:'catscanfly',saveUninitialized:true, resave:true}));

//root folder - public //no need to write public
app.use(express.static(path.join(__dirname,'public')));

// app.route('/').get(function(req,res,next){
// 	//res.send('<h1>Deurali Hello World</h1>');
// 	res.render('index',{t:'Hi user!! Welcome to chatCAT'}); //calls index.htm file
// })

require('./routes/routes.js')(express,app,passport,config,rooms);

app.set('port',process.env.PORT || 3000);
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

require('./socket/socket.js')(io,rooms);

server.listen(app.get('port'),function(){
	console.log('ChatCAT on port : '+app.get('port'));
})

// app.listen(3000,function(){
// 	console.log('chatCAT working on port 3000');
// 	console.log('Mode : '+env);
// })
