module.exports = function(passport, FacebookStrategy, config, mongoose){

	var chatUser = new mongoose.Schema({
		profileID:String,
		fullname:String,
		profilePic:String
	})

	//convert schema into user model
	var userModel = mongoose.model('chatUser',chatUser);

	//session is stored 
	passport.serializeUser(function(user,done){
		done(null,user.id);
	});

	//find by userid which is already persisted as session variable
	passport.deserializeUser(function(id,done){
		userModel.findById(id,function(err,user){
			done(err,user);
		})
	})

	passport.use(new FacebookStrategy({
		clientID: config.fb.appID,
		clientSecret: config.fb.appSecret,
		callbackURL: config.fb.callbackURL,
		profileFields: ['id','displayName','photos']
	}, function(accessToken, refreshToken, profile, done){
		//check if the user exists in out MongoDB DB
		//if not, create one and return the profile
		//if the user exists, simply return the profile
		userModel.findOne({'profileID':profile.id},function(err, result){
			if(result){
				done(null,result);
			}else{
				//create a new user in our Mongolab account
				var newChatUser = new userModel({
					profileID:profile.id,
					fullname:profile.displayName,

					//if profile picture is not found, it defaults to nothing
					profilePic:profile.photos[0].value || ''
				});

				newChatUser.save(function(err){
					done(null,newChatUser);
				})
			}
		})
	}))

}