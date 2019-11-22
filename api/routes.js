module.exports = function(app, passport) {
    const path = require('path')
    const request = require('request');
    var authHelper = require('../helpers/auth');
    var graph = require('@microsoft/microsoft-graph-client');


// normal routes ===============================================================

	app.get('/', function(req, res) {
		res.sendFile(path.join(__dirname + '/../views/index.html'));
	});

  // PROFILE ==============================
    app.get('/profile', function(req, res) {
	const apiKey = '98a8690c980b6cd6bc84090eae2de8ab';
	let city = req.body.city;
	let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`

	request(url, function (err, response, body) {
	    if(err){
		res.render('index', {weather: null, error: 'Error, please try again'});
	    } else {
		let weather = JSON.parse(body)
		if(weather.main == undefined){
		    res.render('index', {weather: null, error: 'Error, please try again'});
		} else {
		    let weatherText = `It's ${weather.main.temp} °C degrees in ${weather.name}!`;
		    res.render(path.join(__dirname + 'index'), {weather: weatherText, error: null});
		}
	    }
	});
    })
    app.post('/profile', function(req, res) {
      const apiKey = '98a8690c980b6cd6bc84090eae2de8ab';
      let city = req.body.city;
      let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
    
      request(url, function (err, response, body) {
          if(err){
        res.render(path.join(__dirname + 'index'), {weather: null, error: 'Error, please try again'});
          } else {
        let weather = JSON.parse(body)
        if(weather.main == undefined){
            res.render('index', {weather: null, error: 'Error, please try again'});
        } else {
            let weatherText = `It's ${weather.main.temp} °C degrees in ${weather.name}!`;
            res.render(path.join(__dirname + '/../views/index'), {weather: weatherText, error: null});
        }
          }
      });
        })

      // MICROSOFT DASHBOARD ==============================

    app.get('/microhome', async function(req, res, next) {
      let parms = { title: 'Home', active: { home: true } };

      const accessToken = await authHelper.getAccessToken(req.cookies, res);
      const userName = req.cookies.graph_user_name;

      if (accessToken && userName) {
        parms.user = userName;
        parms.debug = `User: ${userName}\nAccess Token: ${accessToken}`;
      } else {
        parms.signInUrl = authHelper.getAuthUrl();
        parms.debug = parms.signInUrl;
      }
      res.render('microhome.hbs', parms);
    });

    app.get('/authorize', async function(req, res, next) {
      // Get auth code
      const code = req.query.code;

      // If code is present, use it
      if (code) {
        try {
          await authHelper.getTokenFromCode(code, res);
          // Redirect to home
          res.redirect('/microhome');
        } catch (error) {
          res.render('error.hbs', { title: 'Error', message: 'Error exchanging code for token', error: error });
        }
      } else {
        // Otherwise complain
        res.render('error.hbs', { title: 'Error', message: 'Authorization error', error: { status: 'Missing code parameter' } });
      }
    });

    app.get('/authorize/signout', function(req, res, next) {
      authHelper.clearCookies(res);
      // Redirect to home
      res.redirect('/profile');
    });

    app.get('/mail', async function(req, res, next) {
      let parms = { title: 'Inbox', active: { inbox: true } };
      const accessToken = await authHelper.getAccessToken(req.cookies, res);
      const userName = req.cookies.graph_user_name;

      if (accessToken && userName) {
        parms.user = userName;

        // Initialize Graph client
        const client = graph.Client.init({
          authProvider: (done) => {
            done(null, accessToken);
          }
        });
        try {
          // Get the 10 newest messages from inbox
          const result = await client
          .api('/me/mailfolders/inbox/messages')
          .top(10)
          .select('subject,from,bodyPreview,receivedDateTime,isRead')
          .orderby('receivedDateTime DESC')
          .get();

          parms.messages = result.value;
          res.render('mail.hbs', parms);
        } catch (err) {
          parms.message = 'Error retrieving messages';
          parms.error = { status: `${err.code}: ${err.message}` };
          parms.debug = JSON.stringify(err.body, null, 2);
          res.render('error', parms);
        }
      } else {
        // Redirect to home
        res.redirect('/microhome');
      }
    });

    app.get('/calendar', async function(req, res, next) {
      let parms = { title: 'Calendar', active: { calendar: true } };

      const accessToken = await authHelper.getAccessToken(req.cookies, res);
      const userName = req.cookies.graph_user_name;

      if (accessToken && userName) {
        parms.user = userName;

        // Initialize Graph client
        const client = graph.Client.init({
          authProvider: (done) => {
            done(null, accessToken);
          }
        });

        // Set start of the calendar view to today at midnight
        const start = new Date(new Date().setHours(0,0,0));
        // Set end of the calendar view to 7 days from start
        const end = new Date(new Date(start).setDate(start.getDate() + 7));

        try {
          // Get the first 10 events for the coming week
          const result = await client
          .api(`/me/calendarView?startDateTime=${start.toISOString()}&endDateTime=${end.toISOString()}`)
          .top(10)
          .select('subject,start,end,attendees')
          .orderby('start/dateTime DESC')
          .get();

          parms.events = result.value;
          res.render('calendar.hbs', parms);
        } catch (err) {
          parms.message = 'Error retrieving events';
          parms.error = { status: `${err.code}: ${err.message}` };
          parms.debug = JSON.stringify(err.body, null, 2);
          res.render('error.hbs', parms);
        }
      } else {
        // Redirect to home
        res.redirect('/microhome');
      }
    });

    app.get('/contacts', async function(req, res, next) {
      let parms = { title: 'Contacts', active: { contacts: true } };

      const accessToken = await authHelper.getAccessToken(req.cookies, res);
      const userName = req.cookies.graph_user_name;

      if (accessToken && userName) {
        parms.user = userName;

        // Initialize Graph client
        const client = graph.Client.init({
          authProvider: (done) => {
            done(null, accessToken);
          }
        });

        try {
          // Get the first 10 contacts in alphabetical order
          // by given name
          const result = await client
          .api('/me/contacts')
          .top(10)
          .select('givenName,surname,emailAddresses')
          .orderby('givenName ASC')
          .get();

          parms.contacts = result.value;
          res.render('contacts.hbs', parms);
        } catch (err) {
          parms.message = 'Error retrieving contacts';
          parms.error = { status: `${err.code}: ${err.message}` };
          parms.debug = JSON.stringify(err.body, null, 2);
          res.render('error.hbs', parms);
        }

      } else {
        // Redirect to home
        res.redirect('/microhome');
      }
    });



  // LOGOUT ==============================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});


  // AUTHENTICATE (FIRST LOGIN) ==================================================

  // locally --------------------------------

  app.get('/login', function(req,res) {
    res.sendFile(path.join(__dirname + '/../views/login.html'));
  })

  app.post('/login', passport.authenticate('local-login', {
			successRedirect : '/profile',
			failureRedirect : '/login',
			failureFlash : true
		}));


  // SIGNUP =================================
  app.get('/signup', function(req, res) {
    res.sendFile(path.join(__dirname + '/../views/signup.html'));
  });

  app.post('/signup', passport.authenticate('local-signup', {
  			successRedirect : '/profile',
  			failureRedirect : '/',
  			failureFlash : true
      }));


  // send to google to do the authentication
  app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));
  app.get('/auth/google/callback',passport.authenticate('google', {
    successRedirect : '/profile',
    failureRedirect : '/'
  }));

  // send to facebook to do the authentication
  app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));
  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect : '/profile',
    failureRedirect : '/'
  }));

  // send to twitter to do the authentication
  app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));
  app.get('/auth/twitter/callback',passport.authenticate('twitter', {
    successRedirect : '/profile',
    failureRedirect : '/'
  }));


// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============

  // locally --------------------------------
  		app.get('/connect/local', function(req, res) {
  			res.render('connect-local.ejs', { message: req.flash('loginMessage') });
  		});
  		app.post('/connect/local', passport.authenticate('local-signup', {
  			successRedirect : '/profile', // redirect to the secure profile section
  			failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
  			failureFlash : true // allow flash messages
  		}));

  	// facebook -------------------------------

  		// send to facebook to do the authentication
  		app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

  		// handle the callback after facebook has authorized the user
  		app.get('/connect/facebook/callback',
  			passport.authorize('facebook', {
  				successRedirect : '/profile',
  				failureRedirect : '/'
  			}));

  	// twitter --------------------------------

  		// send to twitter to do the authentication
  		app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

  		// handle the callback after twitter has authorized the user
  		app.get('/connect/twitter/callback',
  			passport.authorize('twitter', {
  				successRedirect : '/profile',
  				failureRedirect : '/'
  			}));


  	// google ---------------------------------

  		// send to google to do the authentication
  		app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

  		// the callback after google has authorized the user
  		app.get('/connect/google/callback',
  			passport.authorize('google', {
  				successRedirect : '/profile',
  				failureRedirect : '/'
  			}));

// UNLINK ACCOUNTS =============================================================

  app.get('/unlink/local', function(req, res) {
		var user            = req.user;
		user.local.email    = undefined;
		user.local.password = undefined;
		user.save(function(err) {
			res.redirect('/');
		});
	});
  app.get('/unlink/facebook', function(req, res) {
		var user            = req.user;
		user.facebook.token = undefined;
		user.save(function(err) {
			res.redirect('/');
		});
	});

	// twitter --------------------------------
	app.get('/unlink/twitter', function(req, res) {
		var user           = req.user;
		user.twitter.token = undefined;
		user.save(function(err) {
			res.redirect('/');
		});
	});

	// google ---------------------------------
	app.get('/unlink/google', function(req, res) {
		var user          = req.user;
		user.google.token = undefined;
		user.save(function(err) {
			res.redirect('/');
		});
	});

};

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	res.redirect('/');
}
