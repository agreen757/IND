//putting the YT CMS Audit tool on the web

var express = require('express');
var util = require('util');
var fs = require('graceful-fs');
var async = require('async');
var htmlfile = "index.html";
var httpSync = require('httpsync')
var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;
var cons = require('consolidate');
var demand = require('request');
var mongoclient = new MongoClient(new Server('localhost', 27017, {'native_parser' : true}));
var db = mongoclient.db('indmusic');
var googleapis = require('googleapis');
var csv = require('ya-csv')
var OAuth2Client = googleapis.OAuth2Client;
var oauth2Client =
    new OAuth2Client('468772544188.apps.googleusercontent.com', 'LufQkK0YPcHbKetle54m8p2I','http://ec2-54-84-17-96.compute-1.amazonaws.com:8070/auth/callback');
var nodemailer = require('nodemailer');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var GOOGLE_CLIENT_ID = "468772544188.apps.googleusercontent.com";
var GOOGLE_CLIENT_SECRET = "LufQkK0YPcHbKetle54m8p2I";
var counter;
var tok;
var users = [];
var TokenProvider = require('refresh-token');

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://ec2-54-84-17-96.compute-1.amazonaws.com:8070/auth/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function (){ 
      
      // Changing this to return the accessToken instead of the profile information
	//console.log(profile.displayName);
	users.push({'name':profile.displayName});
	tok = accessToken;
      return done(null, [{token:accessToken,rToken:refreshToken,'profile':profile}]);
    });
  }
));

var app = express();
app.engine('html', cons.swig);
app.set('view engine', 'html');
app.set('views', __dirname+"/views");
//the session and cookie parser functions below are needed in order to implement persistent authentication
app.use(express.cookieParser());
app.use(express.session({secret: '1234567890INDMUSIC'}));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(__dirname, 'public'));

var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
var clients = {};
//io.sockets.on('connection', function(socket){

app.get('/', function(request, response){
    response.render('login');
});

app.get('/cms', ensureAuthenticated, function(request, response){
    io.sockets.on('connection',function(socket){
	//console.log("trying to store "+socket.id);
	request.sessionStore.Adrian = socket;
	console.log("whats in the session "+request.sessionStore.Adrian.id)
    //console.log(request.session.passport.user.emails[0].value)
    demand.get('https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true&access_token='+request._passport.session.user[0].token, function(error, response, body){
	var channel = JSON.parse(body);
	//console.log(channel);
        /*
	db.collection(request.session.chanId).update({username:request.session.passport.user.emails[0].value},{username:request.session.passport.user.emails[0].value},{upsert:true},function(err,objects){
            if(err){
		console.log(err)
            }}); */
	})
    });
    
//});
response.render('cms', {'token':request._passport.session.user[0].token});
});

app.get('/auth',
    passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/yt-analytics.readonly', 'https://www.googleapis.com/auth/yt-analytics-monetary.readonly', 'https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtubepartner', 'https://www.googleapis.com/auth/analytics', 'https://www.googleapis.com/auth/analytics.edit', 'https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/plus.me', 'https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email'],
				     accessType:'offline', approvalPrompt:'force'})
);


app.get('/auth/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    function(req, res) {
	res.redirect('/cms');
    }
	
);

