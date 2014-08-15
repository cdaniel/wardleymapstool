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

var db = require('./db').database;
var logger = require('./util/log.js').log.getLogger('user');
logger.setLevel('ALL');

var user = function() {

	this.createOrUpdateLoginInfo = function(profile, done) {
		
		if (typeof profile === 'undefined' || profile == false) {
			logger.debug('no profile found');
			done(null, false);
		}
		
		// only google supported for now
		var provider = profile.provider;
		if (provider !== 'google') {
			logger.debug('unknown provider', provider);
			done(null, false);
		}

		// universal id
		var aggregatedID = provider + profile.id;
		
		db.users.findAndModify({
			query : {
				aggregatedID : aggregatedID
			},
			update : {
				$inc : {
					loginCount : 1
				},
				$push : {
					loginHistory : {
						type : provider,
						time : Date.now()
					}

				}
			},
			"upsert" : true
		}, function(err, object) {
			if (err != null) {
				logger.error(err);
				done(err);
			}
			logger.debug('user found', object._id);
			done(err, object._id);
		});
	};

};

exports.user = new user();