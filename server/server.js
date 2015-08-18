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


	self.start = function() {

	    var app = express();

	    var clientDir = path.join(__dirname, '..', 'client');
	    app.use(require('cookie-parser')());
	    app.use(require('body-parser').json());
	    app.use(require('body-parser').urlencoded());
	    app.use(express.static(clientDir));
	    app.use(require('express-session')({
	        secret : 'modecommcd90le',
	        resave : false,
	        saveUninitialized : false
	    }));
	    app.use(require('morgan')());
	    app.use(require('errorhandler')());

	    var userProvider = require('./user-provider')(app);

        var share = [null];
	    
	    self.db = require('./db')(configOptions.databaseConnectionString);
		self.exportmap = new require('./export')(self.db);
		self.maps = new require('./maps')(self.db, share);
		
		share[0] = require('./router/share.js')('/share', self.db, userProvider.loginRequired, self.maps, self.exportmap);
		
		app.use('/share', share[0].router);
		app.use('/profile', userProvider.loginRequired, require('./router/profilerouter.js')().router);
		app.use('/api', userProvider.authenticationRequired, require('./router/apirouter.js')(self.maps, self.exportmap).router);
		app.use('/', userProvider.loginRequired, require('./router/mainrouter.js')(self.maps).router);
		
		
		// jade configuration
        app.set('views', clientDir);
        app.set('view engine', 'jade');
		
		var _ = require('underscore');
		self.ipaddress = configOptions.ipaddress || '0.0.0.0';
		self.port = configOptions.port || configOptions.ssl ? 8443 : 8080;
		self.localmode = true;

		self.setupTerminationHandlers();

		var onStart = _.partial(console.log, '%s: Node server started on %s:%d ...', Date(Date.now()), self.ipaddress, self.port);
		var server;
		if (configOptions.ssl) {
			var https = require('https');
			server = https.createServer(configOptions.ssl, app);
		} else {
			var http = require('http');
			server = http.createServer(app);
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