app.post('/upload', function(req, res){
    //io.sockets.on('anything',function(socket){
    //console.log(req.sessionStore);
    //var socket = req.sessionStore.Adrian;
    var uploadRead = csv.createCsvFileReader(req.files.csv.path, {columnsFromHeader:false,'separator': ','});
    var foo = [];
    
    uploadRead.addListener('data', function(data){
	//console.log(data['Asset ID']);

	//push an objects to foo
	//foo.push({'videoId':data['Video ID']},{'assetId': data['Asset ID']})
	//foo.push({'videoId': data['Video ID'], 'assetId': data['Asset ID']});
	foo.push(data[0]);
	console.log(data[0]);
	//console.log(data['Asset ID']);
	//return(foo)
	//console.log(foo)
    })
    
    uploadRead.addListener('end', function(){
	/*for(i=0;i<foo.length;i++){
	    io.sockets.emit('query', {assetId:foo[i]});
	    if(i = foo.length){
		//res.redirect('/cms');
	    }
	}*/
	async.series([
	    function(callback){
		var k = 0;
		res.redirect('/cms');
		var a = setTimeout(function(){
		    callback();
		},k+=5000)
	    },
	    function(callback){
		pre(callback);
	    },
	    function(callback){
		emiter(foo,req);
		callback();
	    }
	])
	//res.redirect('/cms');
	//emiter(foo);
    })
//})
})

io.sockets.on('connection', function(socket){ 
    clients.id = socket.id;
})

function pre(callback){
    fs.readFile('counter.txt','utf8', function(err,data){
        counter = parseInt(data);
        console.log(counter);
        callback();
    })
}

