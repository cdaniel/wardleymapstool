//#!/bin/env node
/* Copyright 2014 Krzysztof Daniel

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/

var express = require('express');
var fs = require('fs');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var GoogleAuth = require('./config/googleauth');
var user = require('./user').user;
var logger = require('./util/log').log.getLogger('server');
var maps = require('./maps');
var exportmap = require('./export');

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next(req,res);
	}
	res.redirect('/auth/google');
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var WardleyMapsApp = function() {

	// Scope.
	var self = this;

	/* ================================================================ */
	/* Helper functions. */
	/* ================================================================ */

	/**
	 * Set up server IP address and port # using env variables/defaults.
	 */
	self.setupVariables = function() {
		// Set the environment variables we need.
		self.ipaddress = "127.0.0.1";
		self.port =  8080;
		self.localmode = true;
	};

	
	/**
	 * Populate the cache.
	 */
	self.populateCache = function() {
		if (typeof self.zcache === "undefined") {
			self.zcache = {};
			function cache(name){
				self.zcache[name] = fs.readFileSync('client/' + name);
			};
			cache('index.html');
			cache('index.js');
			cache('mapeditor.html');
			cache('mapeditor.js');
			cache('logout.html');
			cache('background.svg');
			cache('delete.png');
			cache('new-icon.png');
			cache('dom.jsPlumb-1.7.2.js');
			cache('jqBootstrapValidation.js');
		}
	};

	/**
	 * Retrieve entry (content) from cache.
	 * 
	 * @param {string}
	 *            key Key identifying content to retrieve from cache.
	 */
	self.cache_get = function(key) {
		return self.zcache[key];
	};

	/**
	 * terminator === the termination handler Terminate server on receipt of the
	 * specified signal.
	 * 
	 * @param {string}
	 *            sig Signal to terminate on.
	 */
	self.terminator = function(sig) {
		if (typeof sig === "string") {
			console.log('%s: Received %s - terminating Wardley Maps Tool ...',
					Date(Date.now()), sig);
			process.exit(1);
		}
		console.log('%s: Node server stopped.', Date(Date.now()));
	};

	/**
	 * Setup termination handlers (for exit and a list of signals).
	 */
	self.setupTerminationHandlers = function() {
		// Process on exit and signals.
		process.on('exit', function() {
			self.terminator();
		});

		// Removed 'SIGPIPE' from the list - bugz 852598.
		[ 'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
				'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM' ]
				.forEach(function(element, index, array) {
					process.on(element, function() {
						self.terminator(element);
					});
				});
	};

	/* ================================================================ */
	/* App server functions (main app logic here). */
	/* ================================================================ */

	/**
	 * Create the routing table entries + handlers for the application.
	 */
	self.createRoutes = function() {
		self.routes = {};
		self.routes.get = {};
		self.routes.post = {};
		self.routes.del = {};
		
		
		self.routes.get['/logout.html'] = function(req, res) {
				req.logout();
				res.setHeader('Content-Type', 'text/html');
				res.send(self.cache_get('logout.html'));
		};
		
		// passport logout
		self.routes.get['/logout'] = function(req, res) {
			req.logout();
			res.redirect('/logout.html');
		};
		
		//generic access to protected files
		self.routes.get['/:filename'] = function(req, res) {
			ensureAuthenticated(req, res, function(req, res){
				if(endsWith(req.params.filename, ".js")){
					res.setHeader('Content-Type', 'text/javascript');
				}
				if(endsWith(req.params.filename, ".html")){
					res.setHeader('Content-Type', 'text/html');
				}
				if(endsWith(req.params.filename, ".svg")){
					res.setHeader('Content-Type', 'image/svg+xml');
				}
				if(endsWith(req.params.filename, ".png")){
					res.setHeader('Content-Type', 'image/png');
				}
				res.send(self.cache_get(req.params.filename));
			});
		};
		// api
		
		// 1. create a map
		self.routes.post['/api/map/'] = function(req, res) {
			ensureAuthenticated(req, res, function(req, res){
				maps.createNewMap(req, res);
			});
		};
		
		// 2a. update a map (partially)
		self.routes.post['/api/map/partial/:mapid'] = function(req, res) {
			ensureAuthenticated(req, res, function(req, res){
				maps.partialMapUpdate(req, res, req.params.mapid);
			});
		};
		
		// 2b. update a map
		self.routes.post['/api/map/:mapid'] = function(req, res) {
			ensureAuthenticated(req, res, function(req, res){
				maps.updateMap(req, res, req.params.mapid);
			});
		};
		
		
		// 3. get a map
		self.routes.get['/api/map/:mapid'] = function(req, res) {
			ensureAuthenticated(req, res, function(req, res) {
				maps.getMap(req, res, req.params.mapid);
			});
		};
		
		// 4. delete a map
		self.routes.del['/api/map/:mapid'] = function(req, res) {
			ensureAuthenticated(req, res, function(req, res){
				maps.deleteMap(req, res, req.params.mapid);
			});
		};
		
		// 5. lists user maps
		self.routes.get['/api/maps'] = function(req, res) {
			ensureAuthenticated(req, res, function(req, res){
				maps.getMaps(req, res);
			});
		};
		
		// 5. map editor
		self.routes.get['/map/:mapid'] = function(req, res) {
			ensureAuthenticated(req, res, function(req, res){
				res.setHeader('Content-Type', 'text/html');
				res.send(self.cache_get('mapeditor.html'));
			});
		};
		
		// 6. export
		self.routes.get['/api/map/:mapid/export/:size/:name'] = function(req, res) {
			ensureAuthenticated(req, res, function(req, res){
				exportmap.exportmap(req, res, req.params.mapid, req.params.name, req.params.size);
			});
		};
		
		// 7. thumbnail 100x100
		self.routes.get['/api/map/:mapid/thumbnail.png'] = function(req, res) {
			ensureAuthenticated(req, res, function(req, res){
				exportmap.thumbnail(req, res, req.params.mapid, 'thumbnail.png');
			});
		};
		
		// main entry point
		self.routes.get['/'] = function(req, res) {
			ensureAuthenticated(req, res, function(req, res){
					res.setHeader('Content-Type', 'text/html');
					res.send(self.cache_get('index.html'));
				}
			);
		};
	};

	/**
	 * Initialize the server (express) and create the routes and register the
	 * handlers.
	 */
	self.initializeServer = function() {
		// passport initialization - google
		passport
				.use(new GoogleStrategy(
						{
							clientID : GoogleAuth.wardleyMapsGoogleAuth.getClientID(),
							clientSecret : GoogleAuth.wardleyMapsGoogleAuth.getClientSecret(),
							callbackURL : GoogleAuth.wardleyMapsGoogleAuth.getCallbackURL()
						}, function(accessToken, refreshToken, profile, done) {
								user.createOrUpdateLoginInfo(profile, done);
						}));
		

		passport.serializeUser(function(user, done) {
			done(null, user);
		});

		passport.deserializeUser(function(obj, done) {
			done(null, obj);
		});

		self.createRoutes();
		self.app = express.createServer();
		self.app.use(express.cookieParser());
		self.app.use(express.bodyParser());
		self.app.use(express.session({
			secret : 'modecommcd90le'
		}));
		self.app.use(passport.initialize());
		self.app.use(passport.session());

		// Redirect the user to Google for authentication. When
		// complete, Google
		// will redirect the user back to the application at
		// /auth/google/return
		self.app.get('/auth/google', passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/userinfo.email']}));

		// Google will redirect the user to this URL after authentication.
		// Finish
		// the process by verifying the assertion. If valid, the user will be
		// logged in. Otherwise, authentication has failed.
		self.app.get('/auth/google/return', passport.authenticate('google', {
			successRedirect : '/',
			failureRedirect : '/logout'
		}));
		
		// Add handlers for the app (from the routes).
		for ( var r in self.routes.get) {
			self.app.get(r, self.routes.get[r]);
		}
		for ( var r in self.routes.post) {
			self.app.post(r, self.routes.post[r]);
		}
		for ( var r in self.routes.del) {
			self.app.del(r, self.routes.del[r]);
		}

	};

	/**
	 * Initializes the sample application.
	 */
	self.initialize = function() {
		self.setupVariables();
		self.populateCache();
		self.setupTerminationHandlers();

		// Create the express server and routes.
		self.initializeServer();
		
		
		
		// migrate the db....
		maps.migrate();
	};

	/**
	 * Start the server (starts up the sample application).
	 */
	self.start = function() {
		// Start the app on the specific interface (and port).
		self.app.listen(self.port, self.ipaddress, function() {
			console.log('%s: Node server started on %s:%d ...',
					Date(Date.now()), self.ipaddress, self.port);
		});
	};

};

/**
 * main(): Main code.
 */
var wmapp = new WardleyMapsApp();
wmapp.initialize();
wmapp.start();
