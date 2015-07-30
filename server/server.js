#!/usr/bin/env node
/* Copyright 2014, 2015 Krzysztof Daniel and Scott Weinstein.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/

'use strict';
var express = require('express');
var fs = require('fs');
var path = require('path');
var logger = require('./util/log').getLogger('server');


function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var WardleyMapsApp = function(configOptions) {

	// Scope.
	var self = this;

	/* ================================================================ */
	/* Helper functions. */
	/* ================================================================ */


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
		self.routes.put = {};
		self.routes.del = {};

		// redirect for yet not implemented
		self.routes.get['/profile'] = function(req, res) {
			res.redirect('/');
		};

		// api

		// 1. create a map
		self.routes.post['/api/map/'] = function(req, res) {
			self.maps.createNewMap(req, res);
		};

		// 2a. update a map (partially)
		self.routes.post['/api/map/partial/:mapid'] = function(req, res) {
			self.maps.partialMapUpdate(req, res, req.params.mapid);
		};

		// 2b. update a map
		self.routes.post['/api/map/:mapid'] = function(req, res) {
			self.maps.updateMap(req, res, req.params.mapid);
		};

		// 4. delete a map
		self.routes.del['/api/map/:mapid'] = function(req, res) {
			self.maps.deleteMap(req, res, req.params.mapid);
		};

		// 4a. delete a map
		// workaround for the lack of get from the link
		// we operate with this as with a regular delete, and we perform
		// redirection to home.
		self.routes.get['/api/map/delete/:mapid'] = function(req, res) {
			self.maps.deleteMap(req, res, req.params.mapid, "/");
		};

		// 5. map editor
		self.routes.get['/map/:mapid'] = function(req, res) {
			self.maps.getMap(req, req.params.mapid, function(map) {
				res.render('mapeditor', {
					map : map,
					user : req.user
				});
			});
		};

		// 6. export
		self.routes.get['/api/svg/:mapid/:name'] = function(req,
				res) {
			self.exportmap.createSVG(req, res, req.params.mapid, req.params.name);
		};
		
		self.routes.get['/api/svgforcedownload/:mapid/:name'] = function(req,
                res) {
            self.exportmap.createSVG(req, res, req.params.mapid, req.params.name, true);
        };

		self.routes.get['/api/thumbnail/:mapid'] = function(req,
				res) {
			self.exportmap.createThumbnail(req, res, req.params.mapid);
		};


		self.routes.get['/api/map/:mapid'] = function(req, res) {
			self.maps.getMap(req, req.params.mapid, res.send.bind(res));
		};


		// 6. analysis
		self.routes.get['/api/map/:mapid/analysis'] = function(req, res) {
			self.maps.getMap(req, req.params.mapid, function(map) {
				//XXX: make this async
				var result = self.analyzer.analyse(map);
				res.render('analysis', {result:result});
			});
		};

		// progress
		self.routes.get['/api/map/:mapid/progressstate'] = function(req, res) {
			self.maps.getProgressState(req, req.params.mapid, function(progress) {
				res.json(progress);
			});
		};


		// progress
		self.routes.put['/api/map/:mapid/progressstate'] = function(req, res) {
			self.maps.advanceProgressState(req, req.params.mapid, function(progress) {
				res.json(progress);
			});
		};
		
		//share
		self.routes.put['/api/map/:mapid/share/:mode'] = function(req, res) {
			self.maps.share(req, req.params.mapid, req.params.mode, function(result) {
				res.json(result);
			});
		};
		
		// help
		self.routes.get['/help/:filename'] = function(req, res) {
			res.render('help/'+req.params.filename);
		};
		
		// precise share requires login
		self.routes.get['/precise/:mapid/:filename'] = function(req, res) {
		    self.exportmap.createSharedSVG(req, res, req.params.mapid, req.params.name);
		};

		// main entry point
		self.routes.get['/'] = function(req, res) {
			self.maps.getMaps(req, function(response) {
				res.render('index', {response : response, user : req.user});
			});
		};
	};

	/**
	 * Initialize the server (express) and create the routes and register the
	 * handlers.
	 */
	self.initializeServer = function() {

		self.createRoutes();
		self.app = express();
		var clientDir = path.join(__dirname, '..', 'client');
		self.app.use(express.cookieParser());
		self.app.use(express.bodyParser());
		self.app.use(express.static(clientDir));
		self.app.use(express.session({
			secret : 'modecommcd90le'
		}));


		var userProvider = require('./user-provider')(self.app);

		// Add handlers for the app (from the routes).
		for ( var r in self.routes.get) {
			self.app.get(r, userProvider.loginRequired, self.routes.get[r]);
		}
		
		self.app.get('/anonymous/:mapid/:filename',function(req, res) {
			self.exportmap.createSharedSVG(req, res, req.params.mapid, req.params.name);
		});

		for ( var r in self.routes.put) {
			self.app.put(r, userProvider.loginRequired, self.routes.put[r]);
		}

		for ( var r in self.routes.post) {
			self.app.post(r, userProvider.loginRequired, self.routes.post[r]);
		}

		for ( var r in self.routes.del) {
			self.app.del(r, userProvider.loginRequired, self.routes.del[r]);
		}

		self.app.set('views', clientDir);
		self.app.set('view engine', 'jade');
	};


	self.start = function() {
		self.db = require('./db')(configOptions.databaseConnectionString);
		
		self.maps = new require('./maps')(self.db);
		self.exportmap = new require('./export')(self.db);
		self.analyzer = require('./analyzer');
		
		var _ = require('underscore');
		self.ipaddress = configOptions.ipaddress || '0.0.0.0';
		self.port = configOptions.port || configOptions.ssl ? 8443 : 8080;
		self.localmode = true;

		self.setupTerminationHandlers();
		self.initializeServer();

		var onStart = _.partial(console.log, '%s: Node server started on %s:%d ...', Date(Date.now()), self.ipaddress, self.port);
		var server;
		if (configOptions.ssl) {
			var https = require('https');
			server = https.createServer(configOptions.ssl, self.app);
		} else {
			var http = require('http');
			server = http.createServer(self.app);
		}
		server.listen(self.port, self.ipaddress, onStart);
	};
};



function getConfig() {
	var config = {};
	try {
		var configFile = (process.argv.length > 2) ? path.join(process.cwd() ,process.argv[2]) :  path.join(__dirname, '../config.json');
		config = require(configFile);
	} catch(ex) {
		console.error(ex, configFile);
	}

	if (config.ssl) {
		config.ssl.key = fs.readFileSync(config.ssl.key);
		config.ssl.cert = fs.readFileSync(config.ssl.cert);
	}

	var mongodbdata = require('./config/mongodbdata').dbdata;
	config.databaseConnectionString = require('./config/mongodbdata').dbdata.getConnectionString();
	
	return config;
}

var wmapp = new WardleyMapsApp(getConfig());
wmapp.start();