function emiter(foo,req){
    var socket = req.sessionStore.Adrian
    console.log("in the emiter");
    //io.sockets.on('anything', function(socket){
    //console.log("this is "+socket.id);
    //clients.id = socket.id;

    //console.log(req._passport.session.user);
    fs.appendFileSync(clients.id+'.csv',"Original,Asset ID,ISRC,Title,Custom ID,UPC,Artist,Album,Genre,Ownership,Ratio,Match Policy,Refrence File"+"\n");
    var k = 0;
    var assets = foo.slice(counter,foo.length);
    assets.map(function(element,index){
	var a = setTimeout(function(){
	    counter++;
	    fs.writeFileSync('counter.txt', counter);
	    //console.log(index);
	    demand.get("https://www.googleapis.com/youtube/partner/v1/assetSearch?onBehalfOfContentOwner=indmusic&ownershipRestriction=none&q="+element+"&access_token="+tok, function(error,response,body){
	    var isrc = []; 
	    var eid = [];
	    var original = element;
	    //var listing = [{"element":element,"assetId":[],"isrc":[],"refStatus":[]}];
	    if(error){
		console.log(error);
		process.exit(1);
	    }
		try{
		    var parse = JSON.parse(body);
		}
		catch(err){
		    var c = 0;
		    var b = setTimeout(function(){
			demand.get("https://www.googleapis.com/youtube/partner/v1/assetSearch?onBehalfOfContentOwner=indmusic&ownershipRestriction=none&q="+element+"&access_token="+tok, function(error,response,body){
			   var parse = JSON.parse(body); 
			})
		    },c+=1500)
		}
	    
		if(parse.error != null){
		    if(parse.error.code === 500){
			console.log("null shit");
			fs.appendFileSync('rerun.csv',element+"\n");
		    }
		    else if(parse.error.code === 401){
			worker(req);
		    }
		    else{
			console.log("some other shit");
                        var smtpTransport = nodemailer.createTransport("SMTP",{
                            service: "Gmail",
                            auth: {
                                user: "adrian@indmusicnetwork.com",
                                pass: "ImWithJessica"
                            }
                        });
			var mailOptions = {
                            from: "Jeeves <reports@indmusicnetwork.com>", // sender address 
                            to: "Adrian Green <adrian@indmusicnetwork.com>", // list of receivers                                                                                  
                            subject: "SNAFU", // Subject line
                            //text: "Hello world ✔", // plaintext body
                            html: "<b>"+parse.error.message+"</b>" // html body
                        }
			smtpTransport.sendMail(mailOptions, function(error, response){
                            if(error){
                                console.log(error);
                            }
                            else{
                                console.log("Message sent: " + response.message);
                                smtpTransport.close();
                                process.exit(1);
                            }
                        });
		    }
		}
        else if(parse.items == null){
            console.log(parse);
            io.sockets.socket(socket.id).emit('nothing',{info:element});
            fs.appendFileSync(socket.id+'.csv', element+","+"Item not in CMS"+"\n");
        }
		else if(parse.items != null){
		    parse.items.map(function(element){
			if(element.type != "art_track_video"){
			    //console.log(parse.items[i].id);
			    var id = element.id;
			    //var isrc = parse.items[i].isrc;
			    //listing.push({"element":element,"assetId":[parse.items[i].id],"isrc":[parse.items[i].isrc]});
			    //listing[0].assetId.push(element.id);
			    //listing[0].isrc.push(element.isrc);
			    var type = element.type;
			    //fs.appendFileSync('shanacie.csv', parse.items[i].id+"\n");
			    demand.get("https://www.googleapis.com/youtube/partner/v1/assets/"+id+"?fetchMatchPolicy=mine&fetchMetadata=effective&fetchOwnership=effective&fetchOwnershipConflicts=true&onBehalfOfContentOwner=indmusic&access_token="+tok, function(error,response,body){
				if(error){
				    console.log(error);
				    process.exit(1);
				}
	
				var listing = [{"element":element,"refStatus":[],"matchPolicy":[],"customID":[],"upc":[],"artist":[{"name":[]}],"genre":[],"title":[{"name":[]}],"album":[],"ratio":[],"owner":[],"ownerType":[],"ownerFin":[{"owner":[]}],"ratioFin":[{"ratio":[]}],"conflicts":[],"territories":[{"terr":[]}]}];

				//listing[0].assetId.push(element.id);
				//listing[0].isrc.push(element.isrc);

				var parse2 = JSON.parse(body);
				var id2 = parse2.id;
				var customID;
				var upc;
				var artist;
				var genre;
				var title; //track name
				var album;

				if(!parse2.metadata){
				    customID = "none";
				    listing[0].customID.push("none");
				    upc = "none";
				    listing[0].upc.push("none");
				    artist = "none";
				    listing[0].artist.push("none");
				    genre = "none";
				    listing[0].genre.push("none");
				    title = "none";
				    listing[0].title.push("none");
				    album = "none";
				    listing[0].album.push("none");
                    io.sockets.emit('progress')
				}
				else{
				    if(!parse2.metadata.customID){
					customID = "none"
					listing[0].customID.push("none");
				    }
				    else{
					customID = parse2.metadata.customId;
					listing[0].customId.push(parse2.metadata.customId);
				    }
				    if(!parse2.metadata.upc){
					upc = "none"
					listing[0].upc.push("none");
				    }
				    else{
					upc = parse2.metadata.upc;
					listing[0].upc.push(parse2.metadata.upc);
				    }
				    if(!parse2.metadata.artist){
					artist = "none";
					listing[0].artist[0].name.push("none");
				    }
				    else{
					artist = parse2.metadata.artist;
					listing[0].artist[0].name.push(parse2.metadata.artist);
				    }
				    if(!parse2.metadata.genre){
					genre = "none";
					listing[0].genre.push("none")
				    }
				    else{
					genre = parse2.metadata.genre;
					listing[0].genre.push(parse2.metadata.genre);
				    }
				    if(!parse2.metadata.title){
					title = "none";
					listing[0].title[0].name.push("none");
				    }
				    else{
					title = parse2.metadata.title;
					listing[0].title[0].name.push(parse2.metadata.title);
				    }
				    if(!parse2.metadata.album){
					album = "none";
					listing[0].album.push("none");
				    }
				    else{
					album = parse2.metadata.album;
					listing[0].album.push(parse2.metadata.album);
				    }

				    //ownership section
				    var ratio;
				    var owner;
				    var ownerType;
				    var ownerFin;
				    var ratioFin;
				    if(!parse2.ownership.general){
					ratio = "none";
					listing[0].ratioFin.push("none")
					owner = "no ownership info";
					listing[0].ownerFin.push("no ownership info")
					ownerType = "no policy listed"
				    }
				    else{
					owner = [];
					ratio = [];
					ratioFin = [];
					ownerType = [];
					ownerFin = [];
					for(i in parse2.ownership.general){
					    owner.push(parse2.ownership.general[i].owner);
					    ratio.push(parse2.ownership.general[i].ratio);
					    ownerType.push(parse2.ownership.general[i].type);
					    ownerFin.push(owner+"-"+ownerType);
					    listing[0].ownerFin[0].owner.push(owner+"-"+ownerType);
					    ratioFin.push(owner+"-"+ratio);
					    listing[0].ratioFin[0].ratio.push(owner+"-"+ratio);
					}
				    }
				    
				}
				var conflicts;
				var territories = [];
				if(!parse2.ownershipConflicts){
				    conflicts = "none";
				    listing[0].conflicts.push("none");
				}
				else{
				    var conflicts = "TRUE";
				    listing[0].conflicts.push("TRUE");
				    for(i in parse2.ownershipConflicts.general){
					listing[0].territories[0].terr.push(parse2.ownershipConflicts.general[i].territory);
					territories.push(parse2.ownershipConflicts.general[i].territory);
				    }
				}
				var matchPolicy;
				if(!parse2.matchPolicy){
				    matchPolicy = "unknown"
				    listing[0].matchPolicy.push(matchPolicy)
				}
				else{
				    matchPolicy = [];
				    for(i in parse2.matchPolicy.rules){
					listing[0].matchPolicy.push([parse2.matchPolicy.rules[i].action])
					matchPolicy.push(parse2.matchPolicy.rules[i].action);
				    }
				}
				
				//console.log(element+" "+id2+" "+isrc+" "+customID+" "+upc+" "+artist+" "+genre+" "+ratioFin+" "+ownerFin+" "+matchPolicy);
				demand.get("https://www.googleapis.com/youtube/partner/v1/references?assetId="+id+"&onBehalfOfContentOwner=indmusic&access_token="+tok, function(error,response,body){
				    var parse3 = JSON.parse(body);
				    var refStatus;
				    if(!parse3.items){
					refStatus = "no status";
					listing[0].refStatus.push("no status")
					console.log(listing);
				    }
				    else{
					/*parse3.items.map(function(element){
					    if(element.status === "active"){
						refStatus = "TRUE";
						listing[0].refStatus.push(refStatus);
						//console.log(listing);
					    }
					    else{
						refStatus = "FALSE";
						listing[0].refStatus.push(refStatus)
					    }
					    
					})*/
					loop1:
					for(i=0;i<parse3.items.length;i++){
					    if(parse3.items[i].status === "active"){
						listing[0].refStatus.push("TRUE");
						refStatus = "TRUE";
						break loop1;
					    }
					    else if(i == parse3.items.length){
						console.log("no active");
						listing[0].refStatus.push("FALSE")
					    }
					}
				    }
				    
				    var rfin;
                    var ofin;
                    var territories;
				    var afin;
				    var tfin;
				    if(listing[0].title[0].name === null){
					   tfin = "none"
				    }
				    else{
					   tfin = JSON.stringify(listing[0].title[0].name.join("&"));
				    }
				    if(listing[0].artist[0].artist === null){
					   afin = "none"
				    }
				    else{
					   afin = JSON.stringify(listing[0].artist[0].name.join("&"));
				    }
                                    if(listing[0].ratioFin.ratio === null){
                                        rfin = "none";
                                    }
                                    else{
                                        rfin = JSON.stringify(listing[0].ratioFin[0].ratio.join("&"));
                                    }
                                    if(listing[0].ownerFin.owner === null){
                                        ofin = "none";
                                    }
                                    else{
                                        ofin = JSON.stringify(listing[0].ownerFin[0].owner.join("&"));
                                    }
                                    if(listing[0].territories[0].terr === null){
                                        territories = "none"
                                    }
                                    else{
                                        territories = JSON.stringify(listing[0].territories[0].terr.join("&"));
                                    }
				    //counter++;
				    //fs.writeFileSync('counter.txt', counter);
				    console.log(original+","+listing[0].element.id+","+listing[0].element.isrc+","+tfin+","+listing[0].customID+","+listing[0].upc+","+afin+","+listing[0].genre[0]+","+rfin+","+ofin+","+listing[0].matchPolicy+","+[listing[0].refStatus]);

				    fs.appendFileSync(socket.id+'.csv', original+","+listing[0].element.id+","+listing[0].element.isrc+","+tfin+","+listing[0].customID+","+listing[0].upc+","+afin+","+listing[0].album+","+listing[0].genre[0]+","+rfin+","+ofin+","+listing[0].matchPolicy+","+territories+","+listing[0].refStatus+"\n");
				    io.sockets.socket(socket.id).emit('progress',{info:listing});
				    console.log(socket.id);
				    //socket[socket.id].emit('progress', {info:listing});
				})
			    })
			}
		    })// i in parse.items
		}
		/*else if(!parse.items){
		    console.log("nothing found of "+element)
		}*/
	    //},k+=500)
	    })
	    console.log(index+" "+assets.length);
	    if(index === assets.length - 1){
		io.sockets.socket(socket.id).emit('progress', {info:"finished"});
		fs.writeFile('counter.txt','0',function(err){
		    if(err){
			console.log(err);
		    }
		    console.log("reset counter.txt")
		})
	    }
	},k+=800)
    //})
    })
}

