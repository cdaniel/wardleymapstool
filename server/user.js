/* Copyright 2014 by Krzysztof Daniel

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
var request = require('request');


logger.setLevel('ALL');

var user = function() {
	
	var self = this;
	
	this.createOrUpdateLoginInfo = function(profile, done) {
		
		if (typeof profile === 'undefined' || profile == false) {
			logger.debug('no profile found');
			done(null, false);
			return;
		}
		
		// only google supported for now
		var provider = profile.provider;
		if (provider !== 'google') {
			logger.debug('unknown provider', provider);
			done(null, false);
			return;
		}

        // universal id
        var aggregatedID = provider + profile.id;

		var userData = {};
		userData[provider] = profile;
		
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
						type : profile.id,
						time : Date.now()
					}

				},
				$set : {
					providedProfiles : userData
				}
			},
			"upsert" : true,
			"new" : true
		}, function(err, object) {
			if (err) {
				logger.error(err);
				done(err);
			}
			logger.debug('user found', object._id);
			done(err, object._id);
		});
	};
	

	this.fetchStormPathProviderData = function(account, res, next) {
		account.getProviderData(function(err, providerData) {
			if (err) {
				logger.error(err);
				return;
			}
			if (providerData == null) {
				logger.warn("no data for " + account);
				return;
			}
			if (providerData.providerId === 'google') {
				logger.debug('got google stormpath data for ' + account);
				account.providerData = providerData;
				self.fetchAndStoreGoogleProfile(account, account.providerData.accessToken, next);
			}
		});
	};
	
	this.migrateMapsFromOldLogin = function(account, next){
		var aggregatedID = account.providerData.providerId + account.customData.googleProfile.id;
		db.users.find({
			aggregatedID : aggregatedID
		}).toArray(function(err, obj) {
			if(err){
				logger.error('could not find aggregatedID', aggregatedID, err);
				return;
			}
			if(obj.length > 0){
				var legacyId = obj[0]._id;
				logger.debug('migrating maps', aggregatedID, err);
				var updateResult = db.maps.update({
					userId : legacyId
				}, {
					$set : {
						userIdGoogle : user.href
					}
				}, {
					multi : true
				}, function(error, value){
					logger.debug('Migrated maps', error, value);
					next();
				});
			} else {
				next();
			}
		});
	};

	this.fetchAndStoreGoogleProfile = function(account, token, next) {
		logger.debug('requested google profile  for ' + account);
		request('https://www.googleapis.com/oauth2/v2/userinfo?access_token='
				+ token, function(err, res1, body) {
			if (err) {
				logger.error(err);
				return;
			}
			if (res1.statusCode !== 200) {
				return logger.error('Invalid access token: ' + body);
			} else {
				account.customData.googleProfile = JSON.parse(body);
				account.save(function(err) {
					if (err) {
						logger.error('error while getting user profile' + err);
					}
					logger.debug('stored google profile  for ' + account);
					self.migrateMapsFromOldLogin(account, next);
				});
			}
		});
	};

	this.normalizeLoginInfo = function(account, res, next) {
		//TODO: mix with traditional login
		logger.debug('normalizingLoginInfo for ' + account);
		self.fetchStormPathProviderData(account, res, next);
	};
	
};

exports.user = new user();