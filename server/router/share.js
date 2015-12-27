//#!/bin/env node
/* Copyright 2015 Krzysztof Daniel

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.*/

var logger = require('./../util/log.js').getLogger('share');
var Q = require('q');
Q.longStackSupport = true;

module.exports = function(context, db, authmiddleware, mapsmodule, exporter) {
	var module = {};

	module.PRECISE = 'precise';
	module.ANONYMOUS = 'anonymous';

	/**
	 * This function creates an url that can be used to share a map.
	 * @param req - a request that is used to extract the host of the application running.
	 * @param mapId - id of map to share
	 * @param precise - true/false value indicating whether the map should be available to selected persons only
	 *
	 * @return url to share.
	 *
	 * It is actually necessary to rely on req, because otherwise we would not know where the map is located.
	 */
	module.constructSharingURL = function(req, mapId, precise) {
		var mode = precise ? module.PRECISE : module.ANONYMOUS;

		var protocol = req.headers.referer ? req.headers.referer.split(':')[0]
				: 'http';

		var url_mainpart = protocol + '://' + req.headers.host;
		return url_mainpart + context + '/' + mode + '/' + mapId + '/map.svg';
	};

	/**
	 * input {mapId, progress}
	 * output {mapId, progress}
	 */
	var _anonymousShare = function(params, callback){
		var deferred = Q.defer();
		var mapId = '' + params.mapId; //ensure mapid is a string
		var updateInstruction = {};
		if(params.anonymousShare){
			updateInstruction = {$set:{anonymousShare:true,mapId:mapId}};
		}
		if(params.anonymousUnshare){
			updateInstruction = {$set:{anonymousShare:false,mapId:mapId}};
		}
		db.sharing.update(
			{mapId : mapId}, //query
			updateInstruction, //set value
			{upsert: true},
			function(err, object) {
				if (err) {
						deferred.reject(err);
						return;
				}
				if (object) {
						params.shareResult = {url : module.constructSharingURL(params.req, params.mapId, false)};
						deferred.resolve(params);
				}
		});
		return deferred.promise.nodeify(callback);
	};

	module.share = function(req, res, userId, mapId, mode, callback){
		logger.debug('sharing map ', mapId, ' as ', mode);
		var anonymousShare = mode === 'anonymous';

		var params = {
			req : req,
			res : res,
			mapId : mapId,
		  userId : userId
		};

		if (anonymousShare) {
			params.anonymousShare = true;
			require('./../util/Access')(db).writeAccessCheck(params)
				.then(_anonymousShare)
				.then(callback)
				.catch(function(err){
					if(err){
						logger.err(err);
					}
					callback(null,err);
				}).done();
			return;
		}

		var unshareanonymousShare = mode === 'unshareanonymous';
		if (unshareanonymousShare) {
			params.anonymousUnshare = true;
			require('./../util/Access')(db).writeAccessCheck(params)
				.then(_anonymousShare)
				.then(callback)
				.catch(function(err){
					callback(null,err);
				}).done();
			return;
		}
	};

	module.getInfo = function(req, res, userId, mapId){
		//TODO: do not forget to check user id
		db.sharing.findOne(
			{mapId : '' + req.params.mapid},
			function(err, object) {
				res.setHeader('Content-Type', 'application/json');
				if (err) {
					logger.error(err);
					res.statusCode = 500;
					res.send(JSON.stringify(err));
				}
				if (object && object.anonymousShare === true) {
						res.json({anonymousShare:true,url : module.constructSharingURL(req, mapId, false)});
				} else {
					res.json({anonymousShare:false});
				}
		});
	};

	module.router = require('express').Router();

  // GET /share/anonymous/:mapid/:filename  <- export
	module.router.get('/' + module.ANONYMOUS + '/:mapid/:filename', function(
			req, res) {
				db.sharing.findOne(
					{mapId : '' + req.params.mapid},
					function(err, object) {
						console.log('found matching', err, object);
						if (err) {
							res.setHeader('Content-Type', 'application/json');
							logger.error(err);
							res.statusCode = 500;
							res.send(JSON.stringify(err));
						}
						if (object && object.anonymousShare === true) {
								exporter.createSharedSVG(req, res, req.params.mapid, req.params.name);
						} else {
							res.setHeader('Content-Type', 'image/png');
							res.redirect('/android-icon-192x192.png');
						}
				});
	});

  // GET /share/precise/:mapid/:filename <- export
	module.router.get('/' + module.PRECISE + '/:mapid/:filename',
			authmiddleware, function(req, res) {
				exporter.createSharedSVG(req, res, req.params.mapid,
						req.params.name);
			});

  // /share/map/:mapid/:mode <- set mode
	module.router.put('/map/:mapid/:mode', authmiddleware, function(req, res) {

		var userId = req.user.href;
		//TODO: validation of params
		var mapId = db.ObjectId(req.params.mapid);
		var mode = req.params.mode;

		// this is how we communicate the result
		var callback = function(result, err) {
			//TODO: handle error
			res.json(result.shareResult);
		};

		logger.debug("sharing ", mapId, " for user ", userId, " mode ", mode);

		module.share(req, res, userId, mapId, mode, callback);
	});

	// /share/map/:mapid/:mode <- get mode
	module.router.get('/map/:mapid', authmiddleware, function(req, res) {

		var userId = req.user.href;
		//TODO: validation of params
		var mapId = db.ObjectId(req.params.mapid);

		module.getInfo(req, res, userId, mapId);
	});

	return module;
};