//function wax()


app.get('#', function(request, response){
    function analytics(data){
	console.log(data);
    }
});

app.get('/download', function(request,response){
    var socket = request.sessionStore.Adrian
    response.download('./'+socket.id+'.csv');
    var k = 0;
    var a = setTimeout(function(){
	fs.renameSync('./'+socket.id+'.csv','./processed/'+clients.id+'.csv')
    },k+=2000)
})

function worker(req){
    var tokenProvider = new TokenProvider('https://accounts.google.com/o/oauth2/token', {
        refresh_token: req._passport.session.user[0].rToken,
        client_id:     GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET
    });
    tokenProvider.getToken(function (err, token) {
        console.log(token);
        tok = token;
        //callback()
	
        /* uploadRead.addListener('end', function(){                                            
           console.log("at the end");                                                           
           res.redirect('/admin');                                                              
           })*/
    })
    
}

server.listen(8070);
console.log("Express server started on 8070");
    
/*
var port = process.env.PORT || 8080;
mongoclient.open(function (err, mongoclient){
    if (err) throw err;
    server.listen(8070);
    console.log("Express server started on 8070")
});*/

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}
//})
//app.listen(8080)


/*
	for(j=0;j<bar.length;j++){
		//console.log(car);
		demand.get('https://www.googleapis.com/youtube/partner/v1/assets/'+bar[j]+'?fetchMatchPolicy=mine&fetchMetadata=mine&onBehalfOfContentOwner=indmusic&fetchOwnership=effective&fetchOwnershipConflicts=true&access_token='+req._passport.session.user[0].token, function(error, response, body){
		    if(error){
			console.log(error);
		    };
		    var lee = JSON.parse(body);
		    console.log(bar[j]);
		})
	}*/


/*
for(i=0;i<foo.length;i++){
	    demand.get('https://www.googleapis.com/youtube/partner/v1/assetSearch?onBehalfOfContentOwner=indmusic&ownershipRestriction=none&q='+foo[i]+'&access_token='+req._passport.session.user[0].token, function(error, response, body){
		if(error){
		    console.log(error);
		};
		var car = JSON.parse(body);
		bar.push(car.items[0].id);
		console.log(car.items[0].id);
		//console.log(bar.length);
	    })
	    console.log(bar.length)
	}
*/
